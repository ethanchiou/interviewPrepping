"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingForm() {
    const router = useRouter();
    const [companyMode, setCompanyMode] = useState("General");
    const [difficulty, setDifficulty] = useState("Medium");
    const [dataStructure, setDataStructure] = useState("Array");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Bypass session creation for now - go directly to interview
            // Generate a demo session ID and token
            const demoSessionId = `demo-${Date.now()}`;
            const demoToken = `token-${Date.now()}`;

            // Navigate to interview page with demo credentials
            router.push(`/interview?session_id=${demoSessionId}&token=${demoToken}&difficulty=${difficulty}&company_mode=${companyMode}&data_structure=${dataStructure}`);
        } catch (error) {
            console.error("Navigation error:", error);
            alert("Failed to start interview. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Interview Simulator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Practice coding interviews with AI
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Mode */}
                    <div>
                        <label
                            htmlFor="company"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Company Focus
                        </label>
                        <select
                            id="company"
                            value={companyMode}
                            onChange={(e) => setCompanyMode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="General">General</option>
                            <option value="FAANG">FAANG</option>
                            <option value="Startup">Startup</option>
                        </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label
                            htmlFor="difficulty"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Difficulty
                        </label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    {/* Data Structure */}
                    <div>
                        <label
                            htmlFor="dataStructure"
                            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Data Structure Focus
                        </label>
                        <select
                            id="dataStructure"
                            value={dataStructure}
                            onChange={(e) => setDataStructure(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="Array">Array</option>
                            <option value="String">String</option>
                            <option value="LinkedList">Linked List</option>
                            <option value="Tree">Tree</option>
                            <option value="Graph">Graph</option>
                            <option value="HashMap">Hash Map</option>
                            <option value="Stack">Stack</option>
                            <option value="Queue">Queue</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Starting Interview...
                            </span>
                        ) : (
                            "Start Interview"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Demo Mode • Session management coming soon
                    </p>
                </div>
            </div>
        </div>
    );
}