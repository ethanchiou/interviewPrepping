/**
 * Code runner utility that uses Web Worker
 * Enhanced with console output capture and manual stop support
 */

import { SampleTest, RunResultPayload } from "./types";

export interface RunnerResult extends RunResultPayload {
    logs: string[];
}

export async function runTests(
    code: string,
    tests: SampleTest[],
    timeout: number = 800,
    onWorkerReady?: (worker: Worker) => void
): Promise<RunnerResult> {
    console.log("🚀 runTests called with:", { codeLength: code.length, testCount: tests.length, timeout });

    return new Promise((resolve, reject) => {
        const workerCode = getWorkerCode();

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        
        let worker: Worker;
        try {
            worker = new Worker(workerUrl);
            console.log("✅ Worker created successfully");
        } catch (error: any) {
            console.error("❌ Failed to create worker:", error);
            URL.revokeObjectURL(workerUrl);
            reject(new Error("Failed to create worker: " + error.message));
            return;
        }

        // Allow caller to store worker reference (for Stop button)
        if (onWorkerReady) {
            onWorkerReady(worker);
        }

        const timeoutId = setTimeout(() => {
            console.log("⏱️ Timeout reached, terminating worker");
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error(`Code execution timeout (${timeout}ms)`));
        }, timeout + 100);

        worker.onmessage = (event) => {
            console.log("📨 Worker message received:", event.data);
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);

            if (event.data.error) {
                console.error("❌ Worker returned error:", event.data);
                reject(new Error(event.data.message || event.data.error));
            } else {
                console.log("✅ Tests completed:", event.data);
                resolve({
                    passed: event.data.passed,
                    results: event.data.results,
                    logs: event.data.logs || [],
                });
            }
        };

        worker.onerror = (error) => {
            console.error("❌ Worker error event:", error);
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error(error.message || "Worker error"));
        };

        console.log("📤 Posting message to worker");
        worker.postMessage({
            type: "RUN_TESTS",
            code,
            tests,
            timeout,
        });
    });
}

/**
 * Inline worker code
 */
function getWorkerCode(): string {
    return `
        console.log("👷 Worker initialized");
        
        self.onmessage = (event) => {
            console.log("👷 Worker received message:", event.data);
            const { type, code, tests, timeout } = event.data;

            if (type !== "RUN_TESTS") {
                console.log("👷 Unknown message type:", type);
                return;
            }

            const startTime = Date.now();
            const results = [];
            const logs = [];

            // Capture console.log
            const originalLog = console.log;
            console.log = (...args) => {
                const logMessage = args.map(a => 
                    typeof a === "object" ? JSON.stringify(a) : String(a)
                ).join(" ");
                logs.push(logMessage);
                originalLog("📝 Console:", logMessage);
            };

            try {
                console.log("👷 Executing user code...");
                
                // Execute user code and extract the solution function
                let solutionFn;
                
                try {
                    // Wrap code in IIFE to avoid polluting global scope
                    const wrappedCode = \`
                        (function() {
                            \${code}
                            
                            if (typeof solution !== 'function') {
                                throw new Error('❌ You must define a function called "solution"');
                            }
                            
                            return solution;
                        })();
                    \`;
                    
                    console.log("👷 Evaluating code...");
                    solutionFn = eval(wrappedCode);
                    console.log("✅ Code evaluated successfully, solution function found");
                } catch (error) {
                    console.log("❌ Code evaluation error:", error.message);
                    self.postMessage({
                        error: "COMPILE_ERROR",
                        message: "Syntax error in your code: " + error.message,
                    });
                    return;
                }

                console.log("👷 Running", tests.length, "tests...");

                // Run each test
                for (let i = 0; i < tests.length; i++) {
                    const test = tests[i];
                    console.log("🧪 Running test", i + 1, ":", test);
                    
                    if (Date.now() - startTime > timeout) {
                        console.log("⏱️ Timeout during test execution");
                        self.postMessage({
                            error: "TIMEOUT",
                            message: \`Execution exceeded \${timeout}ms\`,
                        });
                        return;
                    }

                    try {
                        // Parse input
                        let argsArray;
                        try {
                            const parsedInput = JSON.parse(test.input);
                            argsArray = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
                            console.log("📥 Parsed input:", argsArray);
                        } catch (e) {
                            console.log("⚠️ JSON parse failed, treating as string");
                            argsArray = [test.input];
                        }

                        // Execute the solution
                        console.log("▶️ Calling solution with args:", argsArray);
                        const actual = solutionFn(...argsArray);
                        console.log("📤 Solution returned:", actual);
                        
                        const actualStr = JSON.stringify(actual);
                        
                        // Parse expected output
                        let expectedStr;
                        try {
                            const expectedObj = JSON.parse(test.expected);
                            expectedStr = JSON.stringify(expectedObj);
                        } catch (e) {
                            console.log("⚠️ Expected is not JSON, using as-is");
                            expectedStr = JSON.stringify(test.expected);
                        }

                        const pass = actualStr === expectedStr;
                        console.log(pass ? "✅ Test passed" : "❌ Test failed");
                        console.log("Expected:", expectedStr, "Got:", actualStr);

                        results.push({
                            input: test.input,
                            expected: test.expected,
                            actual: actualStr,
                            pass: pass,
                        });
                    } catch (error) {
                        console.log("❌ Test execution error:", error.message);
                        results.push({
                            input: test.input,
                            expected: test.expected,
                            actual: \`Error: \${error.message}\`,
                            pass: false,
                        });
                    }
                }

                const allPassed = results.every(r => r.pass);
                console.log("🏁 All tests completed. Passed:", allPassed);

                self.postMessage({
                    passed: allPassed,
                    results,
                    logs,
                });
            } catch (error) {
                console.log("💥 Unexpected error:", error.message);
                self.postMessage({
                    error: "RUNTIME_ERROR",
                    message: error.message || "Unknown error occurred",
                });
            } finally {
                console.log = originalLog;
            }
        };
    `;
}