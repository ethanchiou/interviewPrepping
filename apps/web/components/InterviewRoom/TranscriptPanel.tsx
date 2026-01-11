"use client";

import { TranscriptEntry } from "@/lib/types";
import { useState, useEffect, useRef } from "react";

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
    const [displayedFeedback, setDisplayedFeedback] = useState("");
    const [communicationScore, setCommunicationScore] = useState<number>(0);
    const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fullFeedback = "Try to speak more clearly and look at the camera more to improve your communication.";

    useEffect(() => {
        // Reset displayed feedback when analysis is shown
        if (showAnalysis && speechAnalysis) {
            setDisplayedFeedback("");

            // Clear any existing timeout
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current);
            }

            // Start typing effect
            let currentIndex = 0;
            const typeFeedback = () => {
                if (currentIndex < fullFeedback.length) {
                    setDisplayedFeedback(fullFeedback.slice(0, currentIndex + 1));
                    currentIndex++;
                    feedbackTimeoutRef.current = setTimeout(typeFeedback, 30); // 30ms per character
                }
            };

            // Start typing after a short delay
            feedbackTimeoutRef.current = setTimeout(typeFeedback, 500);
        } else {
            // Clear feedback when analysis is hidden
            setDisplayedFeedback("");
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current);
            }
        }

        // Cleanup on unmount
        return () => {
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current);
            }
        };
    }, [showAnalysis, speechAnalysis]);

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
                            // Generate random score between 5 and 7
                            const randomScore = Math.floor(Math.random() * 3) + 5; // 5, 6, or 7
                            setCommunicationScore(randomScore);
                            setShowAnalysis(true);
                        }}
                        className="text-s px-5 py-2 mr-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
                    >
                        Analyze
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

                        {/* Communication Score */}
                        <div className="mb-3">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Communication Score</div>
                                <div className={`text-3xl font-bold ${getScoreColor(communicationScore)}`}>
                                    {communicationScore}/10
                                </div>
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded text-sm">
                            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                💡 Feedback:
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                                {displayedFeedback}
                                {displayedFeedback.length < fullFeedback.length && (
                                    <span className="inline-block w-0.5 h-4 bg-gray-600 dark:bg-gray-400 ml-1 animate-pulse"></span>
                                )}
                            </div>
                        </div>
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
