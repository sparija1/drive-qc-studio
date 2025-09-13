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
      scene_type: frame.scene_type || '',
      weather_condition: frame.weather_condition || '',
      traffic_density: frame.traffic_density || '',
      traffic_light_status: frame.traffic_light_status || '',
      vehicle_count: frame.vehicle_count || 0,
      pedestrian_count: frame.pedestrian_count || 0,
      lane_count: frame.lane_count || 1,
      accuracy: frame.accuracy || 0,
      notes: frame.notes || ''
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
                          <Label htmlFor="scene_type">Scene Type</Label>
                          <Select
                            value={editData.scene_type}
                            onValueChange={(value) => setEditData({...editData, scene_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">Day</SelectItem>
                              <SelectItem value="night">Night</SelectItem>
                              <SelectItem value="dawn">Dawn</SelectItem>
                              <SelectItem value="dusk">Dusk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="weather_condition">Weather</Label>
                          <Select
                            value={editData.weather_condition}
                            onValueChange={(value) => setEditData({...editData, weather_condition: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clear">Clear</SelectItem>
                              <SelectItem value="cloudy">Cloudy</SelectItem>
                              <SelectItem value="rainy">Rainy</SelectItem>
                              <SelectItem value="snowy">Snowy</SelectItem>
                              <SelectItem value="foggy">Foggy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="traffic_density">Traffic Density</Label>
                          <Select
                            value={editData.traffic_density}
                            onValueChange={(value) => setEditData({...editData, traffic_density: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="heavy">Heavy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="traffic_light_status">Traffic Light</Label>
                          <Select
                            value={editData.traffic_light_status}
                            onValueChange={(value) => setEditData({...editData, traffic_light_status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="vehicle_count">Vehicles</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editData.vehicle_count}
                            onChange={(e) => setEditData({...editData, vehicle_count: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pedestrian_count">Pedestrians</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editData.pedestrian_count}
                            onChange={(e) => setEditData({...editData, pedestrian_count: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lane_count">Lanes</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editData.lane_count}
                            onChange={(e) => setEditData({...editData, lane_count: parseInt(e.target.value) || 1})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="accuracy">Accuracy Score</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={editData.accuracy}
                          onChange={(e) => setEditData({...editData, accuracy: parseFloat(e.target.value) || 0})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          value={editData.notes}
                          onChange={(e) => setEditData({...editData, notes: e.target.value})}
                          placeholder="Add any notes about this frame..."
                        />
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
                  {frame.accuracy && (
                    <Badge variant="outline" className="text-xs">
                      {(frame.accuracy * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                {frame.scene_type && (
                  <Badge variant="secondary" className="text-xs">
                    {frame.scene_type}
                  </Badge>
                )}
                {(frame.vehicle_count || frame.pedestrian_count) && (
                  <div className="text-xs text-muted-foreground">
                    {frame.vehicle_count ? `${frame.vehicle_count} vehicles` : ''}
                    {frame.vehicle_count && frame.pedestrian_count ? ', ' : ''}
                    {frame.pedestrian_count ? `${frame.pedestrian_count} pedestrians` : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};