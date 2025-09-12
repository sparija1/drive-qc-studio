import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ProjectsPage from "./pages/ProjectsPage";
import PipelinesPage from "./pages/PipelinesPage";
import SequencesPage from "./pages/SequencesPage";
import SequenceVideoPage from "./pages/SequenceVideoPage";
import FramesPage from "./pages/FramesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen w-full bg-background">
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<ProjectsPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:projectId/pipelines" element={<PipelinesPage />} />
                <Route path="projects/:projectId/pipelines/:pipelineId/sequences" element={<SequencesPage />} />
                <Route path="projects/:projectId/pipelines/:pipelineId/sequences/:sequenceId/video" element={<SequenceVideoPage />} />
                <Route path="projects/:projectId/pipelines/:pipelineId/sequences/:sequenceId/frames" element={<FramesPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;