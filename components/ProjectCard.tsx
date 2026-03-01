import { Badge } from "@/components/ui/badge";

type ProjectStatus = "Exploring" | "Validating" | "Analyzing" | "Ready";

interface ProjectCardProps {
  name: string;
  status: ProjectStatus;
  lastUpdated: string;
  description?: string;
  onClick?: () => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  Exploring: "bg-info/10 text-info border-info/20",
  Validating: "bg-warning/10 text-warning border-warning/20",
  Analyzing: "bg-accent/10 text-accent border-accent/20",
  Ready: "bg-success/10 text-success border-success/20",
};

const ProjectCard = ({ name, status, lastUpdated, description, onClick }: ProjectCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-card rounded-lg border p-5 hover:shadow-lg transition-all duration-200 hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-foreground transition-colors">
          {name}
        </h3>
        <Badge variant="outline" className={`text-[10px] font-medium ${statusStyles[status]}`}>
          {status}
        </Badge>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Updated {lastUpdated}
      </p>
    </button>
  );
};

export default ProjectCard;
