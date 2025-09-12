import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectById, getPipelinesByProjectId } from "@/data/mockData";
import { GitBranch, PlayCircle, Image, Calendar, Activity, ArrowLeft } from "lucide-react";

const PipelinesPage = () => {
  const { projectId } = useParams();
  const project = projectId ? getProjectById(projectId) : null;
  const pipelines = projectId ? getPipelinesByProjectId(projectId) : [];

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">Project not found</h3>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-smooth">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Pipelines</h1>
          </div>
          <p className="text-muted-foreground">
            Data processing pipelines in <span className="font-medium text-foreground">{project.name}</span>
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground hover:shadow-glow transition-smooth">
          <GitBranch className="h-4 w-4 mr-2" />
          New Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground mb-1">{pipeline.name}</CardTitle>
                  <Badge className={getStatusColor(pipeline.status)} variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    {pipeline.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {pipeline.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Sequences
                  </div>
                  <div className="text-lg font-semibold text-foreground">{pipeline.sequenceCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Image className="h-4 w-4 mr-1" />
                    Frames
                  </div>
                  <div className="text-lg font-semibold text-foreground">{pipeline.totalFrames.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(pipeline.lastModified).toLocaleDateString()}
                </div>
                <Link to={`/projects/${projectId}/pipelines/${pipeline.id}/sequences`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Sequences
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pipelines.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No pipelines found</h3>
          <p className="text-muted-foreground mb-4">Create your first pipeline to start processing data</p>
          <Button className="gradient-primary text-primary-foreground">
            Create Pipeline
          </Button>
        </div>
      )}
    </div>
  );
};

export default PipelinesPage;