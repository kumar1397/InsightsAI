import { useRouter } from "next/navigation";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export const PersonasPage = () => (
  <PlaceholderPage
    title="AI Persona Simulation"
    description="Run simulated interviews with AI personas to explore hypotheses before engaging real customers."
  />
);

export const InterviewsPage = () => (
  <PlaceholderPage
    title="Voice Interviews"
    description="Set up and manage real customer interviews with automated transcription and sentiment analysis."
  />
);

export const TechnicalInsightsPage = () => (
  <PlaceholderPage
    title="Technical Insights"
    description="Pattern detection, sentiment analysis, and AI vs. Human signal comparison from your research data."
  />
);

export const BusinessInsightsPage = () => (
  <PlaceholderPage
    title="Business Insights"
    description="Strategic implications, decision guidance, and opportunity mapping from your validated insights."
  />
);

export const ReportsPage = () => (
  <PlaceholderPage
    title="Reports & Presentations"
    description="Generate executive-ready presentations with auto-structured slides and inline editing."
  />
);

export const SettingsPage = () => (
  <PlaceholderPage
    title="Settings"
    description="Manage your organization, team members, and project configurations."
  />
);
