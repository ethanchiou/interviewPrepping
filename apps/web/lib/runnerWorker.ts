/**
 * Web Worker for running user code in isolation
 * This file will be loaded as a Worker
 */

interface TestCase {
    input: string;
    expected: string;
}

interface TestResult {
    input: string;
    expected: string;
    actual: string;
    pass: boolean;
}

interface WorkerMessage {
    type: "RUN_TESTS";
    code: string;
    tests: TestCase[];
    timeout: number;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type, code, tests, timeout } = event.data;

    if (type !== "RUN_TESTS") {
        return;
    }

    const startTime = Date.now();
    const results: TestResult[] = [];

    try {
        // Execute user code in isolated scope
        // User must define a function called 'solution'
        const wrappedCode = `
      ${code}
      
      // Return the solution function
      if (typeof solution !== 'function') {
        throw new Error('You must define a function called "solution"');
      }
      solution;
    `;

        // eslint-disable-next-line no-eval
        const solutionFn = eval(`(${wrappedCode})`);

        // Run each test
        for (const test of tests) {
            // Check timeout
            if (Date.now() - startTime > timeout) {
                self.postMessage({
                    error: "TIMEOUT",
                    message: `Execution exceeded ${timeout}ms`,
                });
                return;
            }

            try {
                // Parse input as JSON array of arguments
                const args = JSON.parse(test.input);
                const argsArray = Array.isArray(args) ? args : [args];

                // Call solution function
                const actual = solutionFn(...argsArray);

                // Compare with expected
                const actualStr = JSON.stringify(actual);
                const expectedObj = JSON.parse(test.expected);
                const expectedStr = JSON.stringify(expectedObj);

                results.push({
                    input: test.input,
                    expected: test.expected,
                    actual: actualStr,
                    pass: actualStr === expectedStr,
                });
            } catch (error: any) {
                results.push({
                    input: test.input,
                    expected: test.expected,
                    actual: `Error: ${error.message}`,
                    pass: false,
                });
            }
        }

        // Send results back
        const allPassed = results.every((r) => r.pass);
        self.postMessage({
            passed: allPassed,
            results,
        });
    } catch (error: any) {
        self.postMessage({
            error: "RUNTIME_ERROR",
            message: error.message,
        });
    }
};

// Prevent importing from main thread
export { };
