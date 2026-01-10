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

    const wsRef = useRef<WSClient | null>(null);
    const sttRef = useRef<STTClient | null>(null);
    const currentMessageRef = useRef<{
        id: string;
        text: string;
    } | null>(null);

    useEffect(() => {
        if (!sessionId || !token) {
            setError("Missing session_id or token");
            return;
        }

        // Fetch session/question data
        const initSession = async () => {
            try {
                // For MVP, we'll fetch the question from session metadata
                // In real app, backend would return question on session create
                const res = await fetch(
                    `${API_URL}/questions/pick?company_mode=General&difficulty=Medium`
                );
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

        // Initialize WebSocket
        const ws = new WSClient(sessionId, token);
        wsRef.current = ws;

        ws.onMessage(handleWSMessage);

        ws.connect()
            .then(() => {
                // Send CLIENT_READY
                ws.send("CLIENT_READY", {
                    client_version: "0.1",
                    ui_lang: "en",
                });
            })
            .catch((err) => {
                setError("WebSocket connection failed");
                console.error(err);
            });

        // Initialize STT
        const stt = new STTClient((text, isFinal) => {
            if (isFinal) {
                setCurrentPartial("");
                setTranscriptEntries((prev) => [
                    ...prev,
                    { text, timestamp: Date.now(), is_final: true },
                ]);
                ws.send("TRANSCRIPT_FINAL", { text, is_final: true });
            } else {
                setCurrentPartial(text);
                ws.send("TRANSCRIPT_PARTIAL", { text, is_final: false });
            }
        });

        sttRef.current = stt;

        if (stt.isAvailable()) {
            stt.start();
        } else {
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
        if (wsRef.current) {
            wsRef.current.send("CODE_SNAPSHOT", {
                language: "javascript",
                code: newCode,
                cursor: { line: 0, col: 0 },
            });
        }
    };

    const handleRunResult = (result: RunResultPayload) => {
        if (wsRef.current) {
            wsRef.current.send("RUN_RESULT", result);
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

        if (wsRef.current) {
            wsRef.current.send("TRANSCRIPT_FINAL", { text, is_final: true });
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600 dark:text-gray-400">
                    Loading interview...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="h-screen flex items-center justify-center">
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
                placeholder="Speech recognition not available. Type your thoughts here..."
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
