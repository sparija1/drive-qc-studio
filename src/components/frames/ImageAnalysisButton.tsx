import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { imageAnalyzer } from "@/lib/imageAnalysis";
import { useUpdateFrame } from "@/hooks/useFrames";
import { Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ImageAnalysisButtonProps {
  frames: Array<{
    id: string;
    frame_number: number;
    image_url: string | null;
    weather_condition: string | null;
    time_of_day: string | null;
    scene_type: string | null;
    lane_count: number | null;
    accuracy: number | null;
  }>;
  onAnalysisComplete?: () => void;
}

export const ImageAnalysisButton = ({ frames, onAnalysisComplete }: ImageAnalysisButtonProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const { toast } = useToast();
  const updateFrame = useUpdateFrame();

  const analyzeAllFrames = async () => {
    if (frames.length === 0) {
      toast({
        title: "No frames to analyze",
        description: "Please upload some frames first",
        variant: "destructive"
      });
      return;
    }

    const framesToAnalyze = frames.filter(frame => frame.image_url);
    
    if (framesToAnalyze.length === 0) {
      toast({
        title: "No images found",
        description: "No frames have image URLs to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('analyzing');
    setProgress(0);

    try {
      toast({
        title: "Starting analysis",
        description: `Analyzing ${framesToAnalyze.length} frames using AI models...`
      });

      // Initialize the analyzer
      await imageAnalyzer.initialize();
      
      let completed = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const frame of framesToAnalyze) {
        if (!frame.image_url) continue;
        
        try {
          console.log(`Analyzing frame ${frame.frame_number}...`);
          
          const result = await imageAnalyzer.analyzeImage(frame.image_url);
          
          // Update the frame with analysis results
          await updateFrame.mutateAsync({
            id: frame.id,
            data: {
              weather_condition: result.weather,
              scene_type: result.roadType,
              lane_count: result.lanes,
              accuracy: result.confidence
            }
          });

          successCount++;
          console.log(`Successfully analyzed frame ${frame.frame_number}`);
          
        } catch (error) {
          console.error(`Failed to analyze frame ${frame.frame_number}:`, error);
          errorCount++;
        }
        
        completed++;
        setProgress((completed / framesToAnalyze.length) * 100);
      }

      setAnalysisStatus('complete');
      
      toast({
        title: "Analysis complete",
        description: `Successfully analyzed ${successCount} frames. ${errorCount > 0 ? `${errorCount} frames failed.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisStatus('error');
      
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze images",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      
      // Reset status after a delay
      setTimeout(() => {
        setAnalysisStatus('idle');
        setProgress(0);
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (analysisStatus) {
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (analysisStatus) {
      case 'analyzing':
        return `Analyzing... ${Math.round(progress)}%`;
      case 'complete':
        return 'Analysis Complete';
      case 'error':
        return 'Analysis Failed';
      default:
        return 'Analyze Images with AI';
    }
  };

  const framesToAnalyze = frames.filter(frame => frame.image_url);

  return (
    <div className="space-y-2">
      <Button
        onClick={analyzeAllFrames}
        disabled={isAnalyzing || framesToAnalyze.length === 0}
        className="w-full"
        size="lg"
      >
        {getStatusIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>
      
      {framesToAnalyze.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{framesToAnalyze.length} frames with images found</span>
          <Badge variant="outline" className="text-xs">
            Browser AI
          </Badge>
        </div>
      )}
      
      {isAnalyzing && progress > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};