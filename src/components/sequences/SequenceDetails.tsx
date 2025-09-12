import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sequence } from "@/data/mockData";
import { 
  Clock, 
  Image, 
  Gauge, 
  Car, 
  Users, 
  MapPin, 
  Calendar,
  Target,
  Zap,
  Camera,
  Route
} from "lucide-react";

interface SequenceDetailsProps {
  sequence: Sequence;
}

export const SequenceDetails = ({ sequence }: SequenceDetailsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrafficLightColor = (state: string) => {
    switch (state) {
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{sequence.name}</CardTitle>
            <Badge className={getStatusColor(sequence.status)} variant="outline">
              {sequence.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Image className="h-4 w-4 mr-1" />
                Frames
              </div>
              <div className="text-lg font-semibold">{sequence.frameCount}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Duration
              </div>
              <div className="text-lg font-semibold">{sequence.duration}s</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Camera className="h-4 w-4 mr-1" />
                FPS
              </div>
              <div className="text-lg font-semibold">{sequence.fps}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-4 w-4 mr-1" />
                Accuracy Score
              </div>
              <span className={`font-semibold ${getAccuracyColor(sequence.avgAccuracyScore)}`}>
                {(sequence.avgAccuracyScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={sequence.avgAccuracyScore * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Scene Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scene Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Time of Day</div>
              <Badge variant="outline" className="text-xs">
                {sequence.aggregatedAttributes.predominantTimeOfDay}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Road Type</div>
              <Badge variant="outline" className="text-xs">
                {sequence.aggregatedAttributes.predominantRoadType}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Traffic Density</div>
              <Badge variant="outline" className="text-xs">
                {sequence.aggregatedAttributes.avgTrafficDensity}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Weather</div>
              <Badge variant="outline" className="text-xs">
                {sequence.aggregatedAttributes.predominantWeather}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traffic Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Car className="h-4 w-4 mr-1" />
                Avg Vehicles
              </div>
              <div className="text-lg font-semibold">{sequence.aggregatedAttributes.avgVehicleCount}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Avg Pedestrians
              </div>
              <div className="text-lg font-semibold">{sequence.aggregatedAttributes.avgPedestrianCount}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Route className="h-4 w-4 mr-1" />
                Avg Lanes
              </div>
              <div className="text-lg font-semibold">{sequence.aggregatedAttributes.avgLaneCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Light Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traffic Light Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sequence.aggregatedAttributes.trafficLightDistribution).map(([state, percentage]) => (
              <div key={state} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(state)}`} />
                    <span className="capitalize">{state}</span>
                  </div>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              Created
            </div>
            <span className="font-medium">{new Date(sequence.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Zap className="h-4 w-4 mr-1" />
              Sequence ID
            </div>
            <span className="font-mono text-xs">{sequence.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};