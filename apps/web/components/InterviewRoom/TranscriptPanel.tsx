"use client";

import { TranscriptEntry } from "@/lib/types";

interface TranscriptPanelProps {
    entries: TranscriptEntry[];
    currentPartial: string;
}

export default function TranscriptPanel({
    entries,
    currentPartial,
}: TranscriptPanelProps) {
    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Transcript
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                {entries.map((entry, idx) => (
                    <div key={idx} className="text-gray-700 dark:text-gray-300">
                        <span className="opacity-70">You: </span>
                        {entry.text}
                    </div>
                ))}

                {currentPartial && (
                    <div className="text-gray-400 italic">
                        <span className="opacity-70">You: </span>
                        {currentPartial}...
                    </div>
                )}

                {entries.length === 0 && !currentPartial && (
                    <div className="text-gray-400 text-xs italic">
                        Start speaking or type below...
                    </div>
                )}
            </div>
        </div>
    );
}
