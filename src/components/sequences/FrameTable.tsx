import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFramesBySequenceId, useUpdateFrame } from '@/hooks/useFrames';
import { Image, Edit, Save, X, Loader2, Sun, Moon, Cloud, CloudRain, CloudSnow, Camera, Brain, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FrameTableProps {
  sequenceId: string;
  showAnalyzeButton?: boolean;
  onAnalyzeFrames?: () => void;
  analyzing?: boolean;
}

export const FrameTable = ({ 
  sequenceId, 
  showAnalyzeButton = false, 
  onAnalyzeFrames,
  analyzing = false 
}: FrameTableProps) => {
  const { data: frames = [], isLoading, refetch } = useFramesBySequenceId(sequenceId);
  const updateFrame = useUpdateFrame();
  const { toast } = useToast();
  const [editingFrame, setEditingFrame] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleEdit = (frame: any) => {
    setEditingFrame(frame.id);
    setEditData({
      weather_condition: frame.weather_condition || '',
      scene_type: frame.scene_type || '',
      traffic_density: frame.traffic_density || '',
      lane_count: frame.lane_count || 1,
      vehicle_count: frame.vehicle_count || 0,
      pedestrian_count: frame.pedestrian_count || 0,
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
    switch (weather?.toLowerCase()) {
      case 'sunny': case 'clear': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainy': case 'rainfall': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'snowy': case 'snowfall': return <CloudSnow className="h-4 w-4 text-blue-300" />;
      default: return <div className="h-4 w-4 bg-muted rounded-full" />;
    }
  };

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay?.toLowerCase()) {
      case 'day': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'night': return <Moon className="h-4 w-4 text-blue-400" />;
      default: return <div className="h-4 w-4 bg-muted rounded-full" />;
    }
  };

  const getStatusBadge = (frame: any) => {
    const hasAllAttributes = frame.weather_condition && frame.scene_type && frame.traffic_density;
    if (hasAllAttributes) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">ANALYZED</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">PENDING</Badge>;
    }
  };

  const getRoadTypeBadge = (roadType: string) => {
    if (!roadType) return <span className="text-muted-foreground">-</span>;
    
    const colors = {
      highway: 'bg-blue-100 text-blue-800 border-blue-200',
      city: 'bg-purple-100 text-purple-800 border-purple-200',
      suburb: 'bg-green-100 text-green-800 border-green-200',
      rural: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <Badge className={colors[roadType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {roadType.toUpperCase()}
      </Badge>
    );
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
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-semibold text-foreground">Frames</h3>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {frames.length} frames
          </Badge>
        </div>
        {showAnalyzeButton && (
          <Button 
            onClick={onAnalyzeFrames}
            disabled={analyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
      
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-20 font-semibold text-gray-700">Frame ID</TableHead>
              <TableHead className="font-semibold text-gray-700">Preview</TableHead>
              <TableHead className="font-semibold text-gray-700">Weather</TableHead>
              <TableHead className="font-semibold text-gray-700">Time</TableHead>
              <TableHead className="font-semibold text-gray-700">Road Type</TableHead>
              <TableHead className="w-16 font-semibold text-gray-700 text-center">Lanes</TableHead>
              <TableHead className="w-16 font-semibold text-gray-700 text-center">Vehicles</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="w-20 font-semibold text-gray-700 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {frames.map((frame, index) => (
              <TableRow key={frame.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  #{frame.frame_number || index + 1}
                </TableCell>
                <TableCell>
                  <div className="w-16 h-10 relative bg-muted rounded overflow-hidden">
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
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(frame.weather_condition)}
                    <span className="capitalize text-sm">
                      {frame.weather_condition || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTimeIcon(frame.scene_type)}
                    <span className="capitalize text-sm">
                      {frame.scene_type || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoadTypeBadge(frame.traffic_density)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{frame.lane_count || '-'}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{frame.vehicle_count || 0}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(frame)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(frame)}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-primary">Edit Frame #{frame.frame_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
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
                                  <SelectItem value="sunny">Sunny</SelectItem>
                                  <SelectItem value="cloudy">Cloudy</SelectItem>
                                  <SelectItem value="rainfall">Rainfall</SelectItem>
                                  <SelectItem value="snowfall">Snowfall</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="scene_type">Time of Day</Label>
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
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="traffic_density">Road Type</Label>
                              <Select
                                value={editData.traffic_density}
                                onValueChange={(value) => setEditData({...editData, traffic_density: value})}
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
                              <Label htmlFor="lane_count">Lanes</Label>
                              <Input
                                type="number"
                                min="1"
                                max="8"
                                value={editData.lane_count}
                                onChange={(e) => setEditData({...editData, lane_count: parseInt(e.target.value) || 1})}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="vehicle_count">Vehicle Count</Label>
                              <Input
                                type="number"
                                min="0"
                                value={editData.vehicle_count}
                                onChange={(e) => setEditData({...editData, vehicle_count: parseInt(e.target.value) || 0})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="pedestrian_count">Pedestrian Count</Label>
                              <Input
                                type="number"
                                min="0"
                                value={editData.pedestrian_count}
                                onChange={(e) => setEditData({...editData, pedestrian_count: parseInt(e.target.value) || 0})}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updateFrame.isPending} className="bg-indigo-600 hover:bg-indigo-700">
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};