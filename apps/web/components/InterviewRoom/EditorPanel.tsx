"use client";

import Editor from "@monaco-editor/react";
import { Question } from "@/lib/types";
import RunPanel from "./RunPanel";
import { RunResultPayload } from "@/lib/types";

interface EditorPanelProps {
    question: Question;
    code: string;
    onCodeChange: (code: string) => void;
    onRunResult: (result: RunResultPayload) => void;
}

export default function EditorPanel({
    question,
    code,
    onCodeChange,
    onRunResult,
}: EditorPanelProps) {
    return (
        <div className="h-full flex flex-col">
            {/* Question prompt */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {question.title}
                    </h2>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${question.difficulty === "Easy"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : question.difficulty === "Medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                    >
                        {question.difficulty}
                    </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {question.prompt}
                </p>
            </div>

            {/* Monaco editor */}
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={code}
                    onChange={(value) => onCodeChange(value || "")}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>

            {/* Run panel */}
            <RunPanel
                code={code}
                tests={question.sample_tests}
                onResult={onRunResult}
            />
        </div>
    );
}
