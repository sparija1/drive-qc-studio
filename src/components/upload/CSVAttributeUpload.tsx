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
      // Get sequence frames
      const { data: frames, error: framesError } = await supabase
        .from('frames')
        .select('id, frame_number')
        .eq('sequence_id', sequenceId)
        .order('frame_number');

      if (framesError) throw framesError;

      const frameMap = new Map(frames.map(frame => [frame.frame_number.toString(), frame.id]));
      
      const updatePromises = parsedData.map(async (row, index) => {
        const frameId = frameMap.get(row.frame_id);
        if (!frameId) return;

        // Map CSV columns to frame attributes
        const updateData: any = {};
        
        if (row.time_of_day) updateData.scene_type = row.time_of_day;
        if (row.road_type) updateData.traffic_density = row.road_type;
        if (row.weather) updateData.weather_condition = row.weather;
        if (row.traffic_density) updateData.traffic_density = row.traffic_density;
        if (row.accuracy) updateData.accuracy = parseFloat(row.accuracy);
        if (row.confidence_score) updateData.confidence_score = parseFloat(row.confidence_score);
        if (row.vehicle_count) updateData.vehicle_count = parseInt(row.vehicle_count);
        if (row.pedestrian_count) updateData.pedestrian_count = parseInt(row.pedestrian_count);
        if (row.lane_count) updateData.lane_count = parseInt(row.lane_count);
        if (row.status) updateData.status = row.status;
        if (row.notes) updateData.notes = row.notes;

        const { error } = await supabase
          .from('frames')
          .update(updateData)
          .eq('id', frameId);

        if (error) throw error;

        // Update progress
        const progress = ((index + 1) / parsedData.length) * 100;
        setUploadProgress(progress);
      });

      await Promise.all(updatePromises);

      toast({
        title: "Attributes uploaded!",
        description: `Successfully updated ${parsedData.length} frame attributes.`
      });

      // Reset form
      setCsvFile(null);
      setParsedData([]);
      setPreviewColumns([]);
      setUploadProgress(0);
      onUploadComplete();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload attributes.",
        variant: "destructive"
      });
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
        <p>frame_id (required), time_of_day, road_type, weather, traffic_density, accuracy, confidence_score, vehicle_count, pedestrian_count, lane_count, status, notes</p>
      </div>
    </div>
  );
};