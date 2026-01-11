"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const difficulties = ["Easy", "Medium", "Hard"];
const companies = ["General", "Meta", "Google", "Microsoft", "Apple", "tailscale", "Dyson", "Intuit", "Manulife", "Moorcheh.ai"];
const dataStructures = ["Random", "HashMaps", "Linked Lists", "Stacks", "Two Pointers", "Graphs"];

export default function LandingForm() {
    const router = useRouter();
    const [companyMode, setCompanyMode] = useState("General");
    const [difficulty, setDifficulty] = useState("Medium");
    const [dataStructure, setDataStructure] = useState("Random");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStart = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Pick a question
            const pickRes = await fetch(
                `${API_URL}/questions/pick?company_mode=${companyMode}&difficulty=${difficulty}&data_structure=${dataStructure}`
            );

            if (!pickRes.ok) {
                throw new Error("Failed to fetch question");
            }

            const { question } = await pickRes.json();

            // 2. Create session
            const sessionRes = await fetch(`${API_URL}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: question.id,
                    company_mode: companyMode,
                    difficulty,
                    data_structure: dataStructure,
                }),
            });

            if (!sessionRes.ok) {
                throw new Error("Failed to create session");
            }

            const { session_id, ws_token } = await sessionRes.json();

            // 3. Navigate to interview room
            router.push(`/interview?session_id=${session_id}&token=${ws_token}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200/50 dark:border-gray-700/50">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        HireSight
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Real Interview Preparation
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Difficulty Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                            Difficulty
                        </label>
                        <div className="flex gap-3 flex-wrap">
                            {difficulties.map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => setDifficulty(diff)}
                                    disabled={loading}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${difficulty === diff
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Company Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Company
                        </label>
                        <select
                            value={companyMode}
                            onChange={(e) => setCompanyMode(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {companies.map((company) => (
                                <option key={company} value={company}>
                                    {company}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Data Structure Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            Data Structure
                        </label>
                        <select
                            value={dataStructure}
                            onChange={(e) => setDataStructure(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {dataStructures.map((ds) => (
                                <option key={ds} value={ds}>
                                    {ds}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Starting...
                            </span>
                        ) : (
                            "Start Interview"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
