"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Loader2, Sparkles, CheckCircle2,
  BarChart2, MessageSquareQuote, Users, TrendingUp,
  AlertTriangle, Lightbulb, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  projectId: string;
  projectName?: string;
  industry?: string;
  targetConsumer?: string;
  refinedProblemStatement?: string;
  questions?: string[];
  createdAt?: string;
}

interface Report {
  reportId: string;
  projectId: string;
  title: string;
  generatedDate: string;
  // 6 sections
  studyOverview: string;
  sampleAndMethodology: string;
  keyQuantitativeSignals: string[];
  keyQualitativeInsights: string[];
  personasAndUseContexts: string[];
  opportunities: string[];
  risksAndWatchouts: string[];
  recommendedActions: string[];
}

type LoadState = "idle" | "generating" | "done" | "error";

// ── Config ────────────────────────────────────────────────────────────────────

const LAMBDA_URL = process.env.NEXT_PUBLIC_REPORT_LAMBDA_URL ?? "/api/get-reports";

// ── Small helpers ─────────────────────────────────────────────────────────────

/** Numbered badge list (Key Quantitative / Recommended Actions) */
function NumberedList({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold
            ${accent ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Bullet list (Qualitative Insights / Personas / Risks) */
function BulletList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`text-sm bg-muted/50 rounded-lg p-3 leading-relaxed ${className}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const [projects, setProjects]               = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [report, setReport]       = useState<Report | null>(null);
  const [reportUrl, setReportUrl] = useState<string>("");
  const [errorMsg, setErrorMsg]   = useState<string>("");

  const selectedProject = projects.find((p) => p.projectId === selectedProjectId);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await api.getProjects();
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setProjectsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedProjectId || !selectedProject) return;
    setReport(null);
    setReportUrl("");
    setErrorMsg("");
    setLoadState("generating");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_AWS_URL}/get-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:        selectedProjectId,
          projectName:      selectedProject.projectName ?? selectedProjectId,
          problemStatement: selectedProject.refinedProblemStatement ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setReport(data.report ?? null);
      setReportUrl(data.reportUrl ?? "");
      setLoadState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setLoadState("error");
    }
  }, [selectedProjectId, selectedProject]);

  const handleProjectChange = (v: string) => {
    setSelectedProjectId(v);
    setLoadState("idle");
    setReport(null);
    setReportUrl("");
    setErrorMsg("");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card">
        <h1 className="text-lg font-semibold">Reports & Presentations</h1>
        <p className="text-sm text-muted-foreground">
          Generate executive-ready insight reports from AI personas and real customer conversations.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Step 1 – Project selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Step 1 — Select Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a project / problem statement…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.projectId} value={p.projectId}>
                        {p.projectName ?? p.projectId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedProject && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-muted-foreground leading-relaxed"
                >
                  {selectedProject.refinedProblemStatement}
                </motion.p>
              )}
            </CardContent>
          </Card>

          {/* Step 2 – Report status */}
          <AnimatePresence mode="wait">

            {/* No project selected */}
            {!selectedProjectId && !projectsLoading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-dashed">
                  <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Select a project above to get started.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Project selected, no report yet */}
            {selectedProjectId && loadState === "idle" && (
              <motion.div key="no-report"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              >
                <Card className="border-dashed">
                  <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Button onClick={handleGenerate} className="gap-2">
                      <Sparkles className="h-4 w-4" /> Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Generating */}
            {loadState === "generating" && (
              <motion.div key="loading"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card>
                  <CardContent className="py-16 flex flex-col items-center text-center gap-5">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div>
                      <p className="font-medium">Generating report…</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Combining insights from AI personas and user conversations into a structured report.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error */}
            {loadState === "error" && (
              <motion.div key="error"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              >
                <Card className="border-destructive/50">
                  <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                    <p className="font-medium text-destructive">Failed to generate report</p>
                    <p className="text-sm text-muted-foreground max-w-sm">{errorMsg}</p>
                    <Button variant="outline" onClick={handleGenerate} className="gap-2 mt-2">
                      <Sparkles className="h-4 w-4" /> Retry
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Report ready */}
            {loadState === "done" && report && (
              <motion.div key="report"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* Report header */}
                <Card>
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{report.title}</p>
                        <p className="text-xs text-muted-foreground">Generated on {report.generatedDate}</p>
                      </div>
                    </div>
                    {reportUrl && (
                      <Button asChild size="sm" className="gap-2 shrink-0">
                        <a href={reportUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" /> Download PDF
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Report body */}
                <Card>
                  <CardContent className="p-6 space-y-8">

                    {/* Problem Statement */}
                    <section>
                      <Badge variant="secondary" className="mb-2">Problem Statement</Badge>
                      <h2 className="text-lg font-semibold mb-1">{selectedProject?.projectName}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedProject?.refinedProblemStatement}
                      </p>
                    </section>

                    <Separator />

                    {/* 1. Study Overview */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> 1. Study Overview
                      </h3>
                      <p className="text-sm leading-relaxed">{report.studyOverview}</p>
                    </section>

                    <Separator />

                    {/* 2. Sample & Methodology */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> 2. Sample & Methodology
                      </h3>
                      <p className="text-sm leading-relaxed">{report.sampleAndMethodology}</p>
                    </section>

                    <Separator />

                    {/* 3. Key Quantitative Signals */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4" /> 3. Key Quantitative Signals
                      </h3>
                      <NumberedList items={report.keyQuantitativeSignals ?? []} />
                    </section>

                    <Separator />

                    {/* 4. Key Qualitative Insights */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4" /> 4. Key Qualitative Insights
                      </h3>
                      <BulletList items={report.keyQualitativeInsights ?? []} />
                    </section>

                    <Separator />

                    {/* 5. Personas & Use Contexts */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> 5. Personas & Use Contexts
                      </h3>
                      <ul className="space-y-3">
                        {(report.personasAndUseContexts ?? []).map((persona, i) => (
                          <li key={i} className="text-sm border-l-2 border-primary/30 pl-3 leading-relaxed">
                            <span className="font-medium text-primary">Persona {i + 1}: </span>
                            {persona}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <Separator />

                    {/* 6. Opportunities, Risks & Recommendations */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> 6. Opportunities, Risks & Recommendations
                      </h3>

                      {/* Opportunities */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" /> Opportunities
                        </p>
                        <BulletList items={report.opportunities ?? []} className="border-l-2 border-green-300 bg-green-50/50 dark:bg-green-950/20" />
                      </div>

                      {/* Risks */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Risks / Watchouts
                        </p>
                        <BulletList items={report.risksAndWatchouts ?? []} className="border-l-2 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" />
                      </div>

                      {/* Recommended Actions */}
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5" /> Recommended Actions (0–3 months)
                        </p>
                        <NumberedList items={report.recommendedActions ?? []} accent />
                      </div>
                    </section>

                  </CardContent>
                </Card>

                {/* View PDF */}
                {reportUrl && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
                      <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> View PDF in browser
                      </a>
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportsPage;
