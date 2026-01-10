/**
 * Code runner utility that uses Web Worker
 */

import { SampleTest, RunResultPayload } from "./types";

export async function runTests(
    code: string,
    tests: SampleTest[],
    timeout: number = 800
): Promise<RunResultPayload> {
    return new Promise((resolve, reject) => {
        // Create worker from runnerWorker.ts
        const workerCode = `
      ${getWorkerCode()}
    `;

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        // Set timeout to kill worker
        const timeoutId = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error("Code execution timeout"));
        }, timeout + 100); // Add buffer to worker timeout

        worker.onmessage = (event) => {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);

            if (event.data.error) {
                reject(new Error(event.data.message || event.data.error));
            } else {
                resolve({
                    passed: event.data.passed,
                    results: event.data.results,
                });
            }
        };

        worker.onerror = (error) => {
            clearTimeout(timeoutId);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(error);
        };

        // Send test execution command
        worker.postMessage({
            type: "RUN_TESTS",
            code,
            tests,
            timeout,
        });
    });
}

// Inline worker code (to avoid import issues with Next.js)
function getWorkerCode(): string {
    return `
    self.onmessage = (event) => {
      const { type, code, tests, timeout } = event.data;

      if (type !== "RUN_TESTS") {
        return;
      }

      const startTime = Date.now();
      const results = [];

      try {
        const wrappedCode = \`
          \${code}
          
          if (typeof solution !== 'function') {
            throw new Error('You must define a function called "solution"');
          }
          solution;
        \`;

        const solutionFn = eval('(' + wrappedCode + ')');

        for (const test of tests) {
          if (Date.now() - startTime > timeout) {
            self.postMessage({
              error: "TIMEOUT",
              message: \`Execution exceeded \${timeout}ms\`,
            });
            return;
          }

          try {
            const args = JSON.parse(test.input);
            const argsArray = Array.isArray(args) ? args : [args];
            const actual = solutionFn(...argsArray);
            const actualStr = JSON.stringify(actual);
            const expectedObj = JSON.parse(test.expected);
            const expectedStr = JSON.stringify(expectedObj);

            results.push({
              input: test.input,
              expected: test.expected,
              actual: actualStr,
              pass: actualStr === expectedStr,
            });
          } catch (error) {
            results.push({
              input: test.input,
              expected: test.expected,
              actual: \`Error: \${error.message}\`,
              pass: false,
            });
          }
        }

        const allPassed = results.every((r) => r.pass);
        self.postMessage({
          passed: allPassed,
          results,
        });
      } catch (error) {
        self.postMessage({
          error: "RUNTIME_ERROR",
          message: error.message,
        });
      }
    };
  `;
}
