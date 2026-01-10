"use client";

import { useEffect, useRef, useState } from "react";
import Layout from "@/components/InterviewRoom/Layout";
import { WSClient } from "@/lib/ws";
import { STTClient } from "@/lib/stt";
import {
  Question,
  InterviewerMessage,
  TranscriptEntry,
  RunResultPayload,
  WSMessage,
  TranscriptPayload,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InterviewPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState("");
  const [interviewerMessages, setInterviewerMessages] = useState<InterviewerMessage[]>([]);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [currentPartial, setCurrentPartial] = useState("");
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sttAvailable, setSTTAvailable] = useState(true);
  const [manualInput, setManualInput] = useState("");

  const wsRef = useRef<WSClient | null>(null);
  const sttRef = useRef<STTClient | null>(null);

  // Replace these with actual sessionId & token if needed
  const sessionId = "demo-session";
  const token = "demo-token";

  useEffect(() => {
    // Load question
    fetch(`${API_URL}/questions/pick?company_mode=General&difficulty=Medium`)
      .then((r) => r.json())
      .then((data) => {
        setQuestion(data.question);
        setCode(data.question.starter_code || "function solution() {\n\n}");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load question");
        setLoading(false);
      });

    // WebSocket
    const ws = new WSClient(sessionId, token);
    wsRef.current = ws;

    ws.onMessage((msg: WSMessage) => {
      // Access text inside payload
      if (msg.type === "ai" && (msg.payload as TranscriptPayload).text) {
        const text = (msg.payload as TranscriptPayload).text;
        setInterviewerMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), text, timestamp: Date.now() },
        ]);
      }
    });

    ws.connect()
      .then(() => ws.startInterview())
      .catch(() => setError("Could not connect to interview server"));

    // Speech-to-text
    const stt = new STTClient((text, isFinal) => {
      if (isFinal) {
        setTranscriptEntries((prev) => [
          ...prev,
          { text, timestamp: Date.now(), is_final: true },
        ]);
        setCurrentPartial("");
        ws.sendTranscript(text);
      } else {
        setCurrentPartial(text);
      }
    });

    sttRef.current = stt;

    if (stt.isAvailable()) stt.start();
    else setSTTAvailable(false);

    return () => {
      ws.close();
      stt.stop();
    };
  }, []);

  const handleCodeChange = (newCode: string) => setCode(newCode);
  const handleRunResult = (_: RunResultPayload) => {};

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const text = manualInput.trim();
    setManualInput("");
    setTranscriptEntries((prev) => [...prev, { text, timestamp: Date.now(), is_final: true }]);
    wsRef.current?.sendTranscript(text);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading interview…</div>;
  if (error || !question) return <div className="h-screen flex items-center justify-center text-red-500">{error || "No question loaded"}</div>;

  const sttFallback = !sttAvailable && (
    <form onSubmit={handleManualSubmit} className="flex gap-2">
      <input
        type="text"
        value={manualInput}
        onChange={(e) => setManualInput(e.target.value)}
        className="flex-1 px-3 py-2 border rounded"
        placeholder="Type your thoughts…"
      />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
    </form>
  );

  return (
    <Layout
      question={question}
      interviewerMessages={interviewerMessages}
      transcriptEntries={transcriptEntries}
      currentPartial={currentPartial}
      code={code}
      startTime={startTime}
      onCodeChange={handleCodeChange}
      onRunResult={handleRunResult}
      sttFallback={sttFallback}
    />
  );
}
