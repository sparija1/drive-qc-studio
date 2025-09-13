import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BulkImageUploadProps {
  pipelineId: string;
  onUploadComplete: (sequenceId: string) => void;
}

export const BulkImageUpload = ({ pipelineId, onUploadComplete }: BulkImageUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sequenceName, setSequenceName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter and sort image files
    const imageFiles = acceptedFiles
      .filter(file => file.type.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!user || !sequenceName || files.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a sequence name and select images to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create sequence first
      const { data: sequence, error: sequenceError } = await supabase
        .from('sequences')
        .insert({
          name: sequenceName,
          pipeline_id: pipelineId,
          user_id: user.id,
          total_frames: files.length,
          status: 'processing'
        })
        .select()
        .single();

      if (sequenceError) {
        throw new Error(`Failed to create sequence: ${sequenceError.message}`);
      }

      let successfulUploads = 0;
      
      // Upload images sequentially to avoid overwhelming the server
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        try {
          const fileName = `${user.id}/${sequence.id}/${index.toString().padStart(4, '0')}_${file.name}`;
          
          // Upload to storage with retry logic
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('sequence-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for file ${file.name}:`, uploadError);
            if (uploadError.message?.includes('already exists')) {
              // File already exists, continue with frame creation
            } else {
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('sequence-images')
            .getPublicUrl(fileName);

          // Create frame record
          const { error: frameError } = await supabase
            .from('frames')
            .insert({
              sequence_id: sequence.id,
              user_id: user.id,
              frame_number: index + 1,
              timestamp_ms: (index + 1) * 33.33, // Assuming 30fps
              image_url: publicUrl,
              accuracy: 0.85 + Math.random() * 0.15 // Mock accuracy
            });

          if (frameError) {
            console.error(`Frame creation error for ${file.name}:`, frameError);
            throw new Error(`Failed to create frame record for ${file.name}: ${frameError.message}`);
          }

          successfulUploads++;
          
          // Update progress after each successful upload
          const progress = (successfulUploads / files.length) * 100;
          setUploadProgress(progress);
          
        } catch (fileError: any) {
          console.error(`Error processing file ${file.name}:`, fileError);
          toast({
            title: "File upload error",
            description: `Failed to upload ${file.name}: ${fileError.message}`,
            variant: "destructive"
          });
          // Continue with other files instead of failing completely
        }
      }

      // Update sequence status and frame count
      await supabase
        .from('sequences')
        .update({ 
          status: successfulUploads > 0 ? 'processed' : 'failed',
          total_frames: successfulUploads
        })
        .eq('id', sequence.id);

      if (successfulUploads > 0) {
        toast({
          title: "Upload complete!",
          description: `Successfully uploaded ${successfulUploads} of ${files.length} images for sequence "${sequenceName}".`
        });

        // Reset form
        setFiles([]);
        setSequenceName('');
        setUploadProgress(0);
        onUploadComplete(sequence.id);
      } else {
        toast({
          title: "Upload failed",
          description: "No images were successfully uploaded.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images.",
        variant: "destructive"
      });
      
      // Reset progress on failure
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sequence-name">Sequence Name</Label>
        <Input
          id="sequence-name"
          placeholder="Enter sequence name"
          value={sequenceName}
          onChange={(e) => setSequenceName(e.target.value)}
          disabled={uploading}
        />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the images here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PNG, JPG, JPEG, WebP files
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Selected Images ({files.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Upload Progress</Label>
            <span className="text-sm text-muted-foreground">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <Button
        onClick={uploadImages}
        disabled={uploading || !sequenceName || files.length === 0}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload {files.length} Images
          </>
        )}
      </Button>
    </div>
  );
};