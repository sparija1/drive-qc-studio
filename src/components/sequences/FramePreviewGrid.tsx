import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFramesBySequenceId, useUpdateFrame } from '@/hooks/useFrames';
import { Image, Edit, Save, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FramePreviewGridProps {
  sequenceId: string;
}

export const FramePreviewGrid = ({ sequenceId }: FramePreviewGridProps) => {
  const { data: frames = [], isLoading } = useFramesBySequenceId(sequenceId);
  const updateFrame = useUpdateFrame();
  const { toast } = useToast();
  const [editingFrame, setEditingFrame] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleEdit = (frame: any) => {
    setEditingFrame(frame.id);
    setEditData({
      weather: frame.weather || '',
      "day-night": frame["day-night"] || '',
      "road-type": frame["road-type"] || '',
      lanes: frame.lanes || ''
    });
  };

  const handleSave = async () => {
    if (!editingFrame) return;

    try {
      await updateFrame.mutateAsync({
        id: editingFrame,
        data: editData
      });
      setEditingFrame(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating frame:', error);
    }
  };

  const handleCancel = () => {
    setEditingFrame(null);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No frames found for this sequence</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Frame Preview ({frames.length} frames)</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {frames.map((frame) => (
          <Card key={frame.id} className="overflow-hidden">
            <div className="aspect-video relative bg-muted">
              {frame.image_url ? (
                <img
                  src={frame.image_url}
                  alt={`Frame ${frame.frame_number}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const sibling = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (sibling) sibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-muted flex items-center justify-center" style={{ display: frame.image_url ? 'none' : 'flex' }}>
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  #{frame.frame_number}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleEdit(frame)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Frame #{frame.frame_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="weather">Weather</Label>
                          <Select
                            value={editData.weather}
                            onValueChange={(value) => setEditData({...editData, weather: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sunny">Sunny</SelectItem>
                              <SelectItem value="cloudy">Cloudy</SelectItem>
                              <SelectItem value="rainfall">Rainfall</SelectItem>
                              <SelectItem value="snowfall">Snowfall</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="day-night">Time</Label>
                          <Select
                            value={editData["day-night"]}
                            onValueChange={(value) => setEditData({...editData, "day-night": value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Day</SelectItem>
                              <SelectItem value="night">Night</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="road-type">Road Type</Label>
                          <Select
                            value={editData["road-type"]}
                            onValueChange={(value) => setEditData({...editData, "road-type": value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="highway">Highway</SelectItem>
                              <SelectItem value="city">City</SelectItem>
                              <SelectItem value="suburb">Suburb</SelectItem>
                              <SelectItem value="rural">Rural</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="lanes">Lanes</Label>
                          <Select
                            value={editData.lanes}
                            onValueChange={(value) => setEditData({...editData, lanes: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one lane">One lane</SelectItem>
                              <SelectItem value="two way traffic">Two way traffic</SelectItem>
                              <SelectItem value="more than two lanes">More than two lanes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateFrame.isPending}>
                          {updateFrame.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Frame {frame.frame_number}</span>
                </div>
                {frame["road-type"] && (
                  <Badge variant="secondary" className="text-xs">
                    {frame["road-type"]}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};