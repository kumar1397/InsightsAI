
interface Project {
  projectId: string;
  projectName?: string;
  industry?: string;
  targetConsumer?: string;
  refinedProblemStatement?: string;
  questions?: string[];
  createdAt?: string;
}

const ProjectCard = ({ projectName, refinedProblemStatement, createdAt }: Project) => {
  return (
    <button
      onClick={() => console.log("Clicked project:", projectName)}
      className="group w-full text-left bg-card rounded-lg border p-5 hover:shadow-lg transition-all duration-200 hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-foreground transition-colors">
          {projectName}
        </h3>
      </div>
      {refinedProblemStatement && (
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {refinedProblemStatement}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Updated {createdAt}
      </p>
    </button>
  );
};

export default ProjectCard;
