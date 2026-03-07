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
import voiceAgentAvatar from "@/public/voice-agent-avatar.png";
import Image from "next/image";
import { api } from "@/lib/api";

type Step = "details" | "problem" | "interview";

interface Project {
  projectId: string;
  projectName?: string;
  industry?: string;
  targetConsumer?: string;
  refinedProblemStatement?: string;
  questions?: string[];
  createdAt?: string;
}

interface Message {
  role: "ai" | "user";
  text: string;
}

interface UserDetails {
  name: string;
  age: string;
  location: string;
  gender: string;
  income: number;
  education: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://3.109.182.79:8080";

const InterviewsPage = () => {
  const [step, setStep] = useState<Step>("details");
  const [projects, setProjects] = useState<Project[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "",
    age: "",
    location: "",
    gender: "",
    income: 0,
    education: "",
  });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Connecting...");

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ─── Fetch Projects ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await api.getProjects();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // ─── Auto Scroll ──────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const selectedProject = projects.find(
    (p) => p.projectId === selectedProjectId,
  );

  // ─── Play Polly Audio (base64 MP3) ────────────────────────────────
  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(
        bytes.buffer,
      );
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        setIsSpeaking(false);
        setStatusText("Tap mic to respond");
      };

      source.start();
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsSpeaking(false);
      setStatusText("Tap mic to respond");
    }
  }, []);

  // ─── Handle WebSocket Messages ────────────────────────────────────
  const handleWSMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          // Interview started — backend confirms
          case "interview_started":
            setStatusText("Starting interview...");
            break;

          // Backend sends next question + Polly audio
          case "question":
            setMessages((prev) => [
              ...prev,
              { role: "ai", text: msg.question },
            ]);
            setIsSpeaking(true);
            setStatusText("Agent is speaking...");
            playAudio(msg.audio);
            break;

          // Backend is transcribing the answer
          case "transcribing":
            setStatusText("Processing your answer...");
            break;

          // Backend confirms answer was recorded
          case "answer_recorded":
            setMessages((prev) => [
              ...prev,
              { role: "user", text: msg.answer },
            ]);
            break;

          // All questions done
          case "interview_complete":
            setMessages((prev) => [
              ...prev,
              {
                role: "ai",
                text: "Thank you so much for your time and honest feedback! This has been incredibly valuable. The interview is now complete.",
              },
            ]);
            setInterviewComplete(true);
            setStatusText("Interview complete");
            break;

          // Any backend error
          case "error":
            console.error("Backend error:", msg.message);
            setStatusText("An error occurred. Please try again.");
            break;
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    },
    [playAudio],
  );

  // ─── Start Interview → Connect WebSocket ─────────────────────────
  const handleStartInterview = useCallback(async () => {
    setStep("interview");
    setStatusText("Connecting...");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusText("Connected! Starting interview...");
      ws.send(
        JSON.stringify({
          type: "start_interview",
          projectId: selectedProjectId,
          personDetails: userDetails,
        }),
      );
    };

    ws.onmessage = handleWSMessage;

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStatusText("Connection error. Please refresh.");
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };
  }, [selectedProjectId, userDetails, handleWSMessage]);

  const handleMicClick = useCallback(async () => {
    if (isListening || isSpeaking || interviewComplete) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      wsRef.current?.send(JSON.stringify({ type: "start_recording" }));
      setIsListening(true);
      setStatusText("Listening...");

      // ✅ Use webm format which is supported by all browsers
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      };

      mediaRecorder.start(250);
    } catch (err) {
      console.error("Mic access error:", err);
      setStatusText("Microphone access denied.");
    }
  }, [isListening, isSpeaking, interviewComplete]);

  // ─── Mic Button — Stop Recording ─────────────────────────────────
  const handleMicRelease = useCallback(() => {
    if (!isListening) return;

    // Stop media recorder
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop());

    // Tell backend recording stopped
    wsRef.current?.send(JSON.stringify({ type: "stop_recording" }));
    setIsListening(false);
    setStatusText("Processing your answer...");
  }, [isListening]);

  // ─── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  const canContinueDetails =
    userDetails.name.trim() &&
    userDetails.age.trim() &&
    userDetails.location.trim();

  // ─── UI ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {/* Step 1: User Details */}
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
                {(["name", "gender", "location", "education"] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="text-xs font-medium mb-1.5 block capitalize">
                        {field}
                      </label>
                      <Input
                        placeholder={`Your ${field}`}
                        value={userDetails[field]}
                        onChange={(e) =>
                          setUserDetails((d) => ({
                            ...d,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ),
                )}
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
                    Income
                  </label>
                  <Input
                    type="number"
                    placeholder="Your income"
                    value={userDetails.income || ""}
                    onChange={(e) =>
                      setUserDetails((d) => ({
                        ...d,
                        income: Number(e.target.value),
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

        {/* Step 2: Problem Selection */}
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
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Loading projects...
                  </p>
                ) : (
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select a problem statement" />
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
                {selectedProject && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md"
                  >
                    {selectedProject.refinedProblemStatement}
                  </motion.p>
                )}
                <Button
                  className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90"
                  disabled={!selectedProjectId}
                  onClick={handleStartInterview}
                >
                  Start Interview
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Voice Interview */}
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
                {selectedProject?.projectName}
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

              {/* Status text */}
              <p className="text-xs text-muted-foreground mb-3 shrink-0">
                {statusText}
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

              {/* Mic button — hold to speak */}
              {!interviewComplete && (
                <div className="mt-4 shrink-0 flex flex-col items-center gap-2">
                  <button
                    onMouseDown={handleMicClick}
                    onMouseUp={handleMicRelease}
                    onTouchStart={handleMicClick}
                    onTouchEnd={handleMicRelease}
                    disabled={isSpeaking}
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
                  <p className="text-[10px] text-muted-foreground">
                    {isListening ? "Release to submit answer" : "Hold to speak"}
                  </p>
                </div>
              )}

              {/* Interview complete */}
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
                        problem: selectedProject?.projectName,
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
