"use client";

import { ReactNode, useState } from "react";
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

    return (
        <div className="h-screen flex flex-col" style={divStyle}>
            <div className="flex-1 flex overflow-hidden p-2" style={divStyle}>
                {/* Left Column */}
                <div className="w-2/5 h-full flex flex-col border-r border-gray-200 dark:border-gray-700" style={divStyle}>
                    <div className="flex-1 min-h-0 border-t border-gray-200 dark:border-gray-700" style={divStyle}>
                        <WebcamPanel onMetricsUpdate={setMediapipeMetrics} />
                    </div>
                    <div className="flex-1 min-h-0" style={divStyle}>
                        <InterviewerPanel
                            messages={interviewerMessages}
                            startTime={startTime}
                            metrics={mediapipeMetrics}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-3/5 h-full flex flex-col" style={divStyle}>
                    <div className="flex-[2] min-h-0" style={divStyle}>
                        <EditorPanel
                            question={question}
                            code={code}
                            onCodeChange={onCodeChange}
                            onRunResult={onRunResult}
                        />
                    </div>

                    <div className="flex-[1] min-h-0 border-t border-gray-200 dark:border-gray-700" style={divStyle}>
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
