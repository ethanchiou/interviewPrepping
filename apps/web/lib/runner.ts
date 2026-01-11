/**
 * Code Runner - Executes user code against test cases
 * Supports JavaScript and Python execution
 */

import { SampleTest, RunResultPayload, TestResult } from "./types";

/**
 * Run user code against test cases
 */
export async function runTests(
    code: string,
    tests: SampleTest[],
    language: "javascript" | "python" = "javascript"
): Promise<RunResultPayload> {
    if (!code.trim()) {
        throw new Error("No code to run");
    }

    if (!tests || tests.length === 0) {
        throw new Error("No test cases provided");
    }

    const startTime = performance.now();
    const results: TestResult[] = [];
    let allPassed = true;

    for (const test of tests) {
        try {
            const result = await runSingleTest(code, test, language);
            results.push(result);
            if (!result.pass) {
                allPassed = false;
            }
        } catch (error: any) {
            results.push({
                input: test.input,
                expected: test.expected,
                actual: `Error: ${error.message}`,
                pass: false,
                executionTime: 0,
            });
            allPassed = false;
        }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Analyze complexity based on code patterns
    const complexity = analyzeComplexity(code, language);

    return {
        passed: allPassed,
        results,
        executionTime: totalTime,
        complexity,
    };
}

/**
 * Run code against a single test case
 */
async function runSingleTest(
    code: string,
    test: SampleTest,
    language: "javascript" | "python"
): Promise<TestResult> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
        try {
            const timeoutMs = 5000;
            const timeoutId = setTimeout(() => {
                reject(new Error("Execution timeout (5s)"));
            }, timeoutMs);

            try {
                let actual: any;

                if (language === "javascript") {
                    actual = executeJavaScript(code, test.input);
                } else {
                    actual = executePython(code, test.input);
                }

                clearTimeout(timeoutId);

                const endTime = performance.now();
                const executionTime = endTime - startTime;

                const actualStr = JSON.stringify(actual);
                let expectedStr: string;
                try {
                    const expectedObj = JSON.parse(test.expected);
                    expectedStr = JSON.stringify(expectedObj);
                } catch {
                    expectedStr = test.expected.trim();
                }

                const pass = actualStr === expectedStr;

                resolve({
                    input: test.input,
                    expected: test.expected,
                    actual: actualStr,
                    pass,
                    executionTime,
                });
            } catch (execError: any) {
                clearTimeout(timeoutId);
                reject(execError);
            }
        } catch (error: any) {
            reject(error);
        }
    });
}

/**
 * Execute JavaScript code
 */
function executeJavaScript(code: string, input: string): any {
    const functionMatch =
        code.match(/function\s+(\w+)\s*\(/) ||
        code.match(/const\s+(\w+)\s*=/) ||
        code.match(/let\s+(\w+)\s*=/);

    const functionName = functionMatch ? functionMatch[1] : "solution";

    let parsedInput;
    try {
        parsedInput = JSON.parse(input);
    } catch {
        parsedInput = input;
    }

    const wrappedCode = `
        ${code}
        
        (function() {
            const input = ${JSON.stringify(parsedInput)};
            let result;
            
            if (Array.isArray(input)) {
                result = ${functionName}(...input);
            } else {
                result = ${functionName}(input);
            }
            
            return result;
        })();
    `;

    const safeFn = new Function(
        "window",
        "document",
        "fetch",
        "XMLHttpRequest",
        "WebSocket",
        "localStorage",
        "sessionStorage",
        `"use strict"; return (${wrappedCode});`
    );

    return safeFn(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
}

/**
 * Execute Python code (using Pyodide in browser)
 * For MVP, we'll use a simple Python-to-JS transpiler approach
 * In production, you'd use Pyodide or a backend service
 */
function executePython(code: string, input: string): any {
    // Check if Pyodide is loaded
    if (typeof window !== "undefined" && (window as any).pyodide) {
        return executePythonWithPyodide(code, input);
    }

    // Fallback: Basic Python simulation for common patterns
    // This is a simplified approach - for production use Pyodide
    return executePythonSimulated(code, input);
}

/**
 * Execute Python using Pyodide (if loaded)
 */
function executePythonWithPyodide(code: string, input: string): any {
    const pyodide = (window as any).pyodide;

    let parsedInput;
    try {
        parsedInput = JSON.parse(input);
    } catch {
        parsedInput = input;
    }

    const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];

    const wrappedCode = `
${code}

import json
args = json.loads('${JSON.stringify(args)}')
result = solution(*args)
result
    `;

    try {
        const result = pyodide.runPython(wrappedCode);
        return result;
    } catch (error: any) {
        throw new Error(`Python execution error: ${error.message}`);
    }
}

/**
 * Simulated Python execution (fallback)
 * This converts basic Python syntax to JavaScript
 * LIMITED - only works for simple cases
 */
function executePythonSimulated(code: string, input: string): any {
    // Extract function definition
    const funcMatch = code.match(/def\s+(\w+)\s*\((.*?)\):/);
    if (!funcMatch) {
        throw new Error("Could not find Python function definition");
    }

    const functionName = funcMatch[1];
    const params = funcMatch[2].split(',').map(p => p.trim());

    // Extract function body (simplified - just get indented lines after def)
    const lines = code.split('\n');
    let bodyStart = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('def ' + functionName)) {
            bodyStart = i + 1;
            break;
        }
    }

    if (bodyStart === -1) {
        throw new Error("Could not parse Python function body");
    }

    let body = '';
    for (let i = bodyStart; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
            break;
        }
        body += line.replace(/^\s{4}/, '') + '\n';
    }

    // Basic Python to JS conversion
    let jsBody = body
        .replace(/\blen\(/g, '(')
        .replace(/\.append\(/g, '.push(')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bpass\b/g, '/* pass */')
        .replace(/\brange\((\d+)\)/g, '[...Array($1).keys()]')
        .replace(/\brange\((\w+)\)/g, '[...Array($1).keys()]')
        .replace(/elif/g, 'else if')
        .replace(/:\s*$/gm, ' {')
        .replace(/\bprint\(/g, 'console.log(');

    // Add closing braces for if/for/while blocks
    const blockCount = (jsBody.match(/\{/g) || []).length;
    jsBody += '\n' + '}'.repeat(blockCount);

    let parsedInput;
    try {
        parsedInput = JSON.parse(input);
    } catch {
        parsedInput = input;
    }

    const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];

    const jsCode = `
        function ${functionName}(${params.join(', ')}) {
            ${jsBody}
        }
        return ${functionName}(...${JSON.stringify(args)});
    `;

    try {
        const result = new Function(jsCode)();
        return result;
    } catch (error: any) {
        throw new Error(`Python simulation error: ${error.message}. For full Python support, Pyodide will be loaded.`);
    }
}

/**
 * Analyze time and space complexity based on code patterns
 */
function analyzeComplexity(code: string, language: "javascript" | "python"): {
    time: string;
    space: string;
    explanation: string;
} | null {
    // Simple heuristic-based complexity analysis
    const lowerCode = code.toLowerCase();

    let timeComplexity = "O(n)";
    let spaceComplexity = "O(1)";
    let explanation = "";

    // Detect nested loops
    const forLoops = (code.match(/for\s*\(/g) || []).length +
        (code.match(/while\s*\(/g) || []).length +
        (code.match(/for\s+\w+\s+in/g) || []).length;

    if (forLoops >= 3) {
        timeComplexity = "O(n³)";
        explanation = "Detected 3+ nested loops. ";
    } else if (forLoops >= 2) {
        timeComplexity = "O(n²)";
        explanation = "Detected nested loops. ";
    } else if (forLoops >= 1) {
        timeComplexity = "O(n)";
        explanation = "Detected single loop. ";
    }

    // Detect recursion
    const funcName = language === "javascript"
        ? (code.match(/function\s+(\w+)/) || code.match(/const\s+(\w+)\s*=/))?.[1]
        : code.match(/def\s+(\w+)/)?.[1];

    if (funcName && code.includes(funcName + "(")) {
        const count = (code.match(new RegExp(funcName + "\\(", "g")) || []).length;
        if (count > 1) {
            timeComplexity = "O(2ⁿ)";
            explanation = "Detected recursive calls (possibly exponential). ";
        }
    }

    // Detect sorting
    if (lowerCode.includes(".sort(") || lowerCode.includes("sorted(")) {
        timeComplexity = "O(n log n)";
        explanation = "Detected sorting operation. ";
    }

    // Detect data structures
    if (lowerCode.includes("new map") || lowerCode.includes("new set") ||
        lowerCode.includes("{}") || lowerCode.includes("dict()") ||
        lowerCode.includes("set()")) {
        spaceComplexity = "O(n)";
        explanation += "Uses additional data structures. ";
    }

    // Detect arrays/lists creation
    if (lowerCode.includes("new array") || lowerCode.includes("[]") ||
        lowerCode.includes("list()")) {
        spaceComplexity = "O(n)";
        explanation += "Creates auxiliary array/list. ";
    }

    return {
        time: timeComplexity,
        space: spaceComplexity,
        explanation: explanation.trim() || "Estimated based on code structure.",
    };
}

/**
 * Alternative: Run in Web Worker for better isolation
 * This is more secure but requires additional setup
 */
export async function runTestsInWorker(
    code: string,
    tests: SampleTest[]
): Promise<RunResultPayload> {
    // Check if Worker is available
    if (typeof Worker === "undefined") {
        console.warn("Web Workers not available, falling back to inline execution");
        return runTests(code, tests);
    }

    return new Promise((resolve, reject) => {
        try {
            // Create worker blob
            const workerCode = createWorkerCode();
            const blob = new Blob([workerCode], { type: "application/javascript" });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);

            // Set timeout
            const timeout = setTimeout(() => {
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                reject(new Error("Worker execution timeout"));
            }, 10000);

            // Handle messages from worker
            worker.onmessage = (e) => {
                clearTimeout(timeout);
                worker.terminate();
                URL.revokeObjectURL(workerUrl);

                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data.result);
                }
            };

            // Handle errors
            worker.onerror = (error) => {
                clearTimeout(timeout);
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                reject(new Error("Worker error: " + error.message));
            };

            // Send code and tests to worker
            worker.postMessage({ code, tests });
        } catch (error: any) {
            reject(error);
        }
    });
}

/**
 * Create worker code as string
 */
function createWorkerCode(): string {
    return `
        self.onmessage = function(e) {
            const { code, tests } = e.data;
            
            try {
                const results = [];
                let allPassed = true;
                
                for (const test of tests) {
                    try {
                        const result = runTest(code, test);
                        results.push(result);
                        if (!result.pass) allPassed = false;
                    } catch (error) {
                        results.push({
                            input: test.input,
                            expected: test.expected,
                            actual: 'Error: ' + error.message,
                            pass: false
                        });
                        allPassed = false;
                    }
                }
                
                self.postMessage({
                    result: {
                        passed: allPassed,
                        results: results
                    }
                });
            } catch (error) {
                self.postMessage({
                    error: error.message
                });
            }
        };
        
        function runTest(code, test) {
            // Extract function name
            const functionMatch = 
                code.match(/function\\s+(\\w+)\\s*\\(/) ||
                code.match(/const\\s+(\\w+)\\s*=/) ||
                code.match(/let\\s+(\\w+)\\s*=/);
            
            const functionName = functionMatch ? functionMatch[1] : 'solution';
            
            // Parse input
            let parsedInput;
            try {
                parsedInput = JSON.parse(test.input);
            } catch {
                parsedInput = test.input;
            }
            
            // Execute code
            const wrappedCode = \`
                \${code}
                
                (function() {
                    const input = \${JSON.stringify(parsedInput)};
                    let result;
                    
                    if (Array.isArray(input)) {
                        result = \${functionName}(...input);
                    } else {
                        result = \${functionName}(input);
                    }
                    
                    return result;
                })();
            \`;
            
            const actual = new Function(wrappedCode)();
            const actualStr = String(actual).trim();
            const expectedStr = String(test.expected).trim();
            
            return {
                input: test.input,
                expected: test.expected,
                actual: actualStr,
                pass: actualStr === expectedStr
            };
        }
    `;
}