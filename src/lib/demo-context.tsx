"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface DemoStep {
  id: string;
  target: string;        // CSS selector to highlight
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  // ── Actions ──
  navigate?: string;     // URL to navigate to before showing step
  click?: string;        // CSS selector to click before showing step
  scroll?: string;       // CSS selector to scroll into view before showing step
  waitMs?: number;       // ms to wait after action before showing tooltip (default 600)
}

interface DemoContextType {
  isActive: boolean;
  currentStep: number;
  steps: DemoStep[];
  startDemo: (steps: DemoStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endDemo: () => void;
  skipToStep: (index: number) => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [ready, setReady] = useState(true);
  const router = useRouter();

  // Track which step we already executed actions for — prevents re-execution
  // when pathname changes as a side-effect of a click action
  const executedStepRef = useRef<number>(-1);

  function startDemo(newSteps: DemoStep[]) {
    executedStepRef.current = -1;
    setSteps(newSteps);
    setCurrentStep(0);
    setReady(false);
    setIsActive(true);
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setReady(false);
      setCurrentStep((s) => s + 1);
    } else {
      endDemo();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setReady(false);
      executedStepRef.current = -1; // allow re-execution when going back
      setCurrentStep((s) => s - 1);
    }
  }

  function endDemo() {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setReady(true);
    executedStepRef.current = -1;
  }

  function skipToStep(index: number) {
    if (index >= 0 && index < steps.length) {
      setReady(false);
      setCurrentStep(index);
    }
  }

  // Execute actions when step changes — uses ref to prevent duplicate runs
  useEffect(() => {
    if (!isActive || steps.length === 0) return;
    if (executedStepRef.current === currentStep) return; // Already ran this step

    const step = steps[currentStep];
    if (!step) return;

    executedStepRef.current = currentStep;
    let cancelled = false;

    async function runAction() {
      const hasAction = step.navigate || step.click || step.scroll;

      if (!hasAction) {
        // No action — show tooltip immediately with a small delay
        await new Promise(r => setTimeout(r, 200));
        if (!cancelled) setReady(true);
        return;
      }

      // 1. Navigate if needed
      if (step.navigate) {
        router.push(step.navigate);
        await new Promise(r => setTimeout(r, step.waitMs || 800));
        if (cancelled) return;
      }

      // 2. Click if needed
      if (step.click) {
        // Wait for the page to fully render its dynamic content
        await new Promise(r => setTimeout(r, 800));
        if (cancelled) return;

        // Try multiple times to find the element (data may still be loading)
        let clickEl: HTMLElement | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          clickEl = document.querySelector(step.click) as HTMLElement | null;
          if (clickEl) break;
          await new Promise(r => setTimeout(r, 500));
          if (cancelled) return;
        }

        if (clickEl) {
          clickEl.click();
          // Wait for the side-effect navigation to complete
          await new Promise(r => setTimeout(r, step.waitMs || 1500));
        }
        if (cancelled) return;
      }

      // 3. Scroll if needed
      if (step.scroll) {
        await new Promise(r => setTimeout(r, 400));
        if (cancelled) return;

        let scrollEl: HTMLElement | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          scrollEl = document.querySelector(step.scroll) as HTMLElement | null;
          if (scrollEl) break;
          await new Promise(r => setTimeout(r, 500));
          if (cancelled) return;
        }

        if (scrollEl) {
          scrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight effect
          scrollEl.style.transition = "box-shadow 0.3s, outline 0.3s";
          scrollEl.style.outline = "3px solid #6366f1";
          scrollEl.style.boxShadow = "0 0 0 6px rgba(99,102,241,0.15)";
          setTimeout(() => {
            if (scrollEl) {
              scrollEl.style.outline = "";
              scrollEl.style.boxShadow = "";
            }
          }, 3000);
          await new Promise(r => setTimeout(r, step.waitMs || 800));
        }
        if (cancelled) return;
      }

      if (!cancelled) setReady(true);
    }

    runAction();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isActive]);

  return (
    <DemoContext.Provider
      value={{ isActive, currentStep, steps, startDemo, nextStep, prevStep, endDemo, skipToStep }}
    >
      {children}
      {isActive && ready && <DemoOverlay />}
      {isActive && !ready && <DemoLoading />}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

/* ── Loading indicator while navigating ── */
function DemoLoading() {
  return (
    <>
      <div className="fixed inset-0 bg-black/15 z-[9998] transition-opacity duration-300" />
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className="bg-white rounded-2xl shadow-2xl p-5 flex items-center gap-4 animate-scale-in border border-slate-200">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Navegando...</p>
            <p className="text-xs text-slate-500">Preparando la siguiente vista</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Tooltip Overlay Component ── */
function DemoOverlay() {
  const { currentStep, steps, nextStep, prevStep, endDemo } = useDemo();
  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("demo-highlight");
    }
    return () => { if (el) el.classList.remove("demo-highlight"); };
  }, [step]);

  if (!step) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop — semi-transparent so user can SEE the content */}
      <div className="fixed inset-0 bg-black/15 z-[9998] transition-opacity duration-300" />

      {/* Tooltip — fixed bottom-right, never covers main content */}
      <div
        className="fixed z-[9999] animate-scale-in"
        style={{ bottom: 24, right: 24, width: 380 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5">
            {/* Step counter */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                Paso {currentStep + 1} de {steps.length}
              </span>
              <button
                onClick={endDemo}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Saltar tour ✕
              </button>
            </div>

            {/* Content */}
            <h4 className="text-base font-bold text-slate-900 mb-2">{step.title}</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{step.content}</p>

            {/* Action hint */}
            {steps[currentStep + 1] && (steps[currentStep + 1].navigate || steps[currentStep + 1].click || steps[currentStep + 1].scroll) && (
              <div className="mt-3 px-3 py-2 bg-brand-50 rounded-xl border border-brand-100">
                <p className="text-[11px] text-brand-700 font-semibold flex items-center gap-1.5">
                  {(() => {
                    const next = steps[currentStep + 1];
                    if (next.navigate) {
                      const dest = next.navigate === "/dashboard" ? "Dashboard" : next.navigate === "/dashboard/consultas" ? "Consultas" : next.navigate === "/dashboard/inventario" ? "Inventario" : next.navigate === "/dashboard/pacientes" ? "Pacientes" : "la siguiente vista";
                      return `⚡ Siguiente: navegaremos a ${dest}`;
                    }
                    if (next.click) return "⚡ Siguiente: se ejecutara una accion automatica";
                    if (next.scroll) return "⚡ Siguiente: mostraremos la siguiente seccion";
                    return "";
                  })()}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Anterior
              </button>
              <button
                onClick={nextStep}
                className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-600/20 cursor-pointer flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? "✓ Finalizar" : "Siguiente →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
