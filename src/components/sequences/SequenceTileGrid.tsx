import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, Trash2, Eye, Image, Clock, Camera, Brain, Loader2 } from 'lucide-react';
import { Sequence } from '@/hooks/useSequences';
import { ImageViewer } from './ImageViewer';

interface SequenceTileGridProps {
  sequences: Sequence[];
  projectId: string;
  pipelineId: string;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
  analyzingSequences: Set<string>;
}

export const SequenceTileGrid = ({ 
  sequences, 
  projectId, 
  pipelineId, 
  onDelete, 
  onAnalyze,
  analyzingSequences 
}: SequenceTileGridProps) => {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sequences.map((sequence) => (
          <Card 
            key={sequence.id} 
            className="group relative overflow-hidden gradient-surface border-border/50 hover:shadow-elevated transition-all duration-300 hover:scale-[1.02]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {sequence.name}
                  </h3>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${getStatusColor(sequence.status)}`}
                  >
                    {sequence.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Frames:</span>
                  <span className="font-medium">{sequence.total_frames || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{sequence.duration ? `${sequence.duration}s` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">FPS:</span>
                  <span className="font-medium">{sequence.fps || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-xs">
                    {new Date(sequence.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSequenceId(sequence.id)}
                  className="flex-1"
                  disabled={!sequence.total_frames || sequence.total_frames === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Images
                </Button>
                
                <Link 
                  to={`/projects/${projectId}/pipelines/${pipelineId}/sequences/${sequence.id}/video`}
                  className="flex-1"
                >
                  <Button variant="default" size="sm" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                </Link>
              </div>

              {/* Analysis Button */}
              {sequence.total_frames > 0 && (
                <Button
                  onClick={() => onAnalyze(sequence.id)}
                  disabled={analyzingSequences.has(sequence.id)}
                  className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                  size="sm"
                >
                  {analyzingSequences.has(sequence.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Frames
                    </>
                  )}
                </Button>
              )}

              {/* Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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
                      onClick={() => onDelete(sequence.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Viewer Modal */}
      {selectedSequenceId && (
        <ImageViewer
          sequenceId={selectedSequenceId}
          isOpen={!!selectedSequenceId}
          onClose={() => setSelectedSequenceId(null)}
        />
      )}
    </>
  );
};