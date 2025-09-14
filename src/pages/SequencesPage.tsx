import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateSequenceForm } from "@/components/forms/CreateSequenceForm";
import { BulkImageUpload } from "@/components/upload/BulkImageUpload";
import { CSVAttributeUpload } from "@/components/upload/CSVAttributeUpload";
import { SequenceTileGrid } from "@/components/sequences/SequenceTileGrid";
import { AieouHeader } from "@/components/branding/AieouHeader";
import { useSequencesByPipelineId, useDeleteSequence } from "@/hooks/useSequences";
import { usePipelineById } from "@/hooks/usePipelines";
import { useProjectById } from "@/hooks/useProjects";
import { PlayCircle, ArrowLeft, Loader2, FileSpreadsheet, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SequencesPage = () => {
  const { projectId, pipelineId } = useParams();
  const { data: project } = useProjectById(projectId!);
  const { data: pipeline } = usePipelineById(pipelineId!);
  const { data: sequences = [], isLoading, error, refetch } = useSequencesByPipelineId(pipelineId!);
  const deleteSequence = useDeleteSequence();
  const { toast } = useToast();
  const [analyzingSequences, setAnalyzingSequences] = useState<Set<string>>(new Set());

  const handleAnalyzeFrames = async (sequenceId: string) => {
    setAnalyzingSequences(prev => new Set(prev).add(sequenceId));
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-frames', {
        body: { sequenceId }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: data.message || "Frames have been analyzed successfully.",
      });
      
      refetch(); // Refresh the data to show updated attributes
    } catch (error) {
      console.error('Error analyzing frames:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the frames. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingSequences(prev => {
        const next = new Set(prev);
        next.delete(sequenceId);
        return next;
      });
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="space-y-6">
      <AieouHeader />
      
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
            Video sequences in <span className="font-medium text-primary">{pipeline.name}</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="sequences" className="w-full">
        <TabsList>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="sequences">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your Sequences</h2>
                <p className="text-muted-foreground mt-1">Manage and analyze your video sequences</p>
              </div>
              <CreateSequenceForm pipelineId={pipelineId || ''} />
            </div>
            
            {sequences.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-6">
                  <PlayCircle className="h-12 w-12 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No sequences found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  This pipeline doesn't have any sequences yet. Create your first sequence to get started.
                </p>
                <CreateSequenceForm pipelineId={pipelineId || ''} />
              </div>
            ) : (
              <SequenceTileGrid
                sequences={sequences}
                projectId={projectId!}
                pipelineId={pipelineId!}
                onDelete={(id) => deleteSequence.mutate(id)}
                onAnalyze={handleAnalyzeFrames}
                analyzingSequences={analyzingSequences}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upload">
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Sequential Images Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Sequential Images Upload
                  </CardTitle>
                  <CardDescription>
                    Upload frames as sequential images to create a new sequence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BulkImageUpload 
                    pipelineId={pipelineId || ''} 
                    onUploadComplete={(sequenceId) => {
                      console.log('Upload completed for sequence:', sequenceId);
                      refetch();
                    }} 
                  />
                </CardContent>
              </Card>

              {/* CSV Attributes Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    CSV Attributes Upload
                  </CardTitle>
                  <CardDescription>
                    Upload CSV files to add attributes to existing sequence frames
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sequences.length > 0 ? (
                    <div className="space-y-4">
                      {sequences.map(sequence => (
                        <div key={sequence.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{sequence.name}</h4>
                            <Badge variant="outline">{sequence.total_frames} frames</Badge>
                          </div>
                          <CSVAttributeUpload 
                            sequenceId={sequence.id} 
                            onUploadComplete={() => {
                              console.log('CSV upload completed for sequence:', sequence.id);
                              refetch();
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4" />
                      <p>No sequences available for attribute upload</p>
                      <p className="text-sm">Create a sequence first using the Sequential Images Upload</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SequencesPage;