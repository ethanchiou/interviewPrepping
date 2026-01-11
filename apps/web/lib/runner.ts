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
    timeout: number = 180000, // 3 minutes
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
 * Inline worker code with Pyodide support for Python
 */
function getWorkerCode(): string {
    return `
        console.log("👷 Worker initialized");
        
        let pyodide = null;
        let pyodidePromise = null;
        
        async function initPyodide() {
            if (pyodide) return pyodide;
            if (pyodidePromise) return pyodidePromise;
            
            console.log("🐍 Loading Pyodide...");
            pyodidePromise = new Promise(async (resolve, reject) => {
                try {
                    // Load Pyodide script
                    if (typeof loadPyodide === 'undefined') {
                        importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
                    }
                    
                    pyodide = await loadPyodide({
                        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
                    });
                    console.log("✅ Pyodide loaded");
                    resolve(pyodide);
                } catch (error) {
                    reject(error);
                }
            });
            
            return pyodidePromise;
        }
        
        self.onmessage = async (event) => {
            console.log("👷 Worker received message:", event.data);
            const { type, code, tests, timeout } = event.data;

            if (type !== "RUN_TESTS") {
                console.log("👷 Unknown message type:", type);
                return;
            }

            const startTime = Date.now();
            const results = [];
            const logs = [];

            // Capture Python print statements
            const captureOutput = (text) => {
                logs.push(text);
                console.log("📝 Python output:", text);
            };

            try {
                console.log("👷 Executing Python code...");
                
                // Initialize Pyodide if not ready
                await initPyodide();
                
                // Set up Python stdout capture
                pyodide.runPython(\`
import sys
from io import StringIO
import json

class Capturing(list):
    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._stringio = StringIO()
        return self
    def __exit__(self, *args):
        self.extend(self._stdout.getvalue().splitlines())
        del self._stringio
        sys.stdout = self._stdout
\`);
                
                // Execute user code
                try {
                    console.log("👷 Evaluating Python code...");
                    pyodide.runPython(code);
                    
                    // Check if solution function or Solution class exists
                    // Use Python to check and return JSON for reliable boolean conversion
                    const checkCode = \`
import json
has_solution = 'solution' in globals()
has_solution_class = 'Solution' in globals()
json.dumps({'has_solution': has_solution, 'has_solution_class': has_solution_class})
\`;
                    
                    const checkResultJson = pyodide.runPython(checkCode);
                    const checkResult = JSON.parse(checkResultJson);
                    const hasSolution = checkResult.has_solution;
                    const hasSolutionClass = checkResult.has_solution_class;
                    
                    if (!hasSolution && !hasSolutionClass) {
                        throw new Error('❌ You must define a function called "solution" or a class called "Solution"');
                    }
                    
                    // Determine solution type
                    const isClassBased = hasSolutionClass;
                    
                    // Store solution type in Python globals
                    pyodide.runPython(isClassBased ? \`_is_class_based = True\` : \`_is_class_based = False\`);
                    
                    if (isClassBased) {
                        // Get the first public method from Solution class (excluding dunder methods)
                        const methodName = pyodide.runPython(\`
import inspect
methods = [m for m in dir(Solution) if not m.startswith('_') and callable(getattr(Solution, m))]
methods[0] if methods else None
\`);
                        
                        if (!methodName) {
                            throw new Error('❌ Solution class must have at least one public method');
                        }
                        
                        pyodide.globals.set('_solution_method', methodName);
                        console.log("✅ Python code evaluated successfully, Solution class found with method:", methodName);
                    } else {
                        console.log("✅ Python code evaluated successfully, solution function found");
                    }
                } catch (error) {
                    console.log("❌ Python code evaluation error:", error.message);
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

                        // Execute the solution in Python
                        console.log("▶️ Calling solution with args:", argsArray);
                        
                        // Use Pyodide's API to convert JS objects to Python
                        // This handles the conversion automatically
                        const pyArgs = pyodide.toPy(argsArray);
                        pyodide.globals.set('_test_args', pyArgs);
                        
                        // Check if we're using class-based or function-based solution
                        const isClassBasedResult = pyodide.runPython(\`json.dumps(_is_class_based)\`);
                        const isClassBased = JSON.parse(isClassBasedResult);
                        
                        let resultJson;
                        if (isClassBased) {
                            // Class-based solution: create instance and call method
                            const methodName = pyodide.globals.get('_solution_method');
                            const callCode = \`
import json
sol = Solution()
method_name = _solution_method
if isinstance(_test_args, list) and len(_test_args) > 1:
    result = getattr(sol, method_name)(*_test_args)
elif isinstance(_test_args, list) and len(_test_args) == 1:
    result = getattr(sol, method_name)(_test_args[0])
else:
    result = getattr(sol, method_name)(_test_args)
json.dumps(result) if result is not None else "null"
\`;
                            resultJson = pyodide.runPython(callCode);
                        } else {
                            // Function-based solution
                            const callCode = \`
import json
if isinstance(_test_args, list) and len(_test_args) > 1:
    result = solution(*_test_args)
elif isinstance(_test_args, list) and len(_test_args) == 1:
    result = solution(_test_args[0])
else:
    result = solution(_test_args)
json.dumps(result) if result is not None else "null"
\`;
                            resultJson = pyodide.runPython(callCode);
                        }
                        
                        const actual = JSON.parse(resultJson);
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
            }
        };
    `;
}