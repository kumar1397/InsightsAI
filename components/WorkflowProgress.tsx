import { Check } from "lucide-react";

interface WorkflowStep {
  label: string;
  status: "complete" | "active" | "upcoming";
}

interface WorkflowProgressProps {
  steps: WorkflowStep[];
}

const WorkflowProgress = ({ steps }: WorkflowProgressProps) => {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-semibold transition-colors ${
                step.status === "complete"
                  ? "bg-success text-success-foreground"
                  : step.status === "active"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.status === "complete" ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step.status === "active"
                  ? "text-foreground"
                  : step.status === "complete"
                  ? "text-muted-foreground"
                  : "text-muted-foreground/60"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-6 lg:w-10 ${
                step.status === "complete" ? "bg-success/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkflowProgress;
