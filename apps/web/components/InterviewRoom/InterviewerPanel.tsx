"use client";

import { InterviewerMessage } from "@/lib/types";
import Timer from "./Timer";

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
        } else {
            return "You are doing great! Keep it up!"
        }

        return null;
    };

    const conditionalMessage = getConditionalMessage();

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
                            {conditionalMessage && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-300 dark:border-yellow-600">
                                    <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                        {conditionalMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Show conditional messages even when messages exist */}
                            {conditionalMessage && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 mb-4">
                                    <p className="text-yellow-800 dark:text-yellow-200 font-medium text-sm">
                                        {conditionalMessage}
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