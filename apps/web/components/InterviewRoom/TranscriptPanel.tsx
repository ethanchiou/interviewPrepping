"use client";

import { TranscriptEntry } from "@/lib/types";
import { useState } from "react";

interface SpeechAnalysis {
    clarity_score: number;
    confidence_score: number;
    filler_count: number;
    filler_words: string[];
    pace: string;
    feedback: string;
    strengths: string[];
    improvements: string[];
}

interface TranscriptPanelProps {
    entries: TranscriptEntry[];
    currentPartial: string;
    onRequestAnalysis?: () => void;
    speechAnalysis?: SpeechAnalysis | null;
}

export default function TranscriptPanel({
    entries,
    currentPartial,
    onRequestAnalysis,
    speechAnalysis,
}: TranscriptPanelProps) {
    const [showAnalysis, setShowAnalysis] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Transcript
                </h3>
                
                {onRequestAnalysis && entries.length > 0 && (
                    <button
                        onClick={() => {
                            onRequestAnalysis();
                            setShowAnalysis(true);
                        }}
                        className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
                    >
                        📊 Analyze Speech
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                {/* Speech Analysis Results */}
                {showAnalysis && speechAnalysis && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100">
                                🎯 Speech Analysis
                            </h4>
                            <button
                                onClick={() => setShowAnalysis(false)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Clarity</div>
                                <div className={`text-lg font-bold ${getScoreColor(speechAnalysis.clarity_score)}`}>
                                    {speechAnalysis.clarity_score}/10
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
                                <div className={`text-lg font-bold ${getScoreColor(speechAnalysis.confidence_score)}`}>
                                    {speechAnalysis.confidence_score}/10
                                </div>
                            </div>
                        </div>

                        {/* Filler Words */}
                        {speechAnalysis.filler_count > 0 && (
                            <div className="mb-3 text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Filler words: </span>
                                <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                    {speechAnalysis.filler_count} ({speechAnalysis.filler_words.join(', ')})
                                </span>
                            </div>
                        )}

                        {/* Feedback */}
                        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                💡 Feedback:
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                                {speechAnalysis.feedback}
                            </div>
                        </div>

                        {/* Strengths */}
                        {speechAnalysis.strengths && speechAnalysis.strengths.length > 0 && (
                            <div className="mb-2">
                                <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                    ✓ Strengths:
                                </div>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {speechAnalysis.strengths.map((s, i) => (
                                        <li key={i}>• {s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvements */}
                        {speechAnalysis.improvements && speechAnalysis.improvements.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">
                                    ⚡ Areas to Improve:
                                </div>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {speechAnalysis.improvements.map((s, i) => (
                                        <li key={i}>• {s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Transcript Entries */}
                {entries.map((entry, idx) => (
                    <div key={idx} className="text-gray-700 dark:text-gray-300">
                        <span className="opacity-70">You: </span>
                        {entry.text}
                    </div>
                ))}

                {/* Current STT partial text */}
                {currentPartial ? (
                    <div className="text-gray-400 italic">
                        <span className="opacity-70">You: </span>
                        {currentPartial}...
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-gray-400 text-xs italic">
                        Start speaking or type below...
                    </div>
                ) : null}
            </div>
        </div>
    );
}
