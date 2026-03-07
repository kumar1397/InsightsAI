"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Plus, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const workflowSteps = [
  { label: "Define", status: "active" as const },
  { label: "Questionnaire", status: "upcoming" as const },
  { label: "AI Personas", status: "upcoming" as const },
  { label: "Interviews", status: "upcoming" as const },
  { label: "Insights", status: "upcoming" as const },
  { label: "Report", status: "upcoming" as const },
];

const mockRefinedQuestions = [
  "How do hybrid team members (3-5 tools daily) prioritize and evaluate consolidation of collaboration tools?",
  "What friction points drive tool abandonment vs. adoption in mid-market teams?",
  "What are the key decision criteria for IT leaders when evaluating collaboration tool consolidation?",
  "How does tool fatigue correlate with employee productivity and satisfaction in hybrid teams?",
  "What role does end-user preference play in procurement decisions for collaboration tools?",
];

export default function NewProject() {
  const router = useRouter();
  const [problemTitle, setProblemTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [target, setTarget] = useState("");
  const [industry, setIndustry] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [projectId, setProjectId] = useState("");

  async function handleRefine() {
    const payload = {
      problemTitle,
      problemStatement,
      target,
      industry,
    };
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_AWS_URL}/refine-questions`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    const result = await data.json();
    console.log("Received:", result);
    if (result.questions) {
      setProjectId(result.projectId);
      setQuestions(result.questions);
      setShowResults(true);
    } else {
      setQuestions(mockRefinedQuestions);
      setShowResults(true);
    }
  }

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions((prev) => [...prev, newQuestion.trim()]);
      setNewQuestion("");
      setIsAdding(false);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSaveQuestions() {
    try {
      const payload = {
        projectId,
        questions,
      };
      console.log("Saving questions:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_AWS_URL}/save-questions`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      console.log("Save result:", result);

      if (response.ok) {
        alert("Questions saved successfully");
      } else {
        alert("Failed to save questions");
      }
    } catch (error) {
      console.error("Save error:", error);

      alert("Error saving questions");
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </button>
        <div className="flex flex-col sm:items-left sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">New Insight Project</h1>
            <p className="text-sm text-muted-foreground">
              Define your research problem and let AI help structure your
              approach
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          <div className="bg-card rounded-lg border p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Problem Title
              </label>
              <Textarea
                placeholder="e.g., We're seeing high churn in our mid-market segment but don't understand the root causes..."
                value={problemTitle}
                onChange={(e) => setProblemTitle(e.target.value)}
                className="min-h-25 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Problem Statement
              </label>
              <Textarea
                placeholder="e.g., We're seeing high churn in our mid-market segment but don't understand the root causes..."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="min-h-25 text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Target Consumer
              </label>
              <Textarea
                placeholder="e.g., Mid-market SaaS customers, 50-500 employees, using our product for 3-12 months..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="min-h-20 text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Industry / Domain
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS & Technology</SelectItem>
                  <SelectItem value="fmcg">FMCG & Consumer Goods</SelectItem>
                  <SelectItem value="fintech">FinTech & Banking</SelectItem>
                  <SelectItem value="healthcare">
                    Healthcare & Life Sciences
                  </SelectItem>
                  <SelectItem value="retail">Retail & E-Commerce</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 transition-opacity"
              onClick={handleRefine}
              disabled={!problemStatement.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Refine with AI
            </Button>
          </div>
        </motion.div>

        {/* Right: Refined Questions */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center rounded-lg border border-dashed bg-card p-8"
              >
                <div className="text-center max-w-xs">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    AI-Powered Refinement
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Enter your problem statement and target consumers, then let
                    AI refine your research approach
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-lg border p-5">
                  <h3 className="text-sm font-semibold mb-4">
                    Refined Questions
                  </h3>
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 p-3 rounded-md border bg-muted/30 group"
                      >
                        <span className="text-xs font-medium text-muted-foreground mt-0.5 shrink-0">
                          {i + 1}.
                        </span>
                        <p className="text-xs leading-relaxed flex-1">{q}</p>
                        <button
                          onClick={() => handleRemoveQuestion(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {isAdding ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 flex gap-2"
                    >
                      <Input
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Type your question..."
                        className="text-sm"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddQuestion()
                        }
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleAddQuestion}
                        disabled={!newQuestion.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAdding(false);
                          setNewQuestion("");
                        }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsAdding(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add More Questions
                    </Button>
                  )}
                </div>

                <Button
                  className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 transition-opacity"
                  onClick={handleSaveQuestions}
                  disabled={questions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Submit Questions as JSON
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
