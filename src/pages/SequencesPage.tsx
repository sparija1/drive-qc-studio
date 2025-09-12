import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectById, getPipelineById, getSequencesByPipelineId } from "@/data/mockData";
import { PlayCircle, Image, Clock, Target, ArrowLeft, Play } from "lucide-react";

const SequencesPage = () => {
  const { projectId, pipelineId } = useParams();
  const project = projectId ? getProjectById(projectId) : null;
  const pipeline = pipelineId ? getPipelineById(pipelineId) : null;
  const sequences = pipelineId ? getSequencesByPipelineId(pipelineId) : [];

  if (!project || !pipeline) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Pipeline not found</h3>
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

  const getTimeOfDayColor = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'day': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'night': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'dawn': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'dusk': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link 
              to={`/projects/${projectId}/pipelines`} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Sequences</h1>
          </div>
          <p className="text-muted-foreground">
            Video sequences in <span className="font-medium text-foreground">{pipeline.name}</span>
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground hover:shadow-glow transition-smooth">
          <PlayCircle className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground mb-2">{sequence.name}</CardTitle>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getTimeOfDayColor(sequence.aggregatedAttributes.predominantTimeOfDay)} variant="outline">
                      {sequence.aggregatedAttributes.predominantTimeOfDay}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {sequence.aggregatedAttributes.predominantRoadType}
                    </Badge>
                  </div>
                </div>
                <div className={`text-right ${getAccuracyColor(sequence.avgAccuracyScore)}`}>
                  <div className="text-sm font-medium">Accuracy</div>
                  <div className="text-lg font-bold">
                    {(sequence.avgAccuracyScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Image className="h-4 w-4 mr-1" />
                    Frames
                  </div>
                  <div className="text-lg font-semibold text-foreground">{sequence.frameCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    Duration
                  </div>
                  <div className="text-lg font-semibold text-foreground">{sequence.duration}s</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Target className="h-4 w-4 mr-1" />
                    Traffic
                  </div>
                  <div className="text-lg font-semibold text-foreground capitalize">
                    {sequence.aggregatedAttributes.avgTrafficDensity}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium text-foreground">Conditions</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Weather:</span>
                    <span className="ml-1 font-medium text-foreground capitalize">
                      {sequence.aggregatedAttributes.predominantWeather}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-1 font-medium text-foreground">
                      {new Date(sequence.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  Play Video
                </Button>
                <Link 
                  to={`/projects/${projectId}/pipelines/${pipelineId}/sequences/${sequence.id}/frames`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    Check Frames
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sequences.length === 0 && (
        <div className="text-center py-12">
          <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No sequences found</h3>
          <p className="text-muted-foreground mb-4">This pipeline doesn't have any sequences yet</p>
          <Button className="gradient-primary text-primary-foreground">
            Add Sequence
          </Button>
        </div>
      )}
    </div>
  );
};

export default SequencesPage;