import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFramesBySequenceId, useUpdateFrame } from '@/hooks/useFrames';
import { Image, Edit, Save, X, Loader2, Sun, Moon, Cloud, CloudRain, CloudSnow, Camera, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FrameTileGridProps {
  sequenceId: string;
  showAnalyzeButton?: boolean;
  onAnalyzeFrames?: () => void;
  analyzing?: boolean;
}

export const FrameTileGrid = ({ 
  sequenceId, 
  showAnalyzeButton = false, 
  onAnalyzeFrames,
  analyzing = false 
}: FrameTileGridProps) => {
  const { data: frames = [], isLoading, refetch } = useFramesBySequenceId(sequenceId);
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
      toast({
        title: "Attributes saved successfully",
        description: "Frame attributes have been updated.",
      });
      refetch();
    } catch (error) {
      console.error('Error updating frame:', error);
      toast({
        title: "Error saving attributes",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingFrame(null);
    setEditData({});
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': case 'clear': return <Sun className="h-3 w-3" style={{ color: 'hsl(var(--weather-sunny))' }} />;
      case 'cloudy': return <Cloud className="h-3 w-3" style={{ color: 'hsl(var(--weather-cloudy))' }} />;
      case 'rainy': return <CloudRain className="h-3 w-3" style={{ color: 'hsl(var(--weather-rainy))' }} />;
      case 'snowy': return <CloudSnow className="h-3 w-3" style={{ color: 'hsl(var(--weather-snowy))' }} />;
      default: return null;
    }
  };

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'day': return <Sun className="h-3 w-3" style={{ color: 'hsl(var(--time-day))' }} />;
      case 'night': return <Moon className="h-3 w-3" style={{ color: 'hsl(var(--time-night))' }} />;
      default: return null;
    }
  };

  const getRoadTypeColor = (roadType: string) => {
    switch (roadType) {
      case 'urban': return 'hsl(var(--road-urban))';
      case 'highway': return 'hsl(var(--road-highway))';
      case 'residential': return 'hsl(var(--road-residential))';
      case 'rural': return 'hsl(var(--road-rural))';
      default: return 'hsl(var(--muted-foreground))';
    }
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
        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No frames found for this sequence</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Frame Analysis ({frames.length} frames)</h3>
        {showAnalyzeButton && (
          <Button 
            onClick={onAnalyzeFrames}
            disabled={analyzing}
            className="gradient-primary text-primary-foreground hover:opacity-90"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Frames
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {frames.map((frame) => (
          <Card key={frame.id} className="overflow-hidden shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Image Section - Left */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-20 relative bg-muted rounded-md overflow-hidden">
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
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        #{frame.frame_number}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Attributes Section - Right */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Weather */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Weather</div>
                      <div className="flex items-center gap-1">
                        {getWeatherIcon(frame.weather)}
                        <span className="text-sm capitalize">{frame.weather || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Day/Night */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Time</div>
                      <div className="flex items-center gap-1">
                        {getTimeIcon(frame["day-night"])}
                        <span className="text-sm capitalize">{frame["day-night"] || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Road Type */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Road Type</div>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0"
                        style={{ 
                          borderColor: getRoadTypeColor(frame["road-type"]),
                          color: getRoadTypeColor(frame["road-type"])
                        }}
                      >
                        {frame["road-type"] || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Lanes */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Lanes</div>
                      <span className="text-sm font-medium">{frame.lanes || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Parking */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Parking</div>
                      <Badge variant="secondary" className="text-xs">
                        None
                      </Badge>
                    </div>

                    {/* Underground */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Underground</div>
                      <Badge variant="secondary" className="text-xs">
                        No
                      </Badge>
                    </div>

                    {/* Edit Button */}
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(frame)}
                            className="text-xs px-3"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-primary">Edit Frame #{frame.frame_number}</DialogTitle>
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
                                    <SelectItem value="rainy">Rainy</SelectItem>
                                    <SelectItem value="snowy">Snowy</SelectItem>
                                    <SelectItem value="foggy">Foggy</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="day-night">Day/Night</Label>
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
                                    <SelectItem value="dawn">Dawn</SelectItem>
                                    <SelectItem value="dusk">Dusk</SelectItem>
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


                            <div className="flex justify-end space-x-2 pt-4">
                              <Button variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                              <Button onClick={handleSave} disabled={updateFrame.isPending} className="gradient-primary">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};