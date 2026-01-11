"use client";

import { ReactNode } from "react";
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
}: LayoutProps) {
    const divStyle = {
        borderRadius: "30px",
        overflow: "hidden",
        margin: "3px",
    };
    return (
        <div className="h-screen flex flex-col" style={divStyle}>
            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden p-2" style={divStyle}>
                {/* Left Column (50%) */}
                <div className="w-2/5 h-full flex flex-col border-r border-gray-200 dark:border-gray-700" style={divStyle}>
                    {/* Top-Left: Interviewer (50%) */}
                    <div className="flex-1 min-h-0 border-t border-gray-200 dark:border-gray-700" style={divStyle}>
                        {/* Replaced CoachPanel with WebcamPanel */}
                        <WebcamPanel />
                    </div>

                    {/* Bottom-Left: Webcam (50%) */}
                    <div className="flex-1 min-h-0" style={divStyle}>
                        <InterviewerPanel
                            messages={interviewerMessages}
                            startTime={startTime}
                        />
                    </div>
                </div>

                {/* Right Column (50%) */}
                <div className="w-3/5 h-full flex flex-col" style={divStyle}>
                    {/* Top-Right: Editor (66% -> Flex-[2]) */}
                    <div className="flex-[2] min-h-0" style={divStyle}>
                        <EditorPanel
                            question={question}
                            code={code}
                            onCodeChange={onCodeChange}
                            onRunResult={onRunResult}
                        />
                    </div>

                    {/* Bottom-Right: Transcript (33% -> Flex-[1]) */}
                    <div className="flex-[1] min-h-0 border-t border-gray-200 dark:border-gray-700" style={divStyle}>
                        <TranscriptPanel
                            entries={transcriptEntries}
                            currentPartial={currentPartial}
                        />
                    </div>
                </div>
            </div>

            {/* STT fallback (if provided) */}
            {sttFallback && (
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 border-t border-yellow-300 dark:border-yellow-700" style={divStyle}>
                    {sttFallback}
                </div>
            )}
        </div>
    );
}
