"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
                    Interview Simulator
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                    Practice coding interviews with AI
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Difficulty
                        </label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            disabled={loading}
                        >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Company Mode
                        </label>
                        <select
                            value={companyMode}
                            onChange={(e) => setCompanyMode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            disabled={loading}
                        >
                            <option>General</option>
                            <option>Meta</option>
                            <option>Google</option>
                            <option>Microsoft</option>
                            <option>Apple</option>
                            <option>tailscale</option>
                            <option>Dyson</option>
                            <option>Intuit</option>
                            <option>Manulife</option>
                            <option>Moorcheh.ai</option>

                        </select>
                    </div>

                    

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Structure
                        </label>
                        <select
                            value={dataStructure}
                            onChange={(e) => setDataStructure(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            disabled={loading}
                        >
                            <option>Random</option>
                            <option>HashMaps</option>
                            <option>Linked Lists</option>
                            <option>Stacks</option>
                            <option>Two Pointers</option>
                            <option>Graphs</option>
                            
                        </select>
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        {loading ? "Starting..." : "Start Interview"}
                    </button>
                </div>
            </div>
        </div>
    );
}
