import React, { useState } from 'react';
import { Globe, Check, X } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from './LanguageContext';

interface LanguageSelectorProps {
    compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = LANGUAGES[language];

    const handleSelect = (code: LanguageCode) => {
        setLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 ${compact
                        ? 'p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/5'
                        : 'px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10'
                    } transition-all`}
                title={t.selectLanguage}
            >
                <Globe size={compact ? 18 : 16} className="text-blue-400" />
                {!compact && (
                    <span className="text-sm text-slate-300">
                        {currentLang.flag} {currentLang.native}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[999]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Language List */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Globe size={16} className="text-blue-400" />
                                {t.selectLanguage}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {/* Indian Languages */}
                            <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                🇮🇳 Indian Languages
                            </div>
                            {(['hi', 'ta', 'te', 'bn', 'mr', 'kn'] as LanguageCode[]).map((code) => {
                                const lang = LANGUAGES[code];
                                const isSelected = language === code;
                                return (
                                    <button
                                        key={code}
                                        onClick={() => handleSelect(code)}
                                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white">{lang.native}</div>
                                                <div className="text-xs text-slate-500">{lang.name}</div>
                                            </div>
                                        </div>
                                        {isSelected && <Check size={16} className="text-blue-400" />}
                                    </button>
                                );
                            })}

                            {/* International Languages */}
                            <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                🌍 International Languages
                            </div>
                            {(['en', 'es', 'fr', 'zh', 'ar'] as LanguageCode[]).map((code) => {
                                const lang = LANGUAGES[code];
                                const isSelected = language === code;
                                return (
                                    <button
                                        key={code}
                                        onClick={() => handleSelect(code)}
                                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <div className="text-left">
                                                <div className="text-sm font-medium text-white">{lang.native}</div>
                                                <div className="text-xs text-slate-500">{lang.name}</div>
                                            </div>
                                        </div>
                                        {isSelected && <Check size={16} className="text-blue-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSelector;
