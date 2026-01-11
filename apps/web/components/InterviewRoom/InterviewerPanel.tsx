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
                                Connecting to interviewer...
                            </div>
                            
                            {/* Show metrics while waiting */}
                            {metrics && (
                                <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-600">
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                                        📊 Performance Tracking
                                    </h3>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-300">Face Detection:</span>
                                            <span className={`font-bold ${metrics.faceDetected ? 'text-green-600' : 'text-red-600'}`}>
                                                {metrics.faceDetected ? '✓ Detected' : '✗ Not Found'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-300">Eye Contact:</span>
                                            <span className={`font-bold ${metrics.eyeContact ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {metrics.eyeContact ? '✓ Good' : '⚠ Look at Camera'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-300">Eyes Open:</span>
                                            <span className={`font-bold ${metrics.leftEyeOpen && metrics.rightEyeOpen ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {metrics.leftEyeOpen && metrics.rightEyeOpen ? '✓ Both Open' : '⚠ Check Eyes'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-300">Head Posture:</span>
                                            <span className={`font-bold ${metrics.headTiltAngle < 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {metrics.headTiltAngle < 10 ? '✓ Good' : `⚠ ${metrics.headTiltAngle.toFixed(1)}° tilt`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-500 text-xs text-gray-600 dark:text-gray-400">
                                        💡 Maintain eye contact and good posture throughout the interview
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="bg-blue-50 dark:bg-gray-700 p-3 rounded-lg"
                            >
                                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                    {msg.text}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}