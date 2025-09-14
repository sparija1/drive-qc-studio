import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, CheckCircle, AlertCircle, Server } from "lucide-react";

interface ServerAnalysisButtonProps {
  sequenceId: string;
  onAnalysisComplete?: () => void;
}

export const ServerAnalysisButton = ({ sequenceId, onAnalysisComplete }: ServerAnalysisButtonProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const { toast } = useToast();

  const analyzeFramesOnServer = async () => {
    if (!sequenceId) {
      toast({
        title: "Missing sequence ID",
        description: "Cannot analyze frames without a sequence ID",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('analyzing');

    try {
      toast({
        title: "Starting server analysis",
        description: "Analyzing frames using Hugging Face models on the server..."
      });

      const { data, error } = await supabase.functions.invoke('analyze-frames', {
        body: { sequenceId }
      });

      if (error) {
        throw new Error(error.message);
      }

      setAnalysisStatus('complete');
      
      toast({
        title: "Analysis complete",
        description: data.message || "Frames analyzed successfully",
        variant: "default"
      });

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

    } catch (error) {
      console.error('Server analysis failed:', error);
      setAnalysisStatus('error');
      
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze frames on server",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      
      // Reset status after a delay
      setTimeout(() => {
        setAnalysisStatus('idle');
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
        return <Server className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (analysisStatus) {
      case 'analyzing':
        return 'Analyzing on Server...';
      case 'complete':
        return 'Server Analysis Complete';
      case 'error':
        return 'Server Analysis Failed';
      default:
        return 'Analyze with Hugging Face Models';
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={analyzeFramesOnServer}
        disabled={isAnalyzing}
        className="w-full"
        size="lg"
        variant="secondary"
      >
        {getStatusIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Server-side analysis with advanced models</span>
        <Badge variant="outline" className="text-xs">
          Hugging Face
        </Badge>
      </div>
    </div>
  );
};