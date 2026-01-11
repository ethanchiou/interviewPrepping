"use client";

import {
    Question,
    InterviewerMessage,
    CoachNudge,
    TranscriptEntry,
    RunResultPayload,
} from "@/lib/types";
import EditorPanel from "./EditorPanel";
import InterviewerPanel from "./InterviewerPanel";
import CoachPanel from "./CoachPanel";
import TranscriptPanel from "./TranscriptPanel";
import WebcamPanel from "./WebcamPanel";
import Timer from "./Timer";

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
    sttFallback?: React.ReactNode;
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
        <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        Interview Simulator
                    </h1>
                    <Timer startTime={startTime} />
                </div>
            </div>

            {/* Main Content Area - Fixed Height, No Overall Scroll */}
            <div className="flex-1 flex gap-6 p-6 min-h-0">
                {/* Left Column - Webcam and Interviewer */}
                <div className="w-[420px] flex flex-col gap-6 flex-none">
                    {/* Webcam - Fixed Height */}
                    <div className="h-72 flex-none">
                        <WebcamPanel />
                    </div>

                    {/* Interviewer Panel - Flexible, Scrollable */}
                    <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <InterviewerPanel messages={interviewerMessages} startTime={startTime} />
                        </div>
                    </div>
                </div>

                {/* Right Column - Code Editor and Transcript */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    {/* Code Editor */}
                    <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <EditorPanel
                            question={question}
                            code={code}
                            onCodeChange={onCodeChange}
                            onRunResult={onRunResult}
                        />
                    </div>

                    {/* Transcript Panel - Below Editor */}
                    <div className="h-48 flex-none bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Transcript
                            </h2>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <TranscriptPanel
                                entries={transcriptEntries}
                                currentPartial={currentPartial}
                                fallback={sttFallback}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}