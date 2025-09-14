import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectForm } from "@/components/forms/CreateProjectForm";
import { AieouHeader } from "@/components/branding/AieouHeader";
import { FolderOpen, GitBranch, PlayCircle, Image, Calendar, Activity, Trash2 } from "lucide-react";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ProjectsPage = () => {
  const { data: projects = [], isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'archived': return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  // Calculate aggregated stats for each project
  const getProjectStats = (projectId: string) => {
    // This would normally be done with joins or separate queries
    // For now, return default values that will be updated when we implement proper aggregation
    return {
      pipelineCount: 0,
      totalSequences: 0,
      totalFrames: 0,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your data annotation projects and review QC results
            </p>
          </div>
          <CreateProjectForm />
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your data annotation projects and review QC results
            </p>
          </div>
          <CreateProjectForm />
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AieouHeader />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your data annotation projects and review QC results
          </p>
        </div>
        <CreateProjectForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const stats = getProjectStats(project.id);
          return (
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
                  <div className="text-lg font-semibold text-foreground">{stats.pipelineCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Sequences
                  </div>
                  <div className="text-lg font-semibold text-foreground">{stats.totalSequences}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Image className="h-4 w-4 mr-1" />
                  Total Frames
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.totalFrames.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Link to={`/projects/${project.id}/pipelines`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Pipelines
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.name}"? This will also delete all pipelines, sequences, and frames associated with this project. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject.mutate(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started</p>
          <CreateProjectForm />
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;