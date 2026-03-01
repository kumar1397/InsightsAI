import { projects } from "./mockPersonData";

export interface Report {
  id: string;
  projectId: string;
  title: string;
  generatedDate: string;
  summary: string;
  keyInsights: string[];
  personaObservations: string[];
  userFeedback: string[];
  recommendations: string[];
}

// Only p1 has a pre-existing report
export const existingReports: Report[] = [
  {
    id: "r1",
    projectId: "p1",
    title: "FinTrack Mobile App – Customer Insights Report",
    generatedDate: "2026-02-20",
    summary:
      "Our research combined AI persona simulations and real customer interviews to explore how millennials relate to personal finance management. The findings reveal a strong desire for simplicity and automation over granular control. Users are willing to adopt new tools but need trust signals upfront, especially around data privacy. Freelancers represent an underserved power-user segment with unique needs around variable income tracking.",
    keyInsights: [
      "78% of simulated and real respondents feel overwhelmed by category-heavy budgeting interfaces.",
      "Trust is the #1 barrier to adoption — users want to see value before linking bank accounts.",
      "Automation of expense categorization is the most requested feature across all segments.",
      "Freelancers need multi-stream income tracking that no current competitor handles well.",
      "Weekly financial summaries are preferred over real-time notifications.",
    ],
    personaObservations: [
      "Sarah Chen (Budget-Conscious Millennial): Desires a guilt-free budgeting experience. Responds best to positive reinforcement and milestone celebrations.",
      "Marcus Johnson (Freelance Power User): Frustrated by rigid income models. Needs tax-category automation and cash-flow visualization.",
      "Priya Sharma (Skeptical First-Timer): Strong privacy concerns. Prefers manual entry initially with optional bank linking later.",
    ],
    userFeedback: [
      "\"I just want to know if I'm doing okay — not be judged by an app.\" — Interview #4",
      "\"Every finance app assumes I get paid on the 1st and 15th. That's not my life.\" — Interview #7",
      "\"I stopped using my last app because it asked for my bank login on day one.\" — Interview #2",
      "\"A weekly email digest would be way more useful than push notifications.\" — Interview #11",
    ],
    recommendations: [
      "Implement a progressive trust model: allow manual-first entry with optional bank linking after 2 weeks of use.",
      "Design a simplified dashboard with max 5 categories visible by default; let users expand on demand.",
      "Add a freelancer mode that supports irregular income and automatic tax-related tagging.",
      "Replace real-time alerts with a configurable weekly financial summary.",
      "Introduce a 'Financial Health Score' with positive framing to reduce anxiety.",
    ],
  },
];

export function generateMockReport(projectId: string): Report {
  const project = projects.find((p) => p.id === projectId);
  const name = project?.name ?? "Unknown Project";

  return {
    id: `r-gen-${projectId}`,
    projectId,
    title: `${name} – Customer Insights Report`,
    generatedDate: new Date().toISOString().slice(0, 10),
    summary: `This report synthesizes findings from AI persona simulations and real customer interviews conducted for the "${name}" project. The analysis identifies recurring themes, critical pain points, and actionable opportunities that emerged from both synthetic and human-sourced data. The convergence of insights across AI and human channels provides high-confidence directional guidance for product strategy.`,
    keyInsights: [
      "Users consistently prioritize ease-of-use over feature richness in initial interactions.",
      "There is a significant gap between perceived and actual user needs identified by persona simulations.",
      "Emotional drivers (trust, anxiety, curiosity) outweigh functional drivers in adoption decisions.",
      "Power users and casual users have fundamentally different mental models for the same product.",
    ],
    personaObservations: [
      "AI personas revealed edge-case scenarios that real interviews alone would not have surfaced.",
      "Persona responses showed high alignment with real user sentiment on core pain points.",
      "Divergence was highest around technical feature preferences, suggesting persona calibration opportunities.",
    ],
    userFeedback: [
      '"I didn\'t know I needed this until someone described it to me." — Interview participant',
      '"The biggest thing for me is not feeling stupid when I use something new." — Interview participant',
      '"I would recommend this if it saved me even 10 minutes a week." — Interview participant',
    ],
    recommendations: [
      "Prioritize onboarding simplification to reduce time-to-value below 3 minutes.",
      "Develop segmented experiences for power users vs. casual users.",
      "Invest in trust-building UX patterns (transparency, control, progressive disclosure).",
      "Run a follow-up validation round focusing on the divergent areas identified between AI and human insights.",
    ],
  };
}
