"use client";

import { InterviewerMessage } from "@/lib/types";
import Timer from "./Timer";

interface InterviewerPanelProps {
    messages: InterviewerMessage[];
    startTime: number;
}

export default function InterviewerPanel({
    messages,
    startTime,
}: InterviewerPanelProps) {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Interviewer
                    </h2>
                    <Timer startTime={startTime} />
                </div>
            </div>
            <div className="flex-1 flex flex-row overflow-hidden">
                <div className="flex items-center justify-center p-8 border-r border-gray-200 dark:border-gray-700">
                    <div className="w-60 h-60 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <img src="/assets/interviewer.png" alt="Interviewer" className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-gray-400 text-sm italic">
                            Connecting to interviewer...
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="bg-blue-50 dark:bg-gray-700 p-3 rounded-lg"
                        >
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                {msg.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
