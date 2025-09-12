import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useFramesBySequenceId } from "@/hooks/useFrames";
import { FrameAttributeEditor } from "./FrameAttributeEditor";

interface VideoPlayerProps {
  sequenceId: string;
  fps: number;
}

export const VideoPlayer = ({ sequenceId, fps }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: frames = [] } = useFramesBySequenceId(sequenceId);
  const totalFrames = frames.length;

  useEffect(() => {
    if (autoPlay && totalFrames > 0) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, totalFrames]);

  useEffect(() => {
    if (isPlaying && totalFrames > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % totalFrames);
      }, 1000 / fps);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalFrames, fps]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const previousFrame = () => {
    setCurrentFrame(prev => (prev - 1 + totalFrames) % totalFrames);
  };
  
  const nextFrame = () => {
    setCurrentFrame(prev => (prev + 1) % totalFrames);
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentFrame(value[0]);
  };

  if (totalFrames === 0) {
    return (
      <Card className="aspect-video bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">No frames available</p>
      </Card>
    );
  }

  const currentFrameData = frames[currentFrame];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Player - Takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black flex items-center justify-center">
              <img
                src={currentFrameData?.image_url || '/placeholder.svg?height=400&width=600&text=Frame+' + (currentFrame + 1)}
                alt={`Frame ${currentFrame + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg?height=400&width=600&text=Frame+' + (currentFrame + 1);
                }}
              />
            </div>
            
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Frame {currentFrame + 1} of {totalFrames}</span>
                <span>
                  {currentFrameData?.timestamp_ms 
                    ? `${(currentFrameData.timestamp_ms / 1000).toFixed(2)}s`
                    : 'N/A'
                  }
                </span>
              </div>
              
              <Slider
                value={[currentFrame]}
                onValueChange={handleSliderChange}
                max={totalFrames - 1}
                step={1}
                className="w-full"
              />
              
              <div className="flex items-center justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={previousFrame}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={nextFrame}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Frame Attributes - Takes 1/3 of the space */}
        <div className="lg:col-span-1">
          {currentFrameData && (
            <FrameAttributeEditor frame={currentFrameData} />
          )}
        </div>
      </div>
    </div>
  );
};