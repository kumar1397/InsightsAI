"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Target, AlertTriangle, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  projects,
  questions,
  personas,
  type Persona,
} from "@/data/mockPersonData";

const PersonasPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const projectQuestions = useMemo(
    () => questions.filter((q) => q.projectId === selectedProjectId),
    [selectedProjectId],
  );

  const projectPersonas = useMemo(
    () => personas.filter((p) => p.projectId === selectedProjectId),
    [selectedProjectId],
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 border-b bg-card">
        <h1 className="text-lg font-semibold">AI Persona Simulation</h1>
        <p className="text-sm text-muted-foreground">
          Explore hypotheses with AI-generated personas before engaging real
          customers.
        </p>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel – 40% */}
        <div className="w-2/5 border-r flex flex-col min-h-0 bg-card/50">
          <div className="p-4 border-b">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Project / Problem Statement
            </label>
            <Select
              value={selectedProjectId}
              onValueChange={(v) => {
                setSelectedProjectId(v);
                setSelectedPersona(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project…" />
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
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {!selectedProjectId && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a project to view questions.
                </p>
              )}
              <AnimatePresence mode="wait">
                {projectQuestions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {q.title}
                            </p>
                            {q.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {q.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel – 60% */}
        <div className="w-3/5 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-6">
              {!selectedProjectId && (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  Select a project to view personas.
                </div>
              )}

              <AnimatePresence mode="wait">
                {selectedProjectId && !selectedPersona && (
                  <motion.div
                    key="persona-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Personas ({projectPersonas.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectPersonas.map((persona, i) => (
                        <motion.div
                          key={persona.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg hover:border-accent/40 transition-all group"
                            onClick={() => setSelectedPersona(persona)}
                          >
                            <CardContent className="p-5 flex items-center gap-4">
                              <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-accent/40 transition-all">
                                <AvatarImage
                                  src={persona.image}
                                  alt={persona.name}
                                />
                                <AvatarFallback>
                                  {persona.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {persona.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {persona.role}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedPersona && (
                  <motion.div
                    key="persona-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-4 -ml-2 text-muted-foreground"
                      onClick={() => setSelectedPersona(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Personas
                    </Button>

                    <div className="flex items-center gap-5 mb-6">
                      <Avatar className="h-20 w-20 ring-2 ring-border">
                        <AvatarImage
                          src={selectedPersona.image}
                          alt={selectedPersona.name}
                        />
                        <AvatarFallback>
                          {selectedPersona.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedPersona.name}
                        </h2>
                        <Badge variant="secondary" className="mt-1">
                          {selectedPersona.role}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="mb-6" />

                    <div className="space-y-6">
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Background
                        </h3>
                        <p className="text-sm leading-relaxed">
                          {selectedPersona.background}
                        </p>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" /> Goals
                        </h3>
                        <ul className="space-y-2">
                          {selectedPersona.goals.map((goal, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="h-5 w-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                {i + 1}
                              </span>
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Pain Points
                        </h3>
                        <ul className="space-y-2">
                          {selectedPersona.painPoints.map((point, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="h-5 w-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                !
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default PersonasPage;
