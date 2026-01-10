"use client";

import { useState } from "react";
import { SampleTest, RunResultPayload } from "@/lib/types";
import { runTests } from "@/lib/runner";

interface RunPanelProps {
    code: string;
    tests: SampleTest[];
    onResult: (result: RunResultPayload) => void;
}

export default function RunPanel({ code, tests, onResult }: RunPanelProps) {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<RunResultPayload | null>(null);
    const [error, setError] = useState<string>("");

    const handleRun = async () => {
        setRunning(true);
        setError("");
        setResult(null);

        try {
            const testResult = await runTests(code, tests);
            setResult(testResult);
            onResult(testResult);
        } catch (err: any) {
            setError(err.message || "Execution failed");
            setResult({ passed: false, results: [] });
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4 mb-3">
                <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
                >
                    {running ? "Running..." : "▶ Run"}
                </button>

                {result && (
                    <div
                        className={`px-4 py-2 rounded-lg font-semibold ${result.passed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                    >
                        {result.passed ? "✓ All tests passed" : "✗ Some tests failed"}
                    </div>
                )}

                {error && (
                    <div className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm">
                        {error}
                    </div>
                )}
            </div>

            {result && result.results.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {result.results.map((test, idx) => (
                        <div
                            key={idx}
                            className={`p-2 rounded text-xs border ${test.pass
                                    ? "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700"
                                    : "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700"
                                }`}
                        >
                            <div className="font-mono">
                                <span className="font-semibold">Input:</span> {test.input}
                            </div>
                            <div className="font-mono">
                                <span className="font-semibold">Expected:</span> {test.expected}
                            </div>
                            <div className="font-mono">
                                <span className="font-semibold">Actual:</span> {test.actual}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
