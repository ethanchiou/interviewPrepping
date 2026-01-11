"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/InterviewRoom/Layout";
import { WSClient } from "@/lib/ws";
import { STTClient } from "@/lib/stt";
import {
    Question,
    InterviewerMessage,
    CoachNudge,
    TranscriptEntry,
    RunResultPayload,
    WSMessage,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function InterviewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const token = searchParams.get("token");

    const [question, setQuestion] = useState<Question | null>(null);
    const [code, setCode] = useState("");
    const [interviewerMessages, setInterviewerMessages] = useState<InterviewerMessage[]>([]);
    const [coachNudges, setCoachNudges] = useState<CoachNudge[]>([]);
    const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
    const [currentPartial, setCurrentPartial] = useState("");
    const [startTime] = useState(Date.now());
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [sttAvailable, setSTTAvailable] = useState(true);
    const [manualInput, setManualInput] = useState("");
    const [speechAnalysis, setSpeechAnalysis] = useState<any>(null);

    const wsRef = useRef<WSClient | null>(null);
    const sttRef = useRef<STTClient | null>(null);
    const currentMessageRef = useRef<{ id: string; text: string } | null>(null);

    useEffect(() => {
        if (!sessionId || !token) {
            setError("Missing session_id or token");
            return;
        }

        const initSession = async () => {
            try {
                const res = await fetch(`${API_URL}/questions/pick?company_mode=General&difficulty=Medium`);
                const data = await res.json();
                setQuestion(data.question);
                setCode(data.question.starter_code || "function solution() {\n  \n}");
                setLoading(false);
            } catch (err) {
                setError("Failed to load question");
                setLoading(false);
            }
        };
        initSession();

        // WebSocket
        const ws = new WSClient(sessionId, token);
        wsRef.current = ws;
        ws.onMessage(handleWSMessage);
        ws.connect()
            .then(() => {
                ws.send("CLIENT_READY", { client_version: "0.1", ui_lang: "en" });
            })
            .catch((err) => {
                console.error("WebSocket connection failed:", err);
                setTimeout(() => {
                    if (!wsRef.current?.isConnected()) {
                        setError("Could not connect to interview server. Please refresh.");
                    }
                }, 5000);
            });

        // STT - FIXED VERSION
        const stt = new STTClient((text, isFinal) => {
            console.log("STT Callback:", { text, isFinal, length: text.length });

            if (isFinal) {
                // Final transcript - add to entries
                const trimmedText = text.trim();
                
                if (trimmedText) {
                    console.log("Adding final transcript:", trimmedText);
                    setCurrentPartial(""); // Clear partial
                    setTranscriptEntries((prev) => [
                        ...prev,
                        { text: trimmedText, timestamp: Date.now(), is_final: true },
                    ]);
                    ws.send("TRANSCRIPT_FINAL", { text: trimmedText, is_final: true });
                }
            } else {
                // Interim transcript - show as partial
                console.log("Setting partial transcript:", text);
                setCurrentPartial(text);
                ws.send("TRANSCRIPT_PARTIAL", { text, is_final: false });
            }
        });

        sttRef.current = stt;

        if (stt.isAvailable()) {
            console.log("🎤 STT is available, starting...");
            stt.start();
        } else {
            console.log("❌ STT not available");
            setSTTAvailable(false);
        }

        return () => {
            ws.close();
            stt.stop();
        };
    }, [sessionId, token]);

    const handleWSMessage = (message: WSMessage) => {
        const { type, payload } = message;

        switch (type) {
            case "INTERVIEWER_STREAM_START":
                currentMessageRef.current = { id: payload.message_id, text: "" };
                break;
            case "INTERVIEWER_STREAM_DELTA":
                if (currentMessageRef.current && currentMessageRef.current.id === payload.message_id) {
                    currentMessageRef.current.text += payload.delta;
                    setInterviewerMessages((prev) => {
                        const existing = prev.find((m) => m.id === payload.message_id);
                        if (existing) {
                            return prev.map((m) =>
                                m.id === payload.message_id
                                    ? { ...m, text: currentMessageRef.current!.text }
                                    : m
                            );
                        } else {
                            return [
                                ...prev,
                                { id: payload.message_id, text: currentMessageRef.current!.text, timestamp: Date.now() },
                            ];
                        }
                    });
                }
                break;
            case "INTERVIEWER_STREAM_END":
                currentMessageRef.current = null;
                break;
            case "COACH_NUDGE":
                setCoachNudges((prev) => [...prev, { id: payload.id, severity: payload.severity, text: payload.text, timestamp: Date.now() }]);
                break;
            case "SPEECH_ANALYSIS":
                console.log("Received speech analysis:", payload);
                setSpeechAnalysis(payload);
                break;
            case "ERROR":
                console.error("Server error:", payload.message);
                break;
        }
    };

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        wsRef.current?.send("CODE_SNAPSHOT", { language: "javascript", code: newCode, cursor: { line: 0, col: 0 } });
    };

    const handleRunResult = (result: RunResultPayload) => {
        wsRef.current?.send("RUN_RESULT", result);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualInput.trim()) return;

        const text = manualInput.trim();
        setManualInput("");
        setTranscriptEntries((prev) => [...prev, { text, timestamp: Date.now(), is_final: true }]);
        wsRef.current?.send("TRANSCRIPT_FINAL", { text, is_final: true });
    };

    const handleRequestSpeechAnalysis = () => {
        if (!wsRef.current || transcriptEntries.length === 0) {
            console.log("Cannot analyze: no transcripts or no connection");
            return;
        }

        const recentTranscripts = transcriptEntries.slice(-5).map(e => e.text).join(" ");
        console.log("Requesting speech analysis for:", recentTranscripts);
        wsRef.current.send("REQUEST_SPEECH_ANALYSIS", { transcript: recentTranscripts, context: question?.title || "" });
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-xl text-gray-600 dark:text-gray-400">Loading interview...</div>;
    if (error) return <div className="h-screen flex items-center justify-center text-xl text-red-600 dark:text-red-400">{error}</div>;
    if (!question) return <div className="h-screen flex items-center justify-center text-xl text-gray-600 dark:text-gray-400">No question loaded</div>;

    const sttFallback = !sttAvailable ? (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Speech recognition not available. Type your thoughts here..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Send</button>
        </form>
    ) : undefined;

    return (
        <Layout
            question={question}
            interviewerMessages={interviewerMessages}
            coachNudges={coachNudges}
            transcriptEntries={transcriptEntries}
            currentPartial={currentPartial}
            code={code}
            startTime={startTime}
            onCodeChange={handleCodeChange}
            onRunResult={handleRunResult}
            sttFallback={sttFallback}
            onRequestSpeechAnalysis={handleRequestSpeechAnalysis}
            speechAnalysis={speechAnalysis}
        />
    );
}