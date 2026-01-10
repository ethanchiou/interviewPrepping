"use client";

import { ReactNode } from "react";
import InterviewerPanel from "./InterviewerPanel";
import WebcamPanel from "./WebcamPanel";
import EditorPanel from "./EditorPanel";
import TranscriptPanel from "./TranscriptPanel";
import {
  InterviewerMessage,
  TranscriptEntry,
  Question,
  RunResultPayload,
} from "@/lib/types";

interface LayoutProps {
  question: Question;
  interviewerMessages: InterviewerMessage[];
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <div className="w-2/5 h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-h-0 border-b border-gray-200 dark:border-gray-700">
            <WebcamPanel />
          </div>

          <div className="flex-1 min-h-0">
            <InterviewerPanel
              messages={interviewerMessages}
              startTime={startTime}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-3/5 h-full flex flex-col">
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
      </div>

      {sttFallback && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 border-t border-yellow-300 dark:border-yellow-700">
          {sttFallback}
        </div>
      )}
    </div>
  );
}
