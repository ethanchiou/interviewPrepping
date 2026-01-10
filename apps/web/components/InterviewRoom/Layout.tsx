"use client";

import { ReactNode } from "react";
import InterviewerPanel from "./InterviewerPanel";
import CoachPanel from "./CoachPanel";
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
    return (
        <div className="h-screen flex flex-col">
            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Interviewer (25%) */}
                <div className="w-1/4 h-full">
                    <InterviewerPanel
                        messages={interviewerMessages}
                        startTime={startTime}
                    />
                </div>

                {/* Center: Editor + Transcript (50%) */}
                <div className="w-1/2 h-full flex flex-col">
                    <div className="flex-[2] min-h-0">
                        <EditorPanel
                            question={question}
                            code={code}
                            onCodeChange={onCodeChange}
                            onRunResult={onRunResult}
                        />
                    </div>
                    <div className="flex-[1] min-h-0 border-t border-gray-200 dark:border-gray-700">
                        <TranscriptPanel
                            entries={transcriptEntries}
                            currentPartial={currentPartial}
                        />
                    </div>
                </div>

                {/* Right: Coach (25%) */}
                <div className="w-1/4 h-full">
                    <CoachPanel nudges={coachNudges} />
                </div>
            </div>

            {/* STT fallback (if provided) */}
            {sttFallback && (
                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 border-t border-yellow-300 dark:border-yellow-700">
                    {sttFallback}
                </div>
            )}
        </div>
    );
}
