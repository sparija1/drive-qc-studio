import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/data/mockData";
import { FolderOpen, GitBranch, PlayCircle, Image, Calendar, Activity } from "lucide-react";

const ProjectsPage = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'archived': return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your data annotation projects and review QC results
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground hover:shadow-glow transition-smooth">
          <FolderOpen className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map((project) => (
          <Card key={project.id} className="shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground mb-1">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)} variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    {project.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4 mr-1" />
                    Pipelines
                  </div>
                  <div className="text-lg font-semibold text-foreground">{project.pipelineCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Sequences
                  </div>
                  <div className="text-lg font-semibold text-foreground">{project.totalSequences}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Image className="h-4 w-4 mr-1" />
                  Total Frames
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {project.totalFrames.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(project.lastModified).toLocaleDateString()}
                </div>
                <Link to={`/projects/${project.id}/pipelines`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Pipelines
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started</p>
          <Button className="gradient-primary text-primary-foreground">
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;