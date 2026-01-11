"use client";

import { useRef, useState } from "react";
import { SampleTest } from "@/lib/types";
import { runTests, RunnerResult } from "@/lib/runner";

interface RunPanelProps {
    code: string;
    tests: SampleTest[];
    onResult: (result: any) => void;
}

export default function RunPanel({ code, tests, onResult }: RunPanelProps) {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<RunnerResult | null>(null);
    const [error, setError] = useState<string>("");

    const workerRef = useRef<Worker | null>(null);

    const handleRun = async () => {
        console.log("🏃 Running tests...");
        console.log("Code:", code);
        console.log("Tests:", tests);

        setRunning(true);
        setError("");
        setResult(null);

        try {
            const testResult = await runTests(
                code,
                tests,
                180000, // 3 minutes
                (worker) => {
                    workerRef.current = worker;
                }
            );

            console.log("✅ Test result:", testResult);
            setResult(testResult);
            onResult(testResult);
        } catch (err: any) {
            console.error("❌ Test error:", err);
            setError(err.message || "Execution failed");
        } finally {
            setRunning(false);
            workerRef.current = null;
        }
    };


    return (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4 mb-3">
                <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                    {running ? "⏳ Running..." : "▶ Run"}
                </button>

                {error && (
                    <div className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm">
                        ❌ {error}
                    </div>
                )}

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
            </div>

            {/* Test Results */}
            {result && result.results.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Test Results ({result.results.filter(r => r.pass).length}/{result.results.length} passed):
                    </div>
                    {result.results.map((test, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg text-xs border-2 ${test.pass
                                    ? "bg-green-50 border-green-300 dark:bg-green-900 dark:border-green-700"
                                    : "bg-red-50 border-red-300 dark:bg-red-900 dark:border-red-700"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold">
                                    {test.pass ? "✅ Test " + (idx + 1) : "❌ Test " + (idx + 1)}
                                </span>
                            </div>
                            <div className="space-y-1 font-mono text-xs">
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 w-20">Input:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{test.input}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 w-20">Expected:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{test.expected}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400 w-20">Got:</span>
                                    <span className={test.pass ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                                        {test.actual}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No tests warning */}
            {tests.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    ⚠️ No test cases available for this question
                </div>
            )}
        </div>
    );
}
