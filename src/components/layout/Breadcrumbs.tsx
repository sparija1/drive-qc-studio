import { useLocation, useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getProjectById, getPipelineById, getSequenceById } from "@/data/mockData";

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  
  const project = params.projectId ? getProjectById(params.projectId) : null;
  const pipeline = params.pipelineId ? getPipelineById(params.pipelineId) : null;
  const sequence = params.sequenceId ? getSequenceById(params.sequenceId) : null;

  const breadcrumbs = [];

  // Always start with Projects
  breadcrumbs.push({
    label: "Projects",
    href: "/projects",
    active: location.pathname === "/" || location.pathname === "/projects"
  });

  // Add project if we're in one
  if (project) {
    breadcrumbs.push({
      label: project.name,
      href: `/projects/${project.id}/pipelines`,
      active: location.pathname.includes("/pipelines") && !location.pathname.includes("/sequences")
    });
  }

  // Add pipeline if we're in one
  if (pipeline) {
    breadcrumbs.push({
      label: pipeline.name,
      href: `/projects/${params.projectId}/pipelines/${pipeline.id}/sequences`,
      active: location.pathname.includes("/sequences") && !location.pathname.includes("/frames")
    });
  }

  // Add sequence if we're in one
  if (sequence) {
    breadcrumbs.push({
      label: sequence.name,
      href: `/projects/${params.projectId}/pipelines/${params.pipelineId}/sequences/${sequence.id}/frames`,
      active: location.pathname.includes("/frames")
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {breadcrumb.active ? (
            <span className="text-foreground font-medium">{breadcrumb.label}</span>
          ) : (
            <Link 
              to={breadcrumb.href} 
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}