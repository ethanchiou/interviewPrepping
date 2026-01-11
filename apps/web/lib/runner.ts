/**
 * Code runner for executing JavaScript code with test cases
 */

import { SampleTest, RunResultPayload, TestResult } from "./types";

export async function runTests(
    code: string,
    tests: SampleTest[]
): Promise<RunResultPayload> {
    const results: TestResult[] = [];
    let allPassed = true;

    for (const test of tests) {
        try {
            const result = await runSingleTest(code, test);
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
            });
            allPassed = false;
        }
    }

    return {
        passed: allPassed,
        results,
    };
}

async function runSingleTest(
    code: string,
    test: SampleTest
): Promise<TestResult> {
    // Create a safe execution environment
    const wrappedCode = `
        ${code}
        
        // Execute the solution function
        const input = ${test.input};
        const result = solution(input);
        return JSON.stringify(result);
    `;

    try {
        // Use Function constructor to execute in isolated scope
        const func = new Function(wrappedCode);
        const actualRaw = func();
        const actual = JSON.parse(actualRaw);
        const expected = JSON.parse(test.expected);

        // Deep equality check
        const pass = JSON.stringify(actual) === JSON.stringify(expected);

        return {
            input: test.input,
            expected: test.expected,
            actual: JSON.stringify(actual),
            pass,
        };
    } catch (error: any) {
        throw new Error(error.message || "Execution failed");
    }
}