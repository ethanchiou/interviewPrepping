"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Question, RunResultPayload } from "@/lib/types";
import RunPanel from "./RunPanel";
import { loadPyodide } from "@/lib/pyodideLoader";

interface EditorPanelProps {
    question: Question;
    code: string;
    onCodeChange: (code: string) => void;
    onRunResult: (result: RunResultPayload) => void;
}

type Language = "javascript" | "python";

export default function EditorPanel({
    question,
    code,
    onCodeChange,
    onRunResult,
}: EditorPanelProps) {
    const [language, setLanguage] = useState<Language>("javascript");
    const [pyodideLoading, setPyodideLoading] = useState(false);

    const handleLanguageChange = async (newLang: Language) => {
        setLanguage(newLang);
        
        // Load Pyodide when switching to Python
        if (newLang === "python") {
            setPyodideLoading(true);
            try {
                await loadPyodide();
            } catch (error) {
                console.error("Failed to load Python runtime:", error);
            } finally {
                setPyodideLoading(false);
            }
        }
        
        // Set starter code based on language
        const starterCode = newLang === "javascript" 
            ? "function solution(nums) {\n  // Your code here\n  \n}"
            : "def solution(nums):\n    # Your code here\n    pass";
        onCodeChange(starterCode);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Question prompt */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {question.title}
                    </h2>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            question.difficulty === "Easy"
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
                
                {/* Example test cases display */}
                {question.sample_tests && question.sample_tests.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                            Examples:
                        </h3>
                        {question.sample_tests.slice(0, 2).map((test, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono">
                                <div><span className="font-semibold">Input:</span> {test.input}</div>
                                <div><span className="font-semibold">Output:</span> {test.expected}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Language selector and editor */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => handleLanguageChange("javascript")}
                        disabled={pyodideLoading}
                        className={`px-4 py-1.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 ${
                            language === "javascript"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                        JavaScript
                    </button>
                    <button
                        onClick={() => handleLanguageChange("python")}
                        disabled={pyodideLoading}
                        className={`px-4 py-1.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 ${
                            language === "python"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                        Python {pyodideLoading && "(Loading...)"}
                    </button>
                </div>

                <div className="flex-1">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => onCodeChange(value || "")}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: language === "python" ? 4 : 2,
                            insertSpaces: true,
                        }}
                    />
                </div>
            </div>

            {/* Run panel */}
            <RunPanel
                code={code}
                language={language}
                tests={question.sample_tests}
                onResult={onRunResult}
            />
        </div>
    );
}