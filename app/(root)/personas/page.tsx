"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  projects,
  personas,
  questions,
  type Persona,
} from "@/data/mockPersonData";

export default function PersonasPage() {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectQuestions = useMemo(
    () => questions.filter((q) => q.projectId === selectedProjectId),
    [selectedProjectId],
  );

  const projectPersonas = useMemo(
    () => personas.filter((p) => p.projectId === selectedProjectId),
    [selectedProjectId],
  );

  const togglePersona = (persona: Persona) => {
    const exists = selectedPersonas.find((p) => p.id === persona.id);

    if (exists) {
      setSelectedPersonas((prev) => prev.filter((p) => p.id !== persona.id));

      return;
    }

    if (selectedPersonas.length === 2) return;

    setSelectedPersonas((prev) => [...prev, persona]);
  };
  const startInterview = () => {
    const payload = {
      projectId: selectedProjectId,

      questions: projectQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
      })),

      personaIds: selectedPersonas.map((p) => p.id),
    };

    console.log("Interview Payload:", payload);

    /*
      CALL API HERE

      fetch("/api/interview",{
        method:"POST",
        body:JSON.stringify(payload)
      })
    */
  };

  const canStart = selectedProjectId && selectedPersonas.length === 2;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">

      <div className="px-6 py-4 border-b">
        <h1 className="text-lg font-semibold">AI Persona Interview</h1>

        <p className="text-sm text-muted-foreground">
          Select project, review questions and choose two personas
        </p>
      </div>

      <div className="flex flex-col flex-1 p-6 space-y-6">

        <Select
          value={selectedProjectId}
          onValueChange={(v) => {
            setSelectedProjectId(v);

            setSelectedPersonas([]);
          }}
        >
          <SelectTrigger className="w-87.5">
            <SelectValue placeholder="Choose Problem" />
          </SelectTrigger>

          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Main Layout */}

        {selectedProject && (
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* LEFT SIDE — QUESTIONS */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border rounded-xl p-5 overflow-y-auto"
            >
              <h2 className="font-semibold mb-4">Questions</h2>

              <div className="space-y-3">
                {projectQuestions.map((q, i) => (
                  <Card key={q.id}>
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium mb-1">
                        {i + 1}. {q.title}
                      </p>

                      <p className="text-muted-foreground text-xs">
                        {q.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* RIGHT SIDE — PERSONAS */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border rounded-xl p-5 overflow-y-auto"
            >
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Select Two Personas</h2>

                <Badge>{selectedPersonas.length}/2</Badge>
              </div>

              <div className="space-y-4">
                {projectPersonas.map((persona, i) => {
                  const selected = selectedPersonas.find(
                    (p) => p.id === persona.id,
                  );

                  return (
                    <motion.div
                      key={persona.id}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: i * 0.07,
                      }}
                    >
                      <Card
                        onClick={() => togglePersona(persona)}
                        className={`cursor-pointer transition
                          ${
                            selected
                              ? "border-primary shadow-md"
                              : "hover:shadow-lg"
                          }
                          `}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={persona.image} />

                            <AvatarFallback>
                              {persona.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {persona.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {persona.role}
                            </p>
                          </div>

                          {selected && <Badge>Selected</Badge>}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Start Button */}

        <Button
          onClick={startInterview}
          disabled={!canStart}
          className="h-12 text-lg"
        >
          Start Interview
        </Button>
      </div>
    </div>
  );
}
