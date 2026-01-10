"use client";

import { CoachNudge } from "@/lib/types";

interface CoachPanelProps {
    nudges: CoachNudge[];
}

const severityColors = {
    none: "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
    low: "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700",
    medium:
        "bg-yellow-50 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-700",
    high: "bg-red-50 dark:bg-red-900 border-red-400 dark:border-red-700",
};

export default function CoachPanel({ nudges }: CoachPanelProps) {
    const displayNudges = nudges.slice(-10).reverse(); // Show latest 10, newest first

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    AI Coach
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Real-time hints
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayNudges.length === 0 && (
                    <div className="text-gray-400 text-sm italic">
                        Waiting for hints...
                    </div>
                )}

                {displayNudges.map((nudge) => (
                    <div
                        key={nudge.id}
                        className={`p-3 rounded-lg border ${severityColors[nudge.severity]}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                                {nudge.severity}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                            {nudge.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
