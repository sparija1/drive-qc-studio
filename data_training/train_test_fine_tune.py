import os
import io
import pandas as pd
import numpy as np
from PIL import Image, ImageEnhance
import cv2
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPProcessor, CLIPModel
import torch.nn as nn
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed

# -------------------------
# Local paths
# -------------------------
base_dir = "dataset"
orig_dir = os.path.join(base_dir, "original")
aug_dir = os.path.join(base_dir, "augmented")
os.makedirs(orig_dir, exist_ok=True)
os.makedirs(aug_dir, exist_ok=True)

# -------------------------
# Augmentation Functions
# -------------------------
def simulate_night(pil_image, darkness_factor=0.4):
    enhancer = ImageEnhance.Brightness(pil_image)
    return enhancer.enhance(darkness_factor)

def simulate_rain(image, rain_density=0.003, rain_length=15,
                  rain_color=(200,200,200), rain_opacity=0.3):
    image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    h, w, _ = image_cv.shape
    rain_layer = np.zeros_like(image_cv, dtype=np.uint8)
    num_drops = int(w * h * rain_density)
    for _ in range(num_drops):
        x = np.random.randint(0, w)
        y = np.random.randint(0, h)
        length = rain_length + np.random.randint(-5,5)
        angle = np.random.randint(-10,10)
        end_x = int(x + length * np.sin(np.radians(angle)))
        end_y = int(y + length * np.cos(np.radians(angle)))
        cv2.line(rain_layer,(x,y),(end_x,end_y),rain_color,1)
    rain_layer = cv2.GaussianBlur(rain_layer,(3,3),0)
    blended = cv2.addWeighted(image_cv,1,rain_layer,rain_opacity,0)
    return Image.fromarray(cv2.cvtColor(blended, cv2.COLOR_BGR2RGB))

# -------------------------
# Helper to process single row
# -------------------------
def process_row(row_dict, orig_dir, aug_dir):

    frame_id = str(row_dict["frame_id"])
    reference_name = row_dict["reference_name"]
    results = []

    # Download original image
    img_path = f"{reference_name}/{frame_id}.png"
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    # Save original locally
    orig_path = os.path.join(orig_dir, f"{frame_id}.png")
    pil_img.save(orig_path)
    row_copy = row_dict.copy()
    row_copy["image_path"] = orig_path
    results.append(row_copy)

    # Night augmentation (only for Day + Sunny)
    if row_dict["day_night"] == "Day" and row_dict["weather"] == "Sunny":
        night_img = simulate_night(pil_img)
        night_path = os.path.join(aug_dir, f"{frame_id}_night.png")
        night_img.save(night_path)
        night_row = row_dict.copy()
        night_row["image_path"] = night_path
        night_row["day_night"] = "Night"
        results.append(night_row)

    # Rain augmentation (specific conditions)
    conditions = [
        (row_dict["road_type"] == "Suburbs" and row_dict["day_night"] == "Night" and row_dict["weather"] == "Cloudy"),
        (row_dict["road_type"] == "Rural"   and row_dict["day_night"] == "Day"   and row_dict["weather"] == "Cloudy"),
        (row_dict["road_type"] == "Rural"   and row_dict["day_night"] == "Night" and row_dict["weather"] == "Cloudy"),
    ]
    if any(conditions):
        rain_img = simulate_rain(pil_img)
        rain_path = os.path.join(aug_dir, f"{frame_id}_rain.png")
        rain_img.save(rain_path)
        rain_row = row_dict.copy()
        rain_row["image_path"] = rain_path
        rain_row["weather"] = "Rainfall"
        results.append(rain_row)

    return results

# -------------------------
# Multiprocess dataset builder
# -------------------------
def build_augmented_dataset_parallel(excel_file, orig_dir, aug_dir,max_workers=8):
    df = pd.read_excel(excel_file)
    all_rows = []

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_row, row._asdict(), orig_dir, aug_dir) 
                   for row in df.itertuples(index=False)]
        for future in tqdm(as_completed(futures), total=len(futures), desc="Processing Rows"):
            all_rows.extend(future.result())

    full_df = pd.DataFrame(all_rows)

    # Capitalize important columns
    for col in ["road_type", "day_night", "weather"]:
        if col in full_df.columns:
            full_df[col] = full_df[col].str.capitalize()

    # Count breakdown
    orig_count = len(df)
    night_count = len(full_df[full_df["image_path"].str.contains("_night")])
    rain_count = len(full_df[full_df["image_path"].str.contains("_rain")])
    final_count = len(full_df)

    print(f"Original rows: {orig_count}")
    print(f"Night rows: {night_count}")
    print(f"Rain rows: {rain_count}")
    print(f"Final dataset rows: {final_count}")

    full_df.to_csv("augmented_dataset_final.csv", index=False)
    print(f"✅ Saved dataset to augmented_dataset_final.csv")
    return full_df

# -------------------------
# Dataset Class
# -------------------------
class LocalImageDataset(Dataset):
    def __init__(self, csv_file, processor):
        self.data = pd.read_csv(csv_file)
        self.processor = processor
        self.label_spaces = {
            "road_type":["Highway","City","Suburbs","Rural"],
            "day_night":["Day","Night"],
            "weather":["Sunny","Cloudy","Rainfall"],
            "Lane":["more than 2 lanes","two way traffic","one lane"]
        }

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        image = Image.open(row["image_path"]).convert("RGB")
        pixel_values = self.processor(images=image, return_tensors="pt")["pixel_values"].squeeze(0)
        labels = {task:self.label_spaces[task].index(row[task]) for task in self.label_spaces if task in row}
        return pixel_values, labels

def collate_fn(batch):
    pixel_values = torch.stack([item[0] for item in batch])
    labels = {task: torch.tensor([item[1][task] for item in batch],dtype=torch.long)
              for task in batch[0][1].keys()}
    return pixel_values, labels

# -------------------------
# Training Function
# -------------------------
def train_clip_full(train_csv, save_path="clip_finetuned_full.pt",
                    batch_size=8, epochs=3, patience=2):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    for param in model.vision_model.parameters():
        param.requires_grad = False
    dropout = nn.Dropout(0.3)

    train_dataset = LocalImageDataset(train_csv, processor)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)

    optimizer = torch.optim.AdamW(filter(lambda p:p.requires_grad, model.parameters()), lr=5e-6)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    loss_fn = nn.CrossEntropyLoss()

    task_text_embeds = {}
    for task, task_labels in train_dataset.label_spaces.items():
        text_inputs = [f"a photo of {lbl}" for lbl in task_labels]
        text_features = processor(text=text_inputs, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            text_embeds = model.get_text_features(**text_features)
            text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
        task_text_embeds[task] = text_embeds

    best_loss = float("inf")
    trigger_times = 0

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for pixel_values, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}"):
            pixel_values = pixel_values.to(device)
            image_embeds = model.get_image_features(pixel_values)
            image_embeds = dropout(image_embeds)
            image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)

            batch_loss = 0.0
            for task, text_embeds in task_text_embeds.items():
                logits = image_embeds @ text_embeds.T
                target = labels[task].to(device)
                batch_loss += loss_fn(logits, target)
            batch_loss /= len(task_text_embeds)

            optimizer.zero_grad()
            batch_loss.backward()
            optimizer.step()
            total_loss += batch_loss.item()

        scheduler.step()
        avg_loss = total_loss/len(train_loader)
        print(f"Epoch {epoch+1}: Train Loss = {avg_loss:.4f}")

        # Early stopping
        if avg_loss < best_loss:
            best_loss = avg_loss
            torch.save(model.state_dict(), save_path)
            trigger_times = 0
            print(f"✅ Model improved. Saved to {save_path}")
        else:
            trigger_times +=1
            if trigger_times >= patience:
                print(f"⏹ Early stopping at epoch {epoch+1}")
                break

    return model, processor

# -------------------------
# Evaluation Function
# -------------------------
def evaluate_clip(model, processor, test_csv):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    test_dataset = LocalImageDataset(test_csv, processor)
    test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False, collate_fn=collate_fn)

    task_text_embeds = {}
    for task, task_labels in test_dataset.label_spaces.items():
        text_inputs = [f"a photo of {lbl}" for lbl in task_labels]
        text_features = processor(text=text_inputs, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            text_embeds = model.get_text_features(**text_features)
            text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)
        task_text_embeds[task] = text_embeds

    model.eval()
    correct = {task:0 for task in test_dataset.label_spaces}
    total = {task:0 for task in test_dataset.label_spaces}

    with torch.no_grad():
        for pixel_values, labels in tqdm(test_loader, desc="Evaluating Test Data"):
            pixel_values = pixel_values.to(device)
            image_embeds = model.get_image_features(pixel_values)
            image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)

            for task, text_embeds in task_text_embeds.items():
                logits = image_embeds @ text_embeds.T
                target = labels[task].to(device)
                preds = torch.argmax(logits, dim=-1)
                correct[task] += (preds==target).sum().item()
                total[task] += target.size(0)

    print("\nTest Accuracy per Task:")
    for task in test_dataset.label_spaces:
        acc = 100.0 * correct[task]/total[task]
        print(f"  {task}: {acc:.2f}%")

# -------------------------
# Run everything
# -------------------------
if __name__ == "__main__":
    # Step 1: Build dataset (original + night + rain)
    full_df = build_augmented_dataset_parallel("Downloads/Final_train_new.xlsx",
                                               orig_dir, aug_dir)
    print("✅ Dataset ready for training")

    # Step 2: Train on special-augmented dataset
    model, processor = train_clip_full("augmented_dataset_final.csv",
                                       save_path="clip_finetuned_final.pt",
                                       epochs=3, batch_size=8)
    print("✅ Training complete")

    # Step 3: Evaluate on separate test set
    # evaluate_clip(model, processor, "Downloads/Final_test.csv")
    print("✅ Done")
