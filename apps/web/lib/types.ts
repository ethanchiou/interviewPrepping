/**
 * Type definitions for Interview Simulator frontend
 */

export interface Question {
    id: string;
    title: string;
    difficulty: string;
    company_mode: string;
    prompt: string;
    starter_code: string | null;
    sample_tests: SampleTest[];
}

export interface SampleTest {
    input: string;
    expected: string;
}

export interface QuestionPickResponse {
    question: Question;
}

export interface SessionCreateRequest {
    question_id: string;
    company_mode: string;
    difficulty: string;
}

export interface SessionCreateResponse {
    session_id: string;
    ws_token: string;
}

// WebSocket message types
export interface WSMessage<T = any> {
    type: string;
    ts_ms: number;
    session_id: string;
    payload: T;
}

// Client -> Server payloads
export interface ClientReadyPayload {
    client_version: string;
    ui_lang: string;
}

export interface TranscriptPayload {
    text: string;
    is_final: boolean;
}

export interface StateChangePayload {
    from: string;
    to: string;
}

export interface CodeSnapshotPayload {
    language: string;
    code: string;
    cursor: {
        line: number;
        col: number;
    };
}

export interface RunResultPayload {
    passed: boolean;
    results: TestResult[];
}

export interface TestResult {
    input: string;
    expected: string;
    actual: string;
    pass: boolean;
}

// Server -> Client payloads
export interface InterviewerStreamStartPayload {
    message_id: string;
    role: string;
}

export interface InterviewerStreamDeltaPayload {
    message_id: string;
    delta: string;
}

export interface InterviewerStreamEndPayload {
    message_id: string;
}

export interface CoachNudgePayload {
    id: string;
    severity: "none" | "low" | "medium" | "high";
    text: string;
}

export interface ErrorPayload {
    code: string;
    message: string;
}

// UI state
export type InterviewState =
    | "INTRO"
    | "CLARIFY"
    | "PROBLEM"
    | "CODING"
    | "TESTING"
    | "DONE";

export interface InterviewerMessage {
    id: string;
    text: string;
    timestamp: number;
}

export interface CoachNudge {
    id: string;
    severity: "none" | "low" | "medium" | "high";
    text: string;
    timestamp: number;
}

export interface TranscriptEntry {
    text: string;
    timestamp: number;
    is_final: boolean;
}
