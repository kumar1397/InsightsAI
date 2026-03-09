"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api } from "@/lib/api";

type Project = {
  projectId: string;
  projectName: string;
};

type Persona = {
  personaId: string;
  personaName: string;
  personaDescription: string;
  personaPrompt?: string;
};

type PersonaResult = {
  persona_id: string;
  persona_name: string;
  conversation_id: string;
  pdf_filename: string;
  download_url?: string;
  transcript: { turn: number; question: string; answer: string }[];
};

type InterviewResult = {
  project_id: string;
  project_name: string;
  message: string;
  results: PersonaResult[];
};

export default function PersonasPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [interviewResult, setInterviewResult] =
    useState<InterviewResult | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingProjects(true);
    api
      .getProjects()
      .then((data) => setProjects(data.projects ?? data))
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    setLoadingPersonas(true);
    api
      .getPersonas()
      .then((data) => setPersonas(data.personas ?? data))
      .catch(() => setError("Failed to load personas."))
      .finally(() => setLoadingPersonas(false));
  }, []);

  const togglePersona = (persona: Persona) => {
    const exists = selectedPersonas.find(
      (p) => p.personaId === persona.personaId,
    );
    if (exists) {
      setSelectedPersonas((prev) =>
        prev.filter((p) => p.personaId !== persona.personaId),
      );
      return;
    }
    if (selectedPersonas.length === 2) return;
    setSelectedPersonas((prev) => [...prev, persona]);
  };

  const startInterview = async () => {
    if (!canStart) return;
    setSubmitting(true);
    setError(null);
    setInterviewResult(null);
    const toastId = toast.loading("Running interviews...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_SING_AWS_URL}/run-interview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: selectedProjectId,
            persona_ids: selectedPersonas.map((p) => p.personaId),
          }),
        },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      setInterviewResult(data);
      toast.success("Interviews completed successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to start interview. Please try again.", {
        id: toastId,
      });
      setError("Failed to start interview. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetInterview = () => {
    setInterviewResult(null);
    setSelectedPersonas([]);
    setSelectedProjectId("");
  };

  const canStart = selectedProjectId && selectedPersonas.length === 2;

  if (interviewResult) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="px-6 py-4 border-b">
          <h1 className="text-lg font-semibold">AI Persona Interview</h1>
          <p className="text-sm text-muted-foreground">Interview completed</p>
        </div>

        <div className="flex flex-col flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Success Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3"
          >
            <span className="text-green-500 text-xl mt-0.5">✓</span>
            <div>
              <p className="font-semibold text-green-800">
                Interviews Completed Successfully
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                {interviewResult.project_name} ·{" "}
                {interviewResult.results.length} persona
                {interviewResult.results.length > 1 ? "s" : ""} interviewed
              </p>
            </div>
          </motion.div>

          {/* Results Cards */}
          <div className="grid grid-cols-2 gap-4">
            {interviewResult.results.map((result, i) => (
              <motion.div
                key={result.persona_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-5 space-y-3">
                    {/* Persona Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {result.persona_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {result.persona_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.persona_id}
                        </p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                        Done
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                      <p> {result.transcript.length} questions answered</p>
                      <p className="truncate">ID: {result.conversation_id}</p>
                    </div>

                    {/* Download */}
                    {result.download_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() =>
                          window.open(result.download_url!, "_blank")
                        }
                      >
                        Download Transcript (PDF)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Run Again */}
          <Button variant="outline" onClick={resetInterview} className="h-11">
            Run Another Interview
          </Button>
        </div>
      </div>
    );
  }
  if (loadingProjects || loadingPersonas) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="px-6 py-4 border-b">
          <h1 className="text-lg font-semibold">AI Persona Interview</h1>
          <p className="text-sm text-muted-foreground">
            Select a project and choose two personas to interview
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">AI Persona Interview</h1>
        <p className="text-sm text-muted-foreground">
          Select a project and choose two personas to interview
        </p>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-6 overflow-hidden">
        {error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {loadingProjects ? (
          <Skeleton className="h-10 w-87 rounded-md" />
        ) : (
          <Select
            value={selectedProjectId}
            onValueChange={(v) => {
              setSelectedProjectId(v);
              setSelectedPersonas([]);
            }}
          >
            <SelectTrigger className="w-87.5">
              <SelectValue placeholder="Choose a Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedProjectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-xl p-5 overflow-y-auto flex-1"
          >
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Select Two Personas</h2>
              <Badge>{selectedPersonas.length}/2</Badge>
            </div>

            {loadingPersonas ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : personas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No personas found.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {personas.map((persona, i) => {
                  const selected = selectedPersonas.find(
                    (p) => p.personaId === persona.personaId,
                  );
                  const disabled = !selected && selectedPersonas.length === 2;

                  return (
                    <motion.div
                      key={persona.personaId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <Card
                        onClick={() => !disabled && togglePersona(persona)}
                        className={`transition
                          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                          ${selected ? "border-primary shadow-md" : "hover:shadow-lg"}
                        `}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {persona.personaName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {persona.personaName}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {persona.personaDescription}
                            </p>
                          </div>
                          {selected && (
                            <Badge className="shrink-0">Selected</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        <Button
          onClick={startInterview}
          disabled={!canStart || submitting}
          className="h-12 text-lg"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Running Interview...
            </span>
          ) : (
            "Start Interview"
          )}
        </Button>
      </div>
    </div>
  );
}
