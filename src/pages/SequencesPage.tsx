import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CreateSequenceForm } from "@/components/forms/CreateSequenceForm";
import { BulkImageUpload } from "@/components/upload/BulkImageUpload";
import { CSVAttributeUpload } from "@/components/upload/CSVAttributeUpload";
import { FrameTable } from "@/components/sequences/FrameTable";
import { useSequencesByPipelineId, useDeleteSequence } from "@/hooks/useSequences";
import { usePipelineById } from "@/hooks/usePipelines";
import { useProjectById } from "@/hooks/useProjects";
import { PlayCircle, Image, Clock, Target, ArrowLeft, Play, Video, Camera, Users, Car, Route, Trash2, Loader2, FileSpreadsheet, ChevronDown, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());

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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Sequences</h2>
              <CreateSequenceForm pipelineId={pipelineId || ''} />
            </div>
            
            <div className="space-y-4">{/* Changed from grid to vertical spacing */}
              {sequences.map((sequence) => (
                <Collapsible
                  key={sequence.id}
                  open={expandedSequences.has(sequence.id)}
                  onOpenChange={(open) => {
                    const newExpanded = new Set(expandedSequences);
                    if (open) {
                      newExpanded.add(sequence.id);
                    } else {
                      newExpanded.delete(sequence.id);
                    }
                    setExpandedSequences(newExpanded);
                  }}
                >
                  <Card className="shadow-card hover:shadow-elevated transition-smooth gradient-surface border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-smooth text-left">
                              {expandedSequences.has(sequence.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {sequence.name}
                            </button>
                          </CollapsibleTrigger>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={sequence.status === 'processed' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {sequence.status}
                            </Badge>
                            <Link to={`/projects/${projectId}/pipelines/${pipelineId}/sequences/${sequence.id}/video`}>
                              <Button variant="outline" size="sm">
                                <Play className="h-4 w-4 mr-2" />
                                Play
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
                                  <AlertDialogTitle>Delete Sequence</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{sequence.name}"? This will also delete all frames associated with this sequence. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSequence.mutate(sequence.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <span>FPS: {sequence.fps || 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <span>Frames: {sequence.total_frames || 0}</span>
                        <span className="mx-2">•</span>
                        <span>Duration: {sequence.duration ? `${sequence.duration}s` : 'N/A'}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span>Created: {new Date(sequence.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Collapsible Frame Table */}
                      <CollapsibleContent>
                        {sequence.total_frames > 0 && (
                          <div className="mt-4 pt-4 border-t">
                          <FrameTable 
                            sequenceId={sequence.id} 
                            showAnalyzeButton={true}
                            onAnalyzeFrames={() => handleAnalyzeFrames(sequence.id)}
                            analyzing={analyzingSequences.has(sequence.id)}
                          />
                          </div>
                        )}
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
            </div>

            {sequences.length === 0 && (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No sequences found</h3>
                <p className="text-muted-foreground mb-4">This pipeline doesn't have any sequences yet</p>
                <CreateSequenceForm pipelineId={pipelineId || ''} />
              </div>
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