"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Users,
  MessageSquareQuote,
  ListChecks,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/mockPersonData";
import {
  existingReports,
  generateMockReport,
  type Report,
} from "@/data/mockReportData";

const ReportsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<Report[]>([]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const currentReport =
    existingReports.find((r) => r.projectId === selectedProjectId) ??
    generatedReports.find((r) => r.projectId === selectedProjectId) ??
    null;

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const report = generateMockReport(selectedProjectId);
      setGeneratedReports((prev) => [...prev, report]);
      setGenerating(false);
    }, 3000);
  }, [selectedProjectId]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card">
        <h1 className="text-lg font-semibold">Reports & Presentations</h1>
        <p className="text-sm text-muted-foreground">
          Generate executive-ready insight reports from AI personas and real
          customer conversations.
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
              <Select
                value={selectedProjectId}
                onValueChange={(v) => {
                  setSelectedProjectId(v);
                  setGenerating(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project / problem statement…" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-muted-foreground leading-relaxed"
                >
                  {selectedProject.problemStatement}
                </motion.p>
              )}
            </CardContent>
          </Card>

          {/* Step 2 – Report status */}
          <AnimatePresence mode="wait">
            {selectedProjectId && !generating && !currentReport && (
              <motion.div
                key="no-report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <Card className="border-dashed">
                  <CardContent className="py-12 flex flex-col items-center text-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        No report available for this problem.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generate one from AI personas and user conversations.
                      </p>
                    </div>
                    <Button onClick={handleGenerate} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Loading state */}
            {generating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card>
                  <CardContent className="py-16 flex flex-col items-center text-center gap-5">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div>
                      <p className="font-medium">Generating report…</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Combining insights from AI personas and user
                        conversations into a structured report.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Report exists */}
            {selectedProjectId && !generating && currentReport && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* Report header */}
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {currentReport.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generated on {currentReport.generatedDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </CardContent>
                </Card>

                {/* Report body */}
                <Card>
                  <CardContent className="p-6 space-y-8">
                    {/* Problem Statement */}
                    <section>
                      <Badge variant="secondary" className="mb-2">
                        Problem Statement
                      </Badge>
                      <h2 className="text-lg font-semibold mb-1">
                        {selectedProject?.name}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedProject?.problemStatement}
                      </p>
                    </section>

                    <Separator />

                    {/* Summary */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Summary
                      </h3>
                      <p className="text-sm leading-relaxed">
                        {currentReport.summary}
                      </p>
                    </section>

                    <Separator />

                    {/* Key Insights */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Key Insights
                      </h3>
                      <ul className="space-y-2">
                        {currentReport.keyInsights.map((insight, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                              {i + 1}
                            </span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <Separator />

                    {/* Persona Observations */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Persona Observations
                      </h3>
                      <ul className="space-y-3">
                        {currentReport.personaObservations.map((obs, i) => (
                          <li
                            key={i}
                            className="text-sm bg-muted/50 rounded-lg p-3 leading-relaxed"
                          >
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <Separator />

                    {/* User Feedback */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4" /> User Feedback
                      </h3>
                      <ul className="space-y-2">
                        {currentReport.userFeedback.map((fb, i) => (
                          <li
                            key={i}
                            className="text-sm italic border-l-2 border-accent pl-3 text-muted-foreground"
                          >
                            {fb}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <Separator />

                    {/* Recommendations */}
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <ListChecks className="h-4 w-4" /> Final Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {currentReport.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="h-5 w-5 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                              {i + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportsPage;
