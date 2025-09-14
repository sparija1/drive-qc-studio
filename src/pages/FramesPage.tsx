import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFramesBySequenceId } from "@/hooks/useFrames";
import { useSequencesByPipelineId } from "@/hooks/useSequences";
import { usePipelineById } from "@/hooks/usePipelines";
import { useProjectById } from "@/hooks/useProjects";
import { FrameFilters } from "@/components/frames/FrameFilters";
import { ImageAnalysisButton } from "@/components/frames/ImageAnalysisButton";
import { ServerAnalysisButton } from "@/components/frames/ServerAnalysisButton";
import { LovableAnalysisButton } from "@/components/frames/LovableAnalysisButton";
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
    weather: 'all',
    status: 'all',
    lanes: 'all'
  });

  const { data: project } = useProjectById(projectId || '');
  const { data: pipeline } = usePipelineById(pipelineId || '');
  const { data: frames = [], isLoading, error } = useFramesBySequenceId(sequenceId || '');

  // Extract available filter values from the data
  const availableValues = useMemo(() => {
    const timeOfDay = [...new Set(frames.map(f => f["day-night"]).filter(Boolean))];
    const roadType = [...new Set(frames.map(f => f["road-type"]).filter(Boolean))];
    const weather = [...new Set(frames.map(f => f.weather).filter(Boolean))];
    const status = [...new Set(frames.map(f => f.status).filter(Boolean))];
    const lanes = [...new Set(frames.map(f => f.lanes).filter(Boolean))];
    
    return { timeOfDay, roadType, weather, status, lanes };
  }, [frames]);

  // Filter frames based on current filters
  const filteredFrames = frames.filter(frame => {
    if (filters.timeOfDay !== 'all' && frame["day-night"] !== filters.timeOfDay) return false;
    if (filters.roadType !== 'all' && frame["road-type"] !== filters.roadType) return false;
    if (filters.weather !== 'all' && frame.weather !== filters.weather) return false;
    if (filters.status !== 'all' && frame.status !== filters.status) return false;
    if (filters.lanes !== 'all' && frame.lanes !== filters.lanes) return false;
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


  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay?.toLowerCase()) {
      case 'day': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'night': return <Moon className="h-4 w-4 text-blue-400" />;
      default: return <Sun className="h-4 w-4 text-gray-400" />;
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather?.toLowerCase()) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainfall': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'snowfall': return <CloudSnow className="h-4 w-4 text-blue-300" />;
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
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <LovableAnalysisButton 
                frames={frames} 
                onAnalysisComplete={() => {
                  // Refresh frame data after analysis
                  window.location.reload();
                }}
              />
              <ServerAnalysisButton 
                sequenceId={sequenceId || ''} 
                onAnalysisComplete={() => {
                  // Refresh frame data after analysis
                  window.location.reload();
                }}
              />
              <ImageAnalysisButton 
                frames={frames} 
                onAnalysisComplete={() => {
                  // Optionally refresh data or show success message
                }}
              />
              <FrameFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableValues={availableValues}
              />
            </div>
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
                      {getTimeOfDayIcon(frame["day-night"] || '')}
                      {getWeatherIcon(frame.weather || '')}
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Frame #{frame.frame_number}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {getRoadTypeBadge(frame["road-type"] || '')}
                      {frame.lanes && (
                        <Badge variant="outline" className="text-xs">
                          {frame.lanes}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
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
                      {getTimeOfDayIcon(selectedFrameData["day-night"] || '')}
                      <span className="capitalize text-foreground">{selectedFrameData["day-night"] || 'Unknown'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Road: {selectedFrameData["road-type"] || 'Unknown'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getWeatherIcon(selectedFrameData.weather || '')}
                      <span className="capitalize text-foreground">{selectedFrameData.weather || 'Unknown'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Lanes: {selectedFrameData.lanes || 'Unknown'}</div>
                  </div>
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