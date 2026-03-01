interface ConfidenceBadgeProps {
  score: number; // 0-100
  size?: "sm" | "md";
}

const ConfidenceBadge = ({ score, size = "sm" }: ConfidenceBadgeProps) => {
  const getColor = () => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getLabel = () => {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  };

  const sizeClasses = size === "sm" ? "text-[10px] gap-1" : "text-xs gap-1.5";

  return (
    <span className={`inline-flex items-center font-medium ${getColor()} ${sizeClasses}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 ${score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive"}`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive"}`} />
      </span>
      {score}% {getLabel()}
    </span>
  );
};

export default ConfidenceBadge;
