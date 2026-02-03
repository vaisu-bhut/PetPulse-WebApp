"use client";

import { useEffect, useState } from "react";
import { Camera, BrainCircuit, CloudLightning, Smartphone, Check } from "lucide-react";

export default function WorkflowSimulation() {
    const [activeStep, setActiveStep] = useState(0);

    // Cycle through steps: 0 (Camera) -> 1 (AI) -> 2 (Cloud) -> 3 (User)
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4);
        }, 2500); // 2.5 seconds per step
        return () => clearInterval(interval);
    }, []);

    const steps = [
        { id: 0, label: "Capture", icon: Camera, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
        { id: 1, label: "Analyze", icon: BrainCircuit, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
        { id: 2, label: "Process", icon: CloudLightning, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        { id: 3, label: "Alert", icon: Smartphone, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    ];

    return (
        <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden p-8 flex flex-col relative">
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100 z-10">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Pipeline
            </div>

            <div className="py-12 relative flex items-center justify-between px-4 sm:px-12">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-100 -z-10 transform -translate-y-1/2" />

                {/* Animated Data Packet */}
                <div
                    className="absolute top-1/2 -z-0 transform -translate-y-1/2 h-3 w-3 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.8)] transition-all duration-[2500ms] ease-linear"
                    style={{
                        left: `${15 + (activeStep * 24)}%`, // Approximate positions based on flex distribution
                        opacity: activeStep === 3 ? 0 : 1 // Hide when mostly done to reset
                    }}
                />

                {steps.map((step, index) => {
                    const isActive = index === activeStep;
                    const isPast = index < activeStep;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center">
                            {/* Node Circle */}
                            <div
                                className={`
                    relative z-10 flex items-center justify-center rounded-full border-4 transition-all duration-500
                    h-16 w-16 sm:h-20 sm:w-20
                    ${isActive ? `${step.bg} ${step.border} scale-110 shadow-lg` :
                                        isPast ? 'bg-neutral-50 border-neutral-200 opacity-50' : 'bg-white border-white shadow-sm'}
                `}
                            >
                                {isActive && (
                                    <div className={`absolute inset-0 rounded-full opacity-20 animate-ping ${step.bg.replace('bg-', 'bg-')}`} />
                                )}
                                <step.icon
                                    className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-300 ${isActive ? step.color : 'text-neutral-300'}`}
                                />

                                {/* Checkmark for past steps */}
                                {isPast && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <div className={`mt-4 text-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                <p className="font-bold text-neutral-900 text-sm sm:text-base">{step.label}</p>
                                <p className="text-[10px] sm:text-xs text-neutral-500 font-mono mt-1">
                                    {isActive ? 'Processing...' : isPast ? 'Completed' : 'Waiting'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Status Text */}
            <div className="mt-4 text-center h-8">
                <p className="text-sm font-medium text-neutral-600 animate-pulse">
                    {activeStep === 0 && "Ingesting live 1080p video stream..."}
                    {activeStep === 1 && "Running Gemini-1.5-Pro vision model..."}
                    {activeStep === 2 && "Logging 'Barking' event to database..."}
                    {activeStep === 3 && "Pushing notification to user device..."}
                </p>
            </div>
        </div>
    );
}
