"use client";

import { InterviewerMessage } from "@/lib/types";
import Timer from "./Timer";
import { useEffect, useRef, useState } from "react";


interface MediaPipeMetrics {
    eyeContact: boolean;
    leftEyeOpen: boolean;
    rightEyeOpen: boolean;
    headTiltAngle: number;
    faceDetected: boolean;
}

interface InterviewerPanelProps {
    messages: InterviewerMessage[];
    startTime: number;
    metrics?: MediaPipeMetrics | null;
}

export default function InterviewerPanel({
    messages,
    startTime,
    metrics,
}: InterviewerPanelProps) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSpeakingRef = useRef<boolean>(false);
    const issueStartTimeRef = useRef<number | null>(null);
    const displayedMessageRef = useRef<string | null>(null);
    const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);

    // Helper function to get conditional message based on metrics
    const getConditionalMessage = (): string | null => {
        if (!metrics) return null;

        const notFacing = !metrics.faceDetected;
        const notLooking = !metrics.eyeContact;

        if (notFacing && notLooking) {
            return "Hey, make sure you are facing and looking at the camera";
        } else if (notFacing) {
            return "Hey, make sure you are facing the camera";
        } else if (notLooking) {
            return "Hey, make sure you are looking at the camera";
        }

        // Everything is good - show positive message
        return "You are doing great! Keep it up!";
    };

    const conditionalMessage = getConditionalMessage();
    const isPositiveMessage = conditionalMessage === "You are doing great! Keep it up!";

    // Handle 2-second delay before showing/speaking message (only for warning messages)
    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (conditionalMessage) {
            // Positive messages show immediately, no delay
            if (isPositiveMessage) {
                displayedMessageRef.current = conditionalMessage;
                setDisplayedMessage(conditionalMessage);
                issueStartTimeRef.current = null;
                return;
            }

            // For warning messages, apply 2-second delay
            // If message changed, reset the timer
            if (displayedMessageRef.current !== conditionalMessage) {
                issueStartTimeRef.current = Date.now();
                // Clear displayed message if it was showing a different message
                if (displayedMessageRef.current !== null) {
                    displayedMessageRef.current = null;
                    setDisplayedMessage(null);
                }
            }

            // Check if issue has persisted for 2 seconds
            const timeSinceIssueStart = Date.now() - (issueStartTimeRef.current || Date.now());

            if (timeSinceIssueStart >= 1000) {
                // Issue has persisted for 2+ seconds, show/speak message
                if (displayedMessageRef.current !== conditionalMessage) {
                    displayedMessageRef.current = conditionalMessage;
                    setDisplayedMessage(conditionalMessage);
                }
            } else {
                // Wait until 2 seconds have passed
                const remainingTime = 1000 - timeSinceIssueStart;
                timeoutRef.current = setTimeout(() => {
                    // Double-check the message is still the same before displaying
                    if (conditionalMessage && displayedMessageRef.current !== conditionalMessage) {
                        displayedMessageRef.current = conditionalMessage;
                        setDisplayedMessage(conditionalMessage);
                    }
                }, remainingTime);
            }
        } else {
            // No issue - reset everything
            issueStartTimeRef.current = null;
            displayedMessageRef.current = null;
            setDisplayedMessage(null);
        }

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [conditionalMessage, isPositiveMessage]);

    // Text-to-speech using Web Speech API - only for warning messages, not positive ones
    useEffect(() => {
        // Don't speak positive messages - check if displayedMessage is the positive message
        const isDisplayedMessagePositive = displayedMessage === "You are doing great! Keep it up!";
        if (!displayedMessage || isSpeakingRef.current || isDisplayedMessagePositive) {
            return;
        }

        // Only speak if we're not already speaking
        if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
            isSpeakingRef.current = true;

            const utterance = new SpeechSynthesisUtterance(displayedMessage);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            // Mark as finished when speech completes
            utterance.onend = () => {
                isSpeakingRef.current = false;
            };

            utterance.onerror = () => {
                isSpeakingRef.current = false;
            };

            window.speechSynthesis.speak(utterance);
        }

        // Cleanup on unmount
        return () => {
            // Don't cancel if we're in the middle of speaking
            if (!isSpeakingRef.current && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [displayedMessage]);

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
                    {messages.length === 0 ? (
                        <div className="space-y-4">
                            <div className="text-gray-400 text-sm italic">

                            </div>

                            {/* Show conditional messages based on metrics */}
                            {displayedMessage && (
                                <div className={`p-4 rounded-lg border-2 ${displayedMessage === "You are doing great! Keep it up!"
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
                                    }`}>
                                    <p className={`font-medium ${displayedMessage === "You are doing great! Keep it up!"
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-yellow-800 dark:text-yellow-200'
                                        }`}>
                                        {displayedMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Show conditional messages even when messages exist */}
                            {displayedMessage && (
                                <div className={`p-3 rounded-lg border-2 mb-4 ${displayedMessage === "You are doing great! Keep it up!"
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
                                    }`}>
                                    <p className={`font-medium text-sm ${displayedMessage === "You are doing great! Keep it up!"
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-yellow-800 dark:text-yellow-200'
                                        }`}>
                                        {displayedMessage}
                                    </p>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}