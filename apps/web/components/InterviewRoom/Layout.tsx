"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import InterviewerPanel from "./InterviewerPanel";
import WebcamPanel from "./WebcamPanel";
import EditorPanel from "./EditorPanel";
import TranscriptPanel from "./TranscriptPanel";
import {
    InterviewerMessage,
    CoachNudge,
    TranscriptEntry,
    Question,
    RunResultPayload,
} from "@/lib/types";

interface MediaPipeMetrics {
    eyeContact: boolean;
    leftEyeOpen: boolean;
    rightEyeOpen: boolean;
    headTiltAngle: number;
    faceDetected: boolean;
}

interface LayoutProps {
    question: Question;
    interviewerMessages: InterviewerMessage[];
    coachNudges: CoachNudge[];
    transcriptEntries: TranscriptEntry[];
    currentPartial: string;
    code: string;
    startTime: number;
    onCodeChange: (code: string) => void;
    onRunResult: (result: RunResultPayload) => void;
    sttFallback?: ReactNode;
    onRequestSpeechAnalysis?: () => void;
    speechAnalysis?: any;
    isSTTRunning?: boolean; // NEW
    onToggleSTT?: () => void; // NEW
    realtimeTip?: string; // NEW
}

export default function Layout({
    question,
    interviewerMessages,
    coachNudges,
    transcriptEntries,
    currentPartial,
    code,
    startTime,
    onCodeChange,
    onRunResult,
    sttFallback,
    onRequestSpeechAnalysis,
    speechAnalysis,
    isSTTRunning,
    onToggleSTT,
    realtimeTip,
}: LayoutProps) {
    const divStyle = { borderRadius: "30px", overflow: "hidden", margin: "3px" };
    const [mediapipeMetrics, setMediapipeMetrics] = useState<MediaPipeMetrics | null>(null);

    // Resize state
    const [leftWidth, setLeftWidth] = useState(40); // percentage
    const [webcamHeight, setWebcamHeight] = useState(50); // percentage
    const [editorHeight, setEditorHeight] = useState(66); // percentage

    // Refs for resize handles
    const leftResizeRef = useRef<HTMLDivElement>(null);
    const webcamResizeRef = useRef<HTMLDivElement>(null);
    const editorResizeRef = useRef<HTMLDivElement>(null);

    // Resize handlers
    useEffect(() => {
        const handleLeftResize = (e: MouseEvent) => {
            const container = leftResizeRef.current?.parentElement?.parentElement;
            if (!container) return;
            const containerWidth = container.offsetWidth;
            const newLeftWidth = (e.clientX / containerWidth) * 100;
            if (newLeftWidth >= 20 && newLeftWidth <= 60) {
                setLeftWidth(newLeftWidth);
            }
        };

        const handleWebcamResize = (e: MouseEvent) => {
            const container = webcamResizeRef.current?.parentElement;
            if (!container) return;
            const containerHeight = container.offsetHeight;
            const newWebcamHeight = ((e.clientY - container.getBoundingClientRect().top) / containerHeight) * 100;
            if (newWebcamHeight >= 20 && newWebcamHeight <= 80) {
                setWebcamHeight(newWebcamHeight);
            }
        };

        const handleEditorResize = (e: MouseEvent) => {
            const container = editorResizeRef.current?.parentElement;
            if (!container) return;
            const containerHeight = container.offsetHeight;
            const newEditorHeight = ((e.clientY - container.getBoundingClientRect().top) / containerHeight) * 100;
            if (newEditorHeight >= 30 && newEditorHeight <= 80) {
                setEditorHeight(newEditorHeight);
            }
        };

        const startLeftResize = (e: MouseEvent) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleLeftResize);
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', handleLeftResize);
            }, { once: true });
        };

        const startWebcamResize = (e: MouseEvent) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleWebcamResize);
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', handleWebcamResize);
            }, { once: true });
        };

        const startEditorResize = (e: MouseEvent) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleEditorResize);
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', handleEditorResize);
            }, { once: true });
        };

        const leftHandle = leftResizeRef.current;
        const webcamHandle = webcamResizeRef.current;
        const editorHandle = editorResizeRef.current;

        if (leftHandle) {
            leftHandle.addEventListener('mousedown', startLeftResize);
        }
        if (webcamHandle) {
            webcamHandle.addEventListener('mousedown', startWebcamResize);
        }
        if (editorHandle) {
            editorHandle.addEventListener('mousedown', startEditorResize);
        }

        return () => {
            if (leftHandle) leftHandle.removeEventListener('mousedown', startLeftResize);
            if (webcamHandle) webcamHandle.removeEventListener('mousedown', startWebcamResize);
            if (editorHandle) editorHandle.removeEventListener('mousedown', startEditorResize);
        };
    }, []);

    return (
        <div className="h-screen flex flex-col" style={divStyle}>
            <div className="flex-1 flex overflow-hidden p-2" style={divStyle}>
                {/* Left Column */}
                <div
                    className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700 relative"
                    style={{ ...divStyle, width: `${leftWidth}%` }}
                >
                    <div
                        className="min-h-0 border-t border-gray-200 dark:border-gray-700"
                        style={{ ...divStyle, height: `${webcamHeight}%` }}
                    >
                        <WebcamPanel onMetricsUpdate={setMediapipeMetrics} />
                    </div>

                    {/* Horizontal resize handle for webcam/interviewer */}
                    <div
                        ref={webcamResizeRef}
                        className="h-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-600 cursor-ns-resize transition-colors relative z-10"
                        style={{ flexShrink: 0 }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-0.5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                        </div>
                    </div>

                    <div
                        className="min-h-0"
                        style={{ ...divStyle, height: `${100 - webcamHeight}%` }}
                    >
                        <InterviewerPanel
                            messages={interviewerMessages}
                            startTime={startTime}
                            metrics={mediapipeMetrics}
                        />
                    </div>
                </div>

                {/* Vertical resize handle for left/right columns */}
                <div
                    ref={leftResizeRef}
                    className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-600 cursor-ew-resize transition-colors relative z-10 flex-shrink-0"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-0.5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                    </div>
                </div>

                {/* Right Column */}
                <div
                    className="h-full flex flex-col"
                    style={{ ...divStyle, width: `${100 - leftWidth}%` }}
                >
                    <div
                        className="min-h-0"
                        style={{ ...divStyle, height: `${editorHeight}%` }}
                    >
                        <EditorPanel
                            question={question}
                            code={code}
                            onCodeChange={onCodeChange}
                            onRunResult={onRunResult}
                        />
                    </div>

                    {/* Horizontal resize handle for editor/transcript */}
                    <div
                        ref={editorResizeRef}
                        className="h-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-600 cursor-ns-resize transition-colors relative z-10"
                        style={{ flexShrink: 0 }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-0.5 bg-gray-400 dark:bg-gray-500 rounded"></div>
                        </div>
                    </div>

                    <div
                        className="min-h-0 border-t border-gray-200 dark:border-gray-700"
                        style={{ ...divStyle, height: `${100 - editorHeight}%` }}
                    >
                        {/* STT Controls */}
                        {onToggleSTT && (
                            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                                <button
                                    onClick={onToggleSTT}
                                    className={`px-3 py-1 rounded font-semibold ${isSTTRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                >
                                    {isSTTRunning ? "Stop STT" : "Start STT"}
                                </button>
                                {realtimeTip && <span className="text-sm text-orange-700 dark:text-orange-400">{realtimeTip}</span>}
                            </div>
                        )}

                        {/* Transcript Panel */}
                        <TranscriptPanel
                            entries={transcriptEntries}
                            currentPartial={currentPartial}
                            onRequestAnalysis={onRequestSpeechAnalysis}
                            speechAnalysis={speechAnalysis}
                        />
                    </div>
                </div>
            </div>

            {/* STT fallback */}
            {sttFallback && (
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 border-t border-yellow-300 dark:border-yellow-700" style={divStyle}>
                    {sttFallback}
                </div>
            )}
        </div>
    );
}
