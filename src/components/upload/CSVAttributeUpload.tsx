import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface CSVAttributeUploadProps {
  sequenceId: string;
  onUploadComplete: () => void;
}

interface CSVRow {
  frame_id: string;
  [key: string]: string;
}

export const CSVAttributeUpload = ({ sequenceId, onUploadComplete }: CSVAttributeUploadProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      // Parse CSV for preview
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const data = results.data as CSVRow[];
          setParsedData(data.filter(row => row.frame_id));
          setPreviewColumns(Object.keys(data[0] || {}));
        },
        error: (error) => {
          toast({
            title: "CSV parsing error",
            description: error.message,
            variant: "destructive"
          });
        }
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const uploadAttributes = async () => {
    if (!csvFile || parsedData.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please select a valid CSV file with frame attributes.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get sequence frames with better error handling
      const { data: frames, error: framesError } = await supabase
        .from('frames')
        .select('id, frame_number')
        .eq('sequence_id', sequenceId)
        .order('frame_number');

      if (framesError) {
        throw new Error(`Failed to fetch frames: ${framesError.message}`);
      }

      if (!frames || frames.length === 0) {
        throw new Error('No frames found for this sequence. Please upload images first.');
      }

      const frameMap = new Map(frames.map(frame => [frame.frame_number.toString(), frame.id]));
      console.log('Available frames:', frames.map(f => ({ number: f.frame_number, id: f.id })));
      console.log('CSV frame_id values:', parsedData.map(row => row.frame_id));
      
      let successfulUpdates = 0;
      let skippedRows = 0;
      
      // Process rows sequentially to avoid overwhelming the database
      for (let index = 0; index < parsedData.length; index++) {
        const row = parsedData[index];
        
        try {
          // Try to map frame_id (from CSV) to actual frame ID in database
          const frameId = frameMap.get(row.frame_id);
          if (!frameId) {
            console.warn(`Frame number ${row.frame_id} not found in frames [${Array.from(frameMap.keys()).join(', ')}], skipping row ${index + 1}`);
            skippedRows++;
            continue;
          }

          // Map CSV columns to frame attributes with validation
          const updateData: any = {};
          
          if (row.time_of_day) updateData.scene_type = row.time_of_day;
          if (row.road_type) updateData.traffic_density = row.road_type;
          if (row.weather) updateData.weather_condition = row.weather;
          if (row.traffic_density) updateData.traffic_density = row.traffic_density;
          
          // Validate numeric fields
          if (row.accuracy) {
            const accuracy = parseFloat(row.accuracy);
            if (!isNaN(accuracy) && accuracy >= 0 && accuracy <= 1) {
              updateData.accuracy = accuracy;
            }
          }
          if (row.confidence_score) {
            const confidence = parseFloat(row.confidence_score);
            if (!isNaN(confidence) && confidence >= 0 && confidence <= 1) {
              updateData.confidence_score = confidence;
            }
          }
          if (row.vehicle_count) {
            const vehicleCount = parseInt(row.vehicle_count);
            if (!isNaN(vehicleCount) && vehicleCount >= 0) {
              updateData.vehicle_count = vehicleCount;
            }
          }
          if (row.pedestrian_count) {
            const pedestrianCount = parseInt(row.pedestrian_count);
            if (!isNaN(pedestrianCount) && pedestrianCount >= 0) {
              updateData.pedestrian_count = pedestrianCount;
            }
          }
          if (row.lane_count) {
            const laneCount = parseInt(row.lane_count);
            if (!isNaN(laneCount) && laneCount >= 0) {
              updateData.lane_count = laneCount;
            }
          }
          if (row.status) updateData.status = row.status;
          if (row.notes) updateData.notes = row.notes;

          // Only update if we have data to update
          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
              .from('frames')
              .update(updateData)
              .eq('id', frameId);

            if (error) {
              console.error(`Error updating frame ${row.frame_id}:`, error);
              throw new Error(`Failed to update frame ${row.frame_id}: ${error.message}`);
            }
            
            successfulUpdates++;
          }
          
          // Update progress after each row
          const progress = ((index + 1) / parsedData.length) * 100;
          setUploadProgress(progress);
          
        } catch (rowError: any) {
          console.error(`Error processing row ${index + 1}:`, rowError);
          toast({
            title: "Row processing error",
            description: `Error in row ${index + 1}: ${rowError.message}`,
            variant: "destructive"
          });
          // Continue with other rows instead of failing completely
        }
      }

      if (successfulUpdates > 0) {
        toast({
          title: "Attributes uploaded!",
          description: `Successfully updated ${successfulUpdates} frame attributes.${skippedRows > 0 ? ` ${skippedRows} rows were skipped.` : ''}`
        });

        // Reset form
        setCsvFile(null);
        setParsedData([]);
        setPreviewColumns([]);
        setUploadProgress(0);
        onUploadComplete();
      } else {
        toast({
          title: "No updates made",
          description: "No frame attributes were updated. Please check your CSV format.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload attributes.",
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
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-md font-medium">Drop the CSV file here...</p>
        ) : (
          <div>
            <p className="text-md font-medium mb-1">
              Drag & drop CSV file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              CSV should have frame_id column and attribute columns
            </p>
          </div>
        )}
      </div>

      {csvFile && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{csvFile.name}</span>
            <Badge variant="outline" className="text-xs">{parsedData.length} rows</Badge>
          </div>

          {previewColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Detected Columns:</p>
              <div className="flex flex-wrap gap-1">
                {previewColumns.map(column => (
                  <Badge key={column} variant="secondary" className="text-xs">
                    {column}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Sample Data (First 2 rows):</p>
              <div className="bg-muted p-2 rounded text-xs max-h-32 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(parsedData.slice(0, 2), null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Upload Progress</span>
            <span className="text-xs text-muted-foreground">
              {uploadProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <Button
        onClick={uploadAttributes}
        disabled={uploading || !csvFile || parsedData.length === 0}
        className="w-full"
        size="sm"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-3 w-3" />
            Upload Attributes
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded">
        <p><strong>Supported columns:</strong></p>
        <p><strong>frame_id</strong> - Frame number (1, 2, 3, etc.) matching the order of uploaded images</p>
        <p>time_of_day, road_type, weather, traffic_density, accuracy, confidence_score, vehicle_count, pedestrian_count, lane_count, status, notes</p>
      </div>
    </div>
  );
};