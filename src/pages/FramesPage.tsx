import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFramesBySequenceId } from "@/hooks/useFrames";
import { useSequencesByPipelineId } from "@/hooks/useSequences";
import { usePipelineById } from "@/hooks/usePipelines";
import { useProjectById } from "@/hooks/useProjects";
import { 
  Image as ImageIcon, 
  Target, 
  Clock, 
  Filter,
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cloud,
  CloudRain,
  CloudSnow,
  Eye,
  Loader2
} from "lucide-react";

const FramesPage = () => {
  const { projectId, pipelineId, sequenceId } = useParams();
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    timeOfDay: 'all',
    roadType: 'all',
    trafficDensity: 'all',
    weather: 'all',
    accuracyThreshold: 0
  });

  const { data: project } = useProjectById(projectId || '');
  const { data: pipeline } = usePipelineById(pipelineId || '');
  const { data: frames = [], isLoading, error } = useFramesBySequenceId(sequenceId || '');

  // Filter frames based on current filters
  const filteredFrames = frames.filter(frame => {
    if (filters.timeOfDay !== 'all' && frame.time_of_day !== filters.timeOfDay) return false;
    if (filters.roadType !== 'all' && frame.scene_type !== filters.roadType) return false;
    if (filters.trafficDensity !== 'all' && frame.traffic_density !== filters.trafficDensity) return false;
    if (filters.weather !== 'all' && frame.weather_condition !== filters.weather) return false;
    if ((frame.accuracy || 0) < filters.accuracyThreshold) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project || !pipeline) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Sequence not found</h3>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const getAccuracyColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay?.toLowerCase()) {
      case 'day': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'night': return <Moon className="h-4 w-4 text-blue-400" />;
      case 'dawn': return <Sunrise className="h-4 w-4 text-orange-400" />;
      case 'dusk': return <Sunset className="h-4 w-4 text-purple-400" />;
      default: return <Sun className="h-4 w-4 text-gray-400" />;
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case 'sunny': case 'clear': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'rainfall': case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'snowfall': case 'snowy': return <CloudSnow className="h-4 w-4 text-blue-300" />;
      default: return <Cloud className="h-4 w-4 text-gray-400" />;
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

  const selectedFrameData = selectedFrame ? frames.find(f => f.id === selectedFrame) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link 
              to={`/projects/${projectId}/pipelines/${pipelineId}/sequences`} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Frame Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Individual frames from sequence in <span className="font-medium text-primary">{pipeline.name}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Showing</div>
          <div className="text-lg font-bold text-foreground">{filteredFrames.length} / {frames.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="timeOfDay" className="text-sm font-medium">Time of Day</Label>
              <Select value={filters.timeOfDay} onValueChange={(value) => setFilters({...filters, timeOfDay: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All times" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All times</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="roadType" className="text-sm font-medium">Road Type</Label>
              <Select value={filters.roadType} onValueChange={(value) => setFilters({...filters, roadType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All roads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roads</SelectItem>
                  <SelectItem value="highway">Highway</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="suburb">Suburb</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weather" className="text-sm font-medium">Weather</Label>
              <Select value={filters.weather} onValueChange={(value) => setFilters({...filters, weather: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weather</SelectItem>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainfall">Rainfall</SelectItem>
                  <SelectItem value="snowfall">Snowfall</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accuracyThreshold" className="text-sm font-medium">
                Min Accuracy: {(filters.accuracyThreshold * 100).toFixed(0)}%
              </Label>
              <Input
                type="range"
                id="accuracyThreshold"
                min="0"
                max="1"
                step="0.05"
                value={filters.accuracyThreshold}
                onChange={(e) => setFilters({...filters, accuracyThreshold: parseFloat(e.target.value)})}
                className="mt-2"
              />
            </div>

            <Button
              onClick={() => setFilters({
                timeOfDay: 'all',
                roadType: 'all',
                trafficDensity: 'all',
                weather: 'all',
                accuracyThreshold: 0
              })}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        {/* Frames Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFrames.map((frame) => (
              <Card 
                key={frame.id} 
                className={`cursor-pointer shadow-card hover:shadow-elevated transition-smooth border-border/50 ${
                  selectedFrame === frame.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedFrame(frame.id)}
              >
                <CardContent className="p-0">
                  {/* Frame image */}
                  <div className="aspect-video bg-muted/30 rounded-t-lg flex items-center justify-center relative overflow-hidden">
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
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {getTimeOfDayIcon(frame.time_of_day || '')}
                      {getWeatherIcon(frame.weather_condition || '')}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        className={`text-xs ${getAccuracyColor(frame.accuracy || 0)} bg-background/80`}
                        variant="outline"
                      >
                        {((frame.accuracy || 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Frame #{frame.frame_number}</span>
                      <div className="flex items-center space-x-1">
                        {(frame.accuracy || 0) >= 0.9 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {getRoadTypeBadge(frame.scene_type || '')}
                      {frame.lane_count && (
                        <Badge variant="outline" className="text-xs">
                          {frame.lane_count} lanes
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Vehicles: {frame.vehicle_count || 0}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {frame.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFrames.length === 0 && frames.length > 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No frames match your filters</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filter criteria</p>
            </div>
          )}

          {frames.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No frames found</h3>
              <p className="text-muted-foreground mb-4">This sequence doesn't have any frames yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Frame Detail Panel */}
      {selectedFrameData && (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Frame Details - #{selectedFrameData.frame_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Attributes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTimeOfDayIcon(selectedFrameData.time_of_day || '')}
                      <span className="capitalize text-foreground">{selectedFrameData.time_of_day || 'Unknown'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Road: {selectedFrameData.scene_type || 'Unknown'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getWeatherIcon(selectedFrameData.weather_condition || '')}
                      <span className="capitalize text-foreground">{selectedFrameData.weather_condition || 'Unknown'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Lanes: {selectedFrameData.lane_count || 'Unknown'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Accuracy Score</h4>
                <div className={`text-2xl font-bold ${getAccuracyColor(selectedFrameData.accuracy || 0)}`}>
                  {((selectedFrameData.accuracy || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Model confidence level
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">Object Counts</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Vehicles: <span className="font-medium">{selectedFrameData.vehicle_count || 0}</span></div>
                  <div>Pedestrians: <span className="font-medium">{selectedFrameData.pedestrian_count || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Technical Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="text-muted-foreground">Status: <span className="capitalize">{selectedFrameData.status || 'pending'}</span></div>
                  <div className="text-muted-foreground">Created: {new Date(selectedFrameData.created_at).toLocaleString()}</div>
                  {selectedFrameData.updated_at !== selectedFrameData.created_at && (
                    <div className="text-muted-foreground">Updated: {new Date(selectedFrameData.updated_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
              
              {selectedFrameData.notes && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedFrameData.notes}</p>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Export Frame
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Edit Attributes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FramesPage;