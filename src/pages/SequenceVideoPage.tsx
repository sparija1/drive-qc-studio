import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/sequences/VideoPlayer";
import { SequenceDetails } from "@/components/sequences/SequenceDetails";
import { useSequenceById } from "@/hooks/useSequences";
import { usePipelineById } from "@/hooks/usePipelines";
import { useProjectById } from "@/hooks/useProjects";
import { ArrowLeft, Loader2 } from "lucide-react";

const SequenceVideoPage = () => {
  const { projectId, pipelineId, sequenceId } = useParams();
  const { data: project } = useProjectById(projectId!);
  const { data: pipeline } = usePipelineById(pipelineId!);
  const { data: sequence, isLoading } = useSequenceById(sequenceId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link 
          to={`/projects/${projectId}/pipelines/${pipelineId}/sequences`} 
          className="text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Video Player</h1>
      </div>
      
      <div className="space-y-6">
        {/* Video Player with integrated frame attributes */}
        <VideoPlayer sequenceId={sequence.id} fps={sequence.fps || 30} />
        
        {/* Sequence Details */}
        <SequenceDetails sequence={sequence} />
      </div>
    </div>
  );
};

export default SequenceVideoPage;