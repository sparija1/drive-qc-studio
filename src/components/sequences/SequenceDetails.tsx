import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sequence } from "@/hooks/useSequences";
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
              <div className="text-lg font-semibold">{sequence.total_frames || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Duration
              </div>
              <div className="text-lg font-semibold">{sequence.duration ? `${sequence.duration}s` : 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Camera className="h-4 w-4 mr-1" />
                FPS
              </div>
              <div className="text-lg font-semibold">{sequence.fps || 'N/A'}</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Scene Type:</span>
              <span className="font-medium">{sequence.scene_type || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Weather:</span>
              <span className="font-medium">{sequence.weather_condition || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Traffic Density:</span>
              <span className="font-medium">{sequence.traffic_density || 'N/A'}</span>
            </div>
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
            <span className="font-medium">{new Date(sequence.created_at).toLocaleDateString()}</span>
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