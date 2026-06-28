import React, { useState } from 'react';
import { X, ChevronRight, MapPin, Activity, BarChart3, MessageSquare, CheckCircle2 } from 'lucide-react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            title: "Welcome to AirSense Pro",
            description: "Your personal air quality monitoring assistant. Let's take a quick tour of the features.",
            icon: <Activity size={64} className="text-blue-400" />,
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: "Live Air Quality",
            description: "Get real-time AQI updates, pollutant details, and weather conditions for your exact location.",
            icon: <MapPin size={64} className="text-green-400" />,
            color: "from-green-500 to-emerald-500"
        },
        {
            title: "Smart Analysis",
            description: "View detailed charts, historical trends, and AI-powered health recommendations.",
            icon: <BarChart3 size={64} className="text-purple-400" />,
            color: "from-purple-500 to-pink-500"
        },
        {
            title: "AI Assistant",
            description: "Chat with our AI to ask specific questions about air quality, health, or the environment.",
            icon: <MessageSquare size={64} className="text-orange-400" />,
            color: "from-orange-500 to-red-500"
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center text-center p-8 pt-12">

                    {/* Icon Circle */}
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${steps[currentStep].color} p-1 mb-8 shadow-lg transition-all duration-500`}>
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${steps[currentStep].color} opacity-20`}></div>
                            {steps[currentStep].icon}
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 transition-all duration-300">
                        {steps[currentStep].title}
                    </h2>

                    <p className="text-slate-300 text-lg leading-relaxed min-h-[80px] transition-all duration-300">
                        {steps[currentStep].description}
                    </p>
                </div>

                {/* Footer / Navigation */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">

                    {/* Dots Indicator */}
                    <div className="flex gap-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
                            >
                                Back
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>Get Started <CheckCircle2 size={18} /></>
                            ) : (
                                <>Next <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TutorialModal;
