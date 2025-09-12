import { useLocation, useParams } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  FolderOpen, 
  GitBranch, 
  PlayCircle, 
  Image,
  Activity,
  BarChart3
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { getProjectById, getPipelineById, getSequenceById } from "@/data/mockData";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const params = useParams();
  const currentPath = location.pathname;

  // Get current context
  const project = params.projectId ? getProjectById(params.projectId) : null;
  const pipeline = params.pipelineId ? getPipelineById(params.pipelineId) : null;
  const sequence = params.sequenceId ? getSequenceById(params.sequenceId) : null;

  const navigationItems = [
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      isActive: currentPath === "/" || currentPath === "/projects"
    }
  ];

  // Add pipeline navigation if in project context
  if (project) {
    navigationItems.push({
      title: "Pipelines",
      url: `/projects/${project.id}/pipelines`,
      icon: GitBranch,
      isActive: currentPath.includes("/pipelines") && !currentPath.includes("/sequences")
    });
  }

  // Add sequences navigation if in pipeline context
  if (pipeline) {
    navigationItems.push({
      title: "Sequences",
      url: `/projects/${params.projectId}/pipelines/${pipeline.id}/sequences`,
      icon: PlayCircle,
      isActive: currentPath.includes("/sequences") && !currentPath.includes("/frames")
    });
  }

  // Add frames navigation if in sequence context
  if (sequence) {
    navigationItems.push({
      title: "Frames",
      url: `/projects/${params.projectId}/pipelines/${params.pipelineId}/sequences/${sequence.id}/frames`,
      icon: Image,
      isActive: currentPath.includes("/frames")
    });
  }

  const getNavClassName = (isActive: boolean) =>
    `transition-smooth ${
      isActive 
        ? "bg-primary/10 text-primary border-r-2 border-primary" 
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const collapsed = state === "collapsed";

  return (
    <Sidebar className={`transition-smooth ${collapsed ? "w-16" : "w-64"}`} collapsible="icon">
      <SidebarContent className="gradient-surface border-r border-sidebar-border">
        {/* Header */}
        {!collapsed && (
          <div className="px-6 py-4 border-b border-sidebar-border">
            <h2 className="text-lg font-semibold text-foreground">SceneCura</h2>
          </div>
        )}
        {/* Quick Stats Section */}
        {!collapsed && (
          <SidebarGroup className="mb-4">
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Quick Stats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="grid grid-cols-2 gap-2 p-2">
                <div className="bg-card/50 rounded-lg p-3 text-center">
                  <Activity className="h-4 w-4 mx-auto mb-1 text-success" />
                  <div className="text-xs text-muted-foreground">Active</div>
                  <div className="text-sm font-semibold">12</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 text-center">
                  <BarChart3 className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-sm font-semibold">85K</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wide">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName(item.isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Current Context Section */}
        {!collapsed && (project || pipeline || sequence) && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Current Context
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 p-2">
                {project && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Project:</span>
                    <div className="font-medium text-foreground truncate">{project.name}</div>
                  </div>
                )}
                {pipeline && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Pipeline:</span>
                    <div className="font-medium text-foreground truncate">{pipeline.name}</div>
                  </div>
                )}
                {sequence && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Sequence:</span>
                    <div className="font-medium text-foreground truncate">{sequence.name}</div>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}