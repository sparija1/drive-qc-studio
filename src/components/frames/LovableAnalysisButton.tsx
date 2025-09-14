import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUpdateFrame } from "@/hooks/useFrames";
import { classifyImageUrl } from "@/api/imageClassification";
import { Brain, Loader2, CheckCircle, AlertCircle, Zap, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LovableAnalysisButtonProps {
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

export const LovableAnalysisButton = ({ frames, onAnalysisComplete }: LovableAnalysisButtonProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();
  const updateFrame = useUpdateFrame();

  const mapWeatherToDb = (weather: string): string => {
    const mapping: { [key: string]: string } = {
      'Sunny': 'sunny',
      'Cloudy': 'cloudy',
      'Rainfall': 'rainfall',
      'Snowfall': 'snowfall'
    };
    return mapping[weather] || 'sunny';
  };

  const mapTimeToDb = (time: string): string => {
    const mapping: { [key: string]: string } = {
      'Day': 'day',
      'Night': 'night'
    };
    return mapping[time] || 'day';
  };

  const mapRoadToDb = (road: string): string => {
    const mapping: { [key: string]: string } = {
      'Highway': 'highway',
      'City': 'city',
      'Suburb': 'suburb',
      'Rural': 'rural'
    };
    return mapping[road] || 'city';
  };

  const mapLanesToDb = (lanes: string): number => {
    if (lanes.includes('one lane')) return 1;
    if (lanes.includes('two way traffic')) return 2;
    if (lanes.includes('more than two lanes')) return 3;
    return 2;
  };

  const analyzeAllFrames = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Hugging Face API key to proceed",
        variant: "destructive"
      });
      return;
    }

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
        title: "Starting Hugging Face analysis",
        description: `Analyzing ${framesToAnalyze.length} frames using HF CLIP model...`
      });

      let completed = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const frame of framesToAnalyze) {
        if (!frame.image_url) continue;
        
        try {
          console.log(`Analyzing frame ${frame.frame_number}...`);
          
          const result = await classifyImageUrl(frame.image_url, apiKey);
          
          console.log(`Classification result for frame ${frame.frame_number}:`, result);
          
          // Update the frame with analysis results
          await updateFrame.mutateAsync({
            id: frame.id,
            data: {
              weather_condition: mapWeatherToDb(result.weather),
              time_of_day: mapTimeToDb(result['day-night']),
              scene_type: mapRoadToDb(result['road-type']),
              lane_count: mapLanesToDb(result.lanes),
              accuracy: result.confidence || 0.8
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
        return <Zap className="h-4 w-4" />;
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
        return 'Analyze with HuggingFace';
    }
  };

  const framesToAnalyze = frames.filter(frame => frame.image_url);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hf-api-key" className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" />
          Hugging Face API Key
        </Label>
        <Input
          id="hf-api-key"
          type="password"
          placeholder="Enter your HF API key (hf_...)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Get your API key from{' '}
          <a 
            href="https://huggingface.co/settings/tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Hugging Face Settings
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Button
          onClick={analyzeAllFrames}
          disabled={isAnalyzing || framesToAnalyze.length === 0 || !apiKey.trim()}
          className="w-full"
          size="lg"
          variant="default"
        >
          {getStatusIcon()}
          <span className="ml-2">{getButtonText()}</span>
        </Button>
        
        {framesToAnalyze.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{framesToAnalyze.length} frames with images found</span>
            <Badge variant="outline" className="text-xs">
              HuggingFace CLIP
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
    </div>
  );
};