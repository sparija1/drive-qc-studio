import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw, Download, Grid3X3, List } from 'lucide-react';
import { useFramesBySequenceId } from '@/hooks/useFrames';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageViewerProps {
  sequenceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer = ({ sequenceId, isOpen, onClose }: ImageViewerProps) => {
  const { data: frames = [], isLoading } = useFramesBySequenceId(sequenceId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('single');

  const currentFrame = frames[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setZoom(1);
  }, [sequenceId]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    if (currentFrame?.image_url) {
      const link = document.createElement('a');
      link.href = currentFrame.image_url;
      link.download = `frame_${currentFrame.frame_number}.jpg`;
      link.click();
    }
  };

  const getAttributeBadges = (frame: any) => {
    const badges = [];
    if (frame.weather_condition) {
      badges.push({ label: frame.weather_condition, type: 'weather' });
    }
    if (frame.scene_type) {
      badges.push({ label: frame.scene_type, type: 'time' });
    }
    if (frame.traffic_density) {
      badges.push({ label: frame.traffic_density, type: 'road' });
    }
    if (frame.lane_count) {
      badges.push({ label: `${frame.lane_count} lanes`, type: 'lanes' });
    }
    return badges;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Sequence Images {frames.length > 0 && `(${currentIndex + 1} of ${frames.length})`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
              >
                {viewMode === 'single' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 p-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video" />
              ))}
            </div>
          </div>
        ) : frames.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No images found for this sequence</p>
          </div>
        ) : viewMode === 'grid' ? (
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {frames.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`relative cursor-pointer group border-2 rounded-lg overflow-hidden transition-all hover:border-primary ${
                    index === currentIndex ? 'border-primary' : 'border-border'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setViewMode('single');
                  }}
                >
                  <div className="aspect-video bg-muted">
                    {frame.image_url ? (
                      <img
                        src={frame.image_url}
                        alt={`Frame ${frame.frame_number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      #{frame.frame_number}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Image Display */}
            <div className="flex-1 relative bg-muted overflow-hidden">
              {currentFrame?.image_url ? (
                <img
                  src={currentFrame.image_url}
                  alt={`Frame ${currentFrame.frame_number}`}
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}

              {/* Navigation Arrows */}
              {frames.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    Frame #{currentFrame?.frame_number}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    {currentFrame && getAttributeBadges(currentFrame).map((badge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-16 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};