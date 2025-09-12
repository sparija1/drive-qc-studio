import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/sequences/VideoPlayer";
import { SequenceDetails } from "@/components/sequences/SequenceDetails";
import { getProjectById, getPipelineById, getSequenceById } from "@/data/mockData";
import { ArrowLeft } from "lucide-react";

const SequenceVideoPage = () => {
  const { projectId, pipelineId, sequenceId } = useParams();
  const project = projectId ? getProjectById(projectId) : null;
  const pipeline = pipelineId ? getPipelineById(pipelineId) : null;
  const sequence = sequenceId ? getSequenceById(sequenceId) : null;

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player - Takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <VideoPlayer sequenceId={sequence.id} fps={sequence.fps} />
        </div>
        
        {/* Sequence Details - Takes 1/3 of the space */}
        <div className="lg:col-span-1">
          <SequenceDetails sequence={sequence} />
        </div>
      </div>
    </div>
  );
};

export default SequenceVideoPage;