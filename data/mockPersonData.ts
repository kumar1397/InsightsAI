export interface Project {
  id: string;
  name: string;
  problemStatement: string;
}

export interface Question {
  id: string;
  projectId: string;
  title: string;
  description?: string;
}

export interface Persona {
  id: string;
  projectId: string;
  name: string;
  role: string;
  image: string;
  background: string;
  goals: string[];
  painPoints: string[];
}

export const projects: Project[] = [
  {
    id: "p1",
    name: "FinTrack Mobile App",
    problemStatement:
      "How can we simplify personal finance management for millennials who feel overwhelmed by existing budgeting tools?",
  },
  {
    id: "p2",
    name: "HealthSync Wearable",
    problemStatement:
      "What motivates health-conscious consumers to adopt wearable devices, and what causes them to abandon them within 90 days?",
  },
  {
    id: "p3",
    name: "EduLearn Platform",
    problemStatement:
      "How do adult learners choose online courses, and what factors drive completion vs. dropout?",
  },
];

export const questions: Question[] = [
  // FinTrack
  { id: "q1", projectId: "p1", title: "What does 'financial control' mean to you?", description: "Explores emotional relationship with money management." },
  { id: "q2", projectId: "p1", title: "Describe your current budgeting process.", description: "Identifies existing behaviors and tools used." },
  { id: "q3", projectId: "p1", title: "What frustrates you most about tracking expenses?", description: "Uncovers core pain points in current workflows." },
  { id: "q4", projectId: "p1", title: "How often do you check your financial status?", description: "Measures engagement frequency expectations." },
  { id: "q5", projectId: "p1", title: "What would make you trust a new finance app?" },
  // HealthSync
  { id: "q6", projectId: "p2", title: "What motivated you to try a wearable device?", description: "Identifies initial purchase drivers." },
  { id: "q7", projectId: "p2", title: "How do you use health data in your daily routine?" },
  { id: "q8", projectId: "p2", title: "At what point did you consider stopping use?", description: "Pinpoints abandonment triggers." },
  { id: "q9", projectId: "p2", title: "What features would bring you back to using a wearable?" },
  // EduLearn
  { id: "q10", projectId: "p3", title: "How do you decide which online course to take?", description: "Maps decision-making criteria." },
  { id: "q11", projectId: "p3", title: "What keeps you engaged throughout a course?" },
  { id: "q12", projectId: "p3", title: "Describe a course you dropped — why did you stop?", description: "Explores dropout motivations." },
  { id: "q13", projectId: "p3", title: "How important are credentials vs. actual skills?" },
];

export const personas: Persona[] = [
  // FinTrack
  {
    id: "pe1",
    projectId: "p1",
    name: "Sarah Chen",
    role: "Budget-Conscious Millennial",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    background: "28-year-old marketing coordinator living in a metro city. Earns a moderate salary and juggles student loans, rent, and social life. Uses spreadsheets sporadically but loses track by mid-month.",
    goals: ["Build an emergency fund", "Pay off student loans faster", "Save for international travel"],
    painPoints: ["Overwhelmed by too many categories", "Forgets to log expenses", "Feels guilty about spending"],
  },
  {
    id: "pe2",
    projectId: "p1",
    name: "Marcus Johnson",
    role: "Freelance Power User",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    background: "34-year-old freelance developer with irregular income. Needs to separate personal and business expenses. Has tried 5+ finance apps but found them too rigid.",
    goals: ["Track variable income accurately", "Automate tax-related categorization", "Visualize cash flow trends"],
    painPoints: ["Apps assume fixed salary", "Manual entry is tedious", "Can't handle multiple income streams"],
  },
  {
    id: "pe3",
    projectId: "p1",
    name: "Priya Sharma",
    role: "Skeptical First-Timer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    background: "25-year-old recent graduate entering the workforce. Has never used a budgeting tool. Distrusts apps with financial data access and prefers cash-based tracking.",
    goals: ["Understand where money goes", "Start saving without lifestyle change", "Learn financial basics"],
    painPoints: ["Privacy concerns with linking bank accounts", "Jargon-heavy interfaces", "Doesn't see immediate value"],
  },
  // HealthSync
  {
    id: "pe4",
    projectId: "p2",
    name: "David Kim",
    role: "Fitness Enthusiast",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    background: "31-year-old software engineer who runs marathons. Obsessed with optimizing performance metrics. Owns multiple wearables and compares data across platforms.",
    goals: ["Track VO2 max and recovery", "Compare device accuracy", "Share progress with running club"],
    painPoints: ["Data silos between devices", "Inaccurate sleep tracking", "Battery life limitations"],
  },
  {
    id: "pe5",
    projectId: "p2",
    name: "Elena Rodriguez",
    role: "Health-Anxious User",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    background: "42-year-old teacher who bought a wearable after a health scare. Uses it primarily for heart rate monitoring but gets anxious about abnormal readings.",
    goals: ["Monitor heart health passively", "Get doctor-friendly reports", "Reduce health anxiety"],
    painPoints: ["Alarming notifications cause stress", "Can't interpret medical data", "No integration with her doctor's system"],
  },
  // EduLearn
  {
    id: "pe6",
    projectId: "p3",
    name: "James Wright",
    role: "Career Switcher",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    background: "38-year-old former accountant transitioning into UX design. Takes multiple courses simultaneously. Values practical projects over theory.",
    goals: ["Build a portfolio quickly", "Get industry-recognized credentials", "Network with peers"],
    painPoints: ["Courses are too theoretical", "No real feedback on projects", "Hard to gauge course quality before enrolling"],
  },
  {
    id: "pe7",
    projectId: "p3",
    name: "Aisha Patel",
    role: "Lifelong Learner",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    background: "55-year-old retired professional who takes courses for personal enrichment. Not motivated by career outcomes but by intellectual curiosity and social connection.",
    goals: ["Learn new subjects for fun", "Connect with like-minded learners", "Flexible scheduling"],
    painPoints: ["Content assumes career motivation", "Lack of community features", "Too fast-paced for leisurely learning"],
  },
];
