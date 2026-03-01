"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Lock, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { projects, questions as allQuestions } from "@/data/mockPersonData";
import voiceAgentAvatar from "@/assets/voice-agent-avatar.png";
import Image from "next/image";
type Step = "agent" | "details" | "problem" | "interview";

interface Message {
  role: "ai" | "user";
  text: string;
}

interface UserDetails {
  name: string;
  age: string;
  location: string;
}

// Simulated user answers for demo
const mockUserAnswers = [
  "I think it means being in control of where my money goes every month.",
  "I mostly use a spreadsheet, but I forget to update it after a week.",
  "The most frustrating part is when small purchases add up and I don't realize until the end of the month.",
  "Maybe twice a week, usually when I'm anxious about a big expense.",
  "Honestly, transparency about how my data is used and simple UI would make me trust it.",
];

const InterviewsPage = () => {
  const [step, setStep] = useState<Step>("agent");
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    age: "",
    location: "",
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const projectQuestions = allQuestions.filter(
    (q) => q.projectId === selectedProjectId,
  );
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Start interview — ask first question
  const startInterview = useCallback(() => {
    if (projectQuestions.length > 0) {
      setIsSpeaking(true);
      setTimeout(() => {
        setMessages([{ role: "ai", text: projectQuestions[0].title }]);
        setIsSpeaking(false);
        setCurrentQuestionIndex(0);
      }, 1200);
    }
  }, [projectQuestions]);

  useEffect(() => {
    if (step === "interview" && messages.length === 0) {
      const timer = setTimeout(() => {
        startInterview();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step, messages.length, startInterview]);

  // Simulate user responding via mic
  const handleMicClick = () => {
    if (isListening || interviewComplete) return;
    setIsListening(true);

    // Simulate STT delay
    setTimeout(() => {
      const answer =
        mockUserAnswers[currentQuestionIndex] ||
        "That's a great question, let me think...";
      setMessages((prev) => [...prev, { role: "user", text: answer }]);
      setIsListening(false);

      // Ask next question or end
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < projectQuestions.length) {
        setIsSpeaking(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: projectQuestions[nextIndex].title },
          ]);
          setCurrentQuestionIndex(nextIndex);
          setIsSpeaking(false);
        }, 1500);
      } else {
        setIsSpeaking(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: "Thank you so much for your time and honest feedback! This has been incredibly valuable. The interview is now complete.",
            },
          ]);
          setIsSpeaking(false);
          setInterviewComplete(true);
        }, 1500);
      }
    }, 2000);
  };

  const canContinueDetails =
    userDetails.name.trim() &&
    userDetails.age.trim() &&
    userDetails.location.trim();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {/* Step 1: Agent Selection */}
        {step === "agent" && (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold">Choose Voice Agent</h2>
              <p className="text-sm text-muted-foreground">
                Select an agent to conduct the customer interview
              </p>
              <button
                onClick={() => setStep("details")}
                className="group mx-auto flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border hover:border-accent bg-card shadow-sm hover:shadow-glow transition-all"
              >
                <div className="relative">
                  <Image
                    src={voiceAgentAvatar}
                    alt="Voice Agent"
                    width={28}
                    height={28}
                    className="w-28 h-28 rounded-full object-cover border-4 border-accent/20 group-hover:border-accent/50 transition-colors"
                  />
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-success border-2 border-card" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Actual End Customer</p>
                  <p className="text-xs text-muted-foreground">
                    Voice Agent Interviewer
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: User Details */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Your Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us a bit about yourself before the interview
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    Name
                  </label>
                  <Input
                    placeholder="Your full name"
                    value={userDetails.name}
                    onChange={(e) =>
                      setUserDetails((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    Age
                  </label>
                  <Input
                    type="number"
                    placeholder="Your age"
                    value={userDetails.age}
                    onChange={(e) =>
                      setUserDetails((d) => ({ ...d, age: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    Location
                  </label>
                  <Input
                    placeholder="City, Country"
                    value={userDetails.location}
                    onChange={(e) =>
                      setUserDetails((d) => ({
                        ...d,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90"
                  disabled={!canContinueDetails}
                  onClick={() => setStep("problem")}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Problem Selection */}
        {step === "problem" && (
          <motion.div
            key="problem"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  Select Problem Statement
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the research problem for this interview
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6 space-y-4">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a problem statement" />
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md"
                  >
                    {selectedProject.problemStatement}
                  </motion.p>
                )}
                <Button
                  className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90"
                  disabled={!selectedProjectId}
                  onClick={() => setStep("interview")}
                >
                  Start Interview
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 & 5: Voice Agent Interview */}
        {step === "interview" && (
          <motion.div
            key="interview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex flex-col gap-4 min-h-0"
          >
            {/* Locked problem header */}
            <div className="flex items-center gap-2 bg-card rounded-lg border px-4 py-2.5 shrink-0">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium truncate">
                {selectedProject?.name}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                🔒 Locked
              </span>
            </div>

            {/* Avatar + Chat */}
            <div className="flex-1 flex flex-col items-center min-h-0">
              {/* Agent avatar */}
              <div className="relative mb-4 shrink-0">
                <div
                  className={`rounded-full p-1 transition-all duration-500 ${
                    isSpeaking
                      ? "ring-4 ring-accent/40 shadow-glow"
                      : isListening
                        ? "ring-4 ring-info/40"
                        : ""
                  }`}
                >
                  <Image
                    src={voiceAgentAvatar}
                    alt="AI Interviewer"
                    height={20}
                    width={20}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                </div>
                {isSpeaking && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 bg-accent rounded-full"
                        animate={{ height: [4, 12, 4] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
                {isListening && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <Mic className="h-4 w-4 text-info" />
                  </motion.div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 shrink-0">
                {isSpeaking
                  ? "Agent is speaking..."
                  : isListening
                    ? "Listening..."
                    : interviewComplete
                      ? "Interview complete"
                      : "Tap mic to respond"}
              </p>

              {/* Chat transcript */}
              <div
                ref={scrollRef}
                className="flex-1 w-full max-w-lg overflow-y-auto space-y-3 pr-1 min-h-0"
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "ai"
                          ? "bg-card border text-foreground rounded-bl-md"
                          : "bg-accent text-accent-foreground rounded-br-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Mic button */}
              {!interviewComplete && (
                <div className="mt-4 shrink-0">
                  <button
                    onClick={handleMicClick}
                    disabled={isListening || isSpeaking}
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? "bg-info text-info-foreground animate-pulse"
                        : isSpeaking
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-md hover:shadow-glow"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}

              {interviewComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center shrink-0"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    Interview with <strong>{userDetails.name}</strong> •{" "}
                    {userDetails.age}yo • {userDetails.location}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const transcript = {
                        user: userDetails,
                        problem: selectedProject?.name,
                        conversation: messages.map((m) => ({
                          role: m.role === "ai" ? "AI" : "User",
                          text: m.text,
                        })),
                      };
                      const blob = new Blob(
                        [JSON.stringify(transcript, null, 2)],
                        { type: "application/json" },
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "interview-transcript.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Transcript
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewsPage;
