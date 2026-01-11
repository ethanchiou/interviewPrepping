"use client";

import { useState } from "react";
import { SampleTest, RunResultPayload } from "@/lib/types";
import { runTests } from "@/lib/runner";

interface RunPanelProps {
    code: string;
    language: "javascript" | "python";
    tests: SampleTest[];
    onResult: (result: RunResultPayload) => void;
}

export default function RunPanel({ code, language, tests, onResult }: RunPanelProps) {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<RunResultPayload | null>(null);
    const [error, setError] = useState<string>("");

    const handleRun = async () => {
        setRunning(true);
        setError("");
        setResult(null);

        try {
            const testResult = await runTests(code, tests, language);
            setResult(testResult);
            onResult(testResult);
        } catch (err: any) {
            setError(err.message || "Execution failed");
            setResult({ 
                passed: false, 
                results: [],
                executionTime: 0,
                complexity: null
            });
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                    <button
                        onClick={handleRun}
                        disabled={running}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
                    >
                        {running ? "Running..." : "▶ Run"}
                    </button>

                    {result && (
                        <div className="flex items-center gap-3">
                            <div
                                className={`px-4 py-2 rounded-lg font-semibold ${
                                    result.passed
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                            >
                                {result.passed ? "✓ All tests passed" : "✗ Some tests failed"}
                            </div>
                            
                            {result.executionTime !== undefined && (
                                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-semibold">
                                    ⏱ {result.executionTime.toFixed(2)}ms
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Complexity Analysis */}
                {result && result.complexity && (
                    <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg">
                        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                            Complexity Analysis
                        </h4>
                        <div className="flex gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-purple-800 dark:text-purple-200">
                                    Time:
                                </span>{" "}
                                <span className="font-mono text-purple-900 dark:text-purple-100">
                                    {result.complexity.time}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold text-purple-800 dark:text-purple-200">
                                    Space:
                                </span>{" "}
                                <span className="font-mono text-purple-900 dark:text-purple-100">
                                    {result.complexity.space}
                                </span>
                            </div>
                        </div>
                        {result.complexity.explanation && (
                            <p className="mt-2 text-xs text-purple-800 dark:text-purple-200">
                                {result.complexity.explanation}
                            </p>
                        )}
                    </div>
                )}

                {/* Test Results */}
                {result && result.results.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                            Test Cases ({result.results.filter(t => t.pass).length}/{result.results.length} passed)
                        </h4>
                        {result.results.map((test, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded text-xs border ${
                                    test.pass
                                        ? "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700"
                                        : "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        Test Case {idx + 1}
                                    </span>
                                    <span className={`font-bold ${test.pass ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                                        {test.pass ? "✓ PASS" : "✗ FAIL"}
                                    </span>
                                </div>
                                <div className="space-y-1 font-mono">
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Input:</span> {test.input}
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Expected:</span> {test.expected}
                                    </div>
                                    <div className={test.pass ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                                        <span className="font-semibold">Actual:</span> {test.actual}
                                    </div>
                                    {test.executionTime !== undefined && (
                                        <div className="text-gray-600 dark:text-gray-400">
                                            <span className="font-semibold">Time:</span> {test.executionTime.toFixed(2)}ms
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}