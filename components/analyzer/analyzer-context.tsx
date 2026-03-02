"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { analyzeRecipe } from "@/lib/analyze";
import { apiAnalyzeUrl, apiAnalyzeImage, apiAnalyzeBarcode, apiSaveAnalyzedRecipe } from "@/lib/api";
import type { AnalyzeResult } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

export type SourceType = "paste" | "link" | "photo" | "barcode" | "live";
export type AnalyzerStep = "select" | "input" | "analyzing" | "result";

export interface SourceData {
    type: SourceType;
    rawText?: string;
    imageUrl?: string;
    barcode?: string;
}

interface AnalyzerState {
    step: AnalyzerStep;
    source: SourceData;
    result: AnalyzeResult | null;
    isAnalyzing: boolean;
    error: string | null;
    memberId: string | undefined;
    saveSuccess: boolean;
}

interface AnalyzerContextValue extends AnalyzerState {
    setStep: (s: AnalyzerStep) => void;
    setSource: (s: SourceData) => void;
    setResult: (r: AnalyzeResult | null) => void;
    setMemberId: (id: string | undefined) => void;
    setError: (msg: string | null) => void;
    runAnalysis: () => Promise<void>;
    handleSave: () => Promise<void>;
    handleClear: () => void;
}

const STORAGE_KEY = "analyzer_shared_state_v3";

// ── Helpers ────────────────────────────────────────────────────────────────

function loadState(): Partial<AnalyzerState> | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveState(state: AnalyzerState) {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                step: state.step,
                source: state.source,
                result: state.result,
                memberId: state.memberId,
            })
        );
    } catch {
        // sessionStorage full or unavailable
    }
}

// ── Context ────────────────────────────────────────────────────────────────

const AnalyzerContext = createContext<AnalyzerContextValue | null>(null);

export function useAnalyzer() {
    const ctx = useContext(AnalyzerContext);
    if (!ctx) throw new Error("useAnalyzer must be used inside <AnalyzerProvider>");
    return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AnalyzerProvider({ children }: { children: ReactNode }) {
    const [step, setStepRaw] = useState<AnalyzerStep>("select");
    const [source, setSourceRaw] = useState<SourceData>({ type: "paste", rawText: "" });
    const [result, setResultRaw] = useState<AnalyzeResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | undefined>();
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Hydrate from sessionStorage on mount
    useEffect(() => {
        const saved = loadState();
        if (saved) {
            if (saved.step) setStepRaw(saved.step);
            if (saved.source) setSourceRaw(saved.source);
            if (saved.result) setResultRaw(saved.result);
            if (saved.memberId) setMemberId(saved.memberId);
        }
    }, []);

    // Persist on every meaningful change
    useEffect(() => {
        saveState({ step, source, result, isAnalyzing, error, memberId, saveSuccess });
    }, [step, source, result, memberId, isAnalyzing, error, saveSuccess]);

    const setStep = useCallback((s: AnalyzerStep) => setStepRaw(s), []);

    const setSource = useCallback((s: SourceData) => {
        setSourceRaw(s);
        setError(null);
    }, []);

    const setResult = useCallback((r: AnalyzeResult | null) => {
        setResultRaw(r);
        setSaveSuccess(false);
    }, []);

    const handleClear = useCallback(() => {
        setStepRaw("select");
        setSourceRaw({ type: "paste", rawText: "" });
        setResultRaw(null);
        setError(null);
        setSaveSuccess(false);
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    const runAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        setStepRaw("analyzing");
        setError(null);
        setSaveSuccess(false);

        try {
            let analyzed: AnalyzeResult;
            const text = source.rawText?.trim() || "";
            const hasImage = !!source.imageUrl;
            const hasBarcode = !!source.barcode;

            if (source.type === "photo" && hasImage) {
                analyzed = await apiAnalyzeImage(source.imageUrl!, memberId);
            } else if (source.type === "link" && text) {
                analyzed = await apiAnalyzeUrl(text, memberId);
            } else if ((source.type === "barcode" || source.type === "live") && hasBarcode) {
                analyzed = await apiAnalyzeBarcode(source.barcode!, memberId);
            } else if (text) {
                analyzed = await analyzeRecipe(text, memberId);
            } else {
                throw new Error("No input provided — paste text, upload a photo, or scan a barcode.");
            }

            setResultRaw(analyzed);
            setStepRaw("result");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            console.error("[AnalyzerContext] Analysis failed:", message);
            setError(message);
            setStepRaw("input"); // Go back to input on error
        } finally {
            setIsAnalyzing(false);
        }
    }, [source, memberId]);

    const handleSave = useCallback(async () => {
        if (!result) return;
        setSaveSuccess(false);
        setError(null);
        try {
            await apiSaveAnalyzedRecipe(result);
            setSaveSuccess(true);
        } catch (err) {
            console.error("Save failed:", err);
            const message = err instanceof Error ? err.message : "Failed to save recipe";
            setError(message);
        }
    }, [result]);

    return (
        <AnalyzerContext.Provider
            value={{
                step, setStep,
                source, setSource,
                result, setResult,
                isAnalyzing, error, memberId, saveSuccess,
                setMemberId, setError,
                runAnalysis, handleSave, handleClear,
            }}
        >
            {children}
        </AnalyzerContext.Provider>
    );
}
