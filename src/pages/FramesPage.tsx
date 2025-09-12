import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProjectById, getPipelineById, getSequenceById, getFramesBySequenceId } from "@/data/mockData";
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
  Eye
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

  const project = projectId ? getProjectById(projectId) : null;
  const pipeline = pipelineId ? getPipelineById(pipelineId) : null;
  const sequence = sequenceId ? getSequenceById(sequenceId) : null;
  const allFrames = sequenceId ? getFramesBySequenceId(sequenceId) : [];

  // Filter frames based on current filters
  const filteredFrames = allFrames.filter(frame => {
    if (filters.timeOfDay !== 'all' && frame.attributes.timeOfDay !== filters.timeOfDay) return false;
    if (filters.roadType !== 'all' && frame.attributes.roadType !== filters.roadType) return false;
    if (filters.trafficDensity !== 'all' && frame.attributes.trafficDensity !== filters.trafficDensity) return false;
    if (filters.weather !== 'all' && frame.attributes.weather !== filters.weather) return false;
    if (frame.accuracyScore < filters.accuracyThreshold) return false;
    return true;
  });

  if (!project || !pipeline || !sequence) {
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
    if (score >= 0.9) return 'text-success';
    if (score >= 0.8) return 'text-warning';
    return 'text-destructive';
  };

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'day': return <Sun className="h-4 w-4" />;
      case 'night': return <Moon className="h-4 w-4" />;
      case 'dawn': return <Sunrise className="h-4 w-4" />;
      case 'dusk': return <Sunset className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'clear': return <Sun className="h-4 w-4" />;
      case 'rain': return <CloudRain className="h-4 w-4" />;
      case 'fog': return <Cloud className="h-4 w-4" />;
      case 'snow': return <CloudSnow className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  const selectedFrameData = selectedFrame ? allFrames.find(f => f.id === selectedFrame) : null;

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
            Individual frames from <span className="font-medium text-foreground">{sequence.name}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Showing</div>
          <div className="text-lg font-bold text-foreground">{filteredFrames.length} / {allFrames.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 shadow-card gradient-surface border-border/50">
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
                  <SelectItem value="dawn">Dawn</SelectItem>
                  <SelectItem value="dusk">Dusk</SelectItem>
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
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="rain">Rain</SelectItem>
                  <SelectItem value="fog">Fog</SelectItem>
                  <SelectItem value="snow">Snow</SelectItem>
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
                className={`cursor-pointer shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50 ${
                  selectedFrame === frame.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedFrame(frame.id)}
              >
                <CardContent className="p-0">
                  {/* Mock image placeholder */}
                  <div className="aspect-video bg-muted/30 rounded-t-lg flex items-center justify-center relative">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {getTimeOfDayIcon(frame.attributes.timeOfDay)}
                      {getWeatherIcon(frame.attributes.weather)}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge 
                        className={`text-xs ${getAccuracyColor(frame.accuracyScore)} bg-background/80`}
                        variant="outline"
                      >
                        {(frame.accuracyScore * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Frame {frame.id.split('-')[1]}</span>
                      <div className="flex items-center space-x-1">
                        {frame.accuracyScore >= 0.9 ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-muted-foreground capitalize">{frame.attributes.roadType}</span>
                      <span className="text-muted-foreground capitalize">{frame.attributes.trafficDensity} traffic</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(frame.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFrames.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No frames match your filters</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Frame Detail Panel */}
      {selectedFrameData && (
        <Card className="shadow-card gradient-surface border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Frame Details - {selectedFrameData.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Attributes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getTimeOfDayIcon(selectedFrameData.attributes.timeOfDay)}
                      <span className="capitalize text-foreground">{selectedFrameData.attributes.timeOfDay}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Road: {selectedFrameData.attributes.roadType}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getWeatherIcon(selectedFrameData.attributes.weather)}
                      <span className="capitalize text-foreground">{selectedFrameData.attributes.weather}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Traffic: {selectedFrameData.attributes.trafficDensity}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Accuracy Score</h4>
                <div className={`text-2xl font-bold ${getAccuracyColor(selectedFrameData.accuracyScore)}`}>
                  {(selectedFrameData.accuracyScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Model confidence level
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">File Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="text-muted-foreground">Path: {selectedFrameData.filePath}</div>
                  <div className="text-muted-foreground">Timestamp: {new Date(selectedFrameData.timestamp).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Export Frame
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  QC Review
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