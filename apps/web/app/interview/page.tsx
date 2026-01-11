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
    const sessionId = searchParams.get("session_id") || "demo-session";
    const token = searchParams.get("token") || "demo-token";
    const difficulty = searchParams.get("difficulty") || "Medium";
    const companyMode = searchParams.get("company_mode") || "General";

    const [question, setQuestion] = useState<Question | null>(null);
    const [code, setCode] = useState("");
    const [interviewerMessages, setInterviewerMessages] = useState<
        InterviewerMessage[]
    >([]);
    const [coachNudges, setCoachNudges] = useState<CoachNudge[]>([]);
    const [transcriptEntries, setTranscriptEntries] = useState<
        TranscriptEntry[]
    >([]);
    const [currentPartial, setCurrentPartial] = useState("");
    const [startTime] = useState(Date.now());
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [sttAvailable, setSTTAvailable] = useState(true);
    const [manualInput, setManualInput] = useState("");
    const [wsConnected, setWsConnected] = useState(false);

    const wsRef = useRef<WSClient | null>(null);
    const sttRef = useRef<STTClient | null>(null);
    const currentMessageRef = useRef<{
        id: string;
        text: string;
    } | null>(null);

    useEffect(() => {
        // Fetch question from backend
        const initSession = async () => {
            try {
                console.log("Fetching question...");
                const res = await fetch(
                    `${API_URL}/questions/pick?company_mode=${companyMode}&difficulty=${difficulty}`
                );
                
                if (!res.ok) {
                    throw new Error(`Failed to fetch question: ${res.status}`);
                }
                
                const data = await res.json();
                console.log("Question loaded:", data.question.title);
                
                setQuestion(data.question);
                setCode(data.question.starter_code || "function solution() {\n  \n}");
                setLoading(false);

                // Add a welcome message from the interviewer
                setInterviewerMessages([
                    {
                        id: "welcome",
                        text: `Welcome! Today we'll work on: ${data.question.title}. Take a moment to read the problem, and let me know when you're ready to start coding.`,
                        timestamp: Date.now(),
                    },
                ]);
            } catch (err: any) {
                console.error("Failed to load question:", err);
                setError(`Failed to load question: ${err.message}`);
                setLoading(false);
            }
        };

        initSession();

        // Initialize WebSocket (optional for demo mode)
        // Only try to connect if it looks like a real session
        const isDemoMode = sessionId.startsWith("demo-");
        
        if (!isDemoMode) {
            try {
                const ws = new WSClient(sessionId, token);
                wsRef.current = ws;

                ws.onMessage(handleWSMessage);

                ws.connect()
                    .then(() => {
                        console.log("WebSocket connected");
                        setWsConnected(true);
                        // Send CLIENT_READY
                        ws.send("CLIENT_READY", {
                            client_version: "0.1",
                            ui_lang: "en",
                        });
                    })
                    .catch((err) => {
                        console.warn("WebSocket connection failed:", err);
                        // Only show error for non-demo sessions after delay
                        setTimeout(() => {
                            if (!wsRef.current?.isConnected()) {
                                // Don't set error, just log it
                                console.log("Running in demo mode without WebSocket");
                            }
                        }, 5000);
                    });
            } catch (err) {
                console.warn("WebSocket initialization failed:", err);
                setWsConnected(false);
            }
        } else {
            console.log("Demo mode detected - skipping WebSocket connection");
        }

        // Initialize STT (optional)
        try {
            const stt = new STTClient((text, isFinal) => {
                if (isFinal) {
                    setCurrentPartial("");
                    setTranscriptEntries((prev) => [
                        ...prev,
                        { text, timestamp: Date.now(), is_final: true },
                    ]);
                    if (wsRef.current && wsConnected) {
                        wsRef.current.send("TRANSCRIPT_FINAL", { text, is_final: true });
                    }
                } else {
                    setCurrentPartial(text);
                    if (wsRef.current && wsConnected) {
                        wsRef.current.send("TRANSCRIPT_PARTIAL", { text, is_final: false });
                    }
                }
            });

            sttRef.current = stt;

            if (stt.isAvailable()) {
                stt.start();
            } else {
                setSTTAvailable(false);
            }
        } catch (err) {
            console.warn("STT initialization failed:", err);
            setSTTAvailable(false);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (sttRef.current) {
                sttRef.current.stop();
            }
        };
    }, [sessionId, token, difficulty, companyMode]);

    const handleWSMessage = (message: WSMessage) => {
        const { type, payload } = message;

        switch (type) {
            case "INTERVIEWER_STREAM_START":
                currentMessageRef.current = {
                    id: payload.message_id,
                    text: "",
                };
                break;

            case "INTERVIEWER_STREAM_DELTA":
                if (
                    currentMessageRef.current &&
                    currentMessageRef.current.id === payload.message_id
                ) {
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
                                {
                                    id: payload.message_id,
                                    text: currentMessageRef.current!.text,
                                    timestamp: Date.now(),
                                },
                            ];
                        }
                    });
                }
                break;

            case "INTERVIEWER_STREAM_END":
                currentMessageRef.current = null;
                break;

            case "COACH_NUDGE":
                setCoachNudges((prev) => [
                    ...prev,
                    {
                        id: payload.id,
                        severity: payload.severity,
                        text: payload.text,
                        timestamp: Date.now(),
                    },
                ]);
                break;

            case "ERROR":
                console.error("Server error:", payload.message);
                break;
        }
    };

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        if (wsRef.current && wsConnected) {
            wsRef.current.send("CODE_SNAPSHOT", {
                language: "javascript",
                code: newCode,
                cursor: { line: 0, col: 0 },
            });
        }
    };

    const handleRunResult = (result: RunResultPayload) => {
        if (wsRef.current && wsConnected) {
            wsRef.current.send("RUN_RESULT", result);
        }

        // Add coach feedback based on results in demo mode
        if (!wsConnected && result.passed) {
            setCoachNudges((prev) => [
                ...prev,
                {
                    id: `nudge-${Date.now()}`,
                    severity: "low",
                    text: "Great! All tests passed. Consider explaining your approach and analyzing the time/space complexity.",
                    timestamp: Date.now(),
                },
            ]);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualInput.trim()) return;

        const text = manualInput.trim();
        setManualInput("");
        setTranscriptEntries((prev) => [
            ...prev,
            { text, timestamp: Date.now(), is_final: true },
        ]);

        if (wsRef.current && wsConnected) {
            wsRef.current.send("TRANSCRIPT_FINAL", { text, is_final: true });
        }

        // Demo mode: Add mock interviewer response
        if (!wsConnected) {
            setTimeout(() => {
                setInterviewerMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-${Date.now()}`,
                        text: "That's a good observation. Keep working on your solution and run the tests when you're ready.",
                        timestamp: Date.now(),
                    },
                ]);
            }, 1000);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-xl text-gray-600 dark:text-gray-400">
                        Loading interview...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <div className="text-xl text-red-600 dark:text-red-400 mb-4">{error}</div>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-xl text-gray-600 dark:text-gray-400">
                    No question loaded
                </div>
            </div>
        );
    }

    const sttFallback = !sttAvailable ? (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type your thoughts here..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            />
            <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
            >
                Send
            </button>
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
        />
    );
}