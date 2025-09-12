import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus } from "lucide-react";
import { useCreateSequence } from "@/hooks/useSequences";

const formSchema = z.object({
  name: z.string().min(1, "Sequence name is required"),
  images: z.any().refine((files) => files?.length > 0, "At least one image is required"),
});

interface CreateSequenceFormProps {
  pipelineId: string;
}

export const CreateSequenceForm = ({ pipelineId }: CreateSequenceFormProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const createSequence = useCreateSequence();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      images: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setUploading(true);
    
    try {
      // Create the sequence first
      await createSequence.mutateAsync({
        pipeline_id: pipelineId,
        name: values.name,
      });
      
      // TODO: Implement image upload to storage
      // For now we just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      form.reset();
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground hover:shadow-glow transition-smooth">
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Sequence</DialogTitle>
          <DialogDescription>
            Upload images to create a new sequence for annotation and QC review.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sequence name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="images"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Upload Images</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        {...rest}
                      />
                      <p className="text-sm text-muted-foreground">
                        {value?.length > 0 ? `${value.length} files selected` : "Click to upload images or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports JPG, PNG, WEBP formats
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Processing..." : "Create Sequence"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};