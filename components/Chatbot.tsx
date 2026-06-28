import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { ChatMessage, FullLocationData } from '../types';
import { generateChatResponse } from '../services/gemini';

interface ChatbotProps {
  locationData: FullLocationData | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ locationData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am AirSense AI. Ask me anything about the air quality in your area, health advice, or weather trends.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const contextStr = locationData ? `
      Location: ${locationData.weather.location_name}
      Temp: ${locationData.weather.temp}°C
      Humidity: ${locationData.weather.humidity}%
      AQI Index: ${locationData.air.aqi} (1=Good, 5=Hazardous)
      PM2.5: ${locationData.air.pm2_5}
      PM10: ${locationData.air.pm10}
      CO: ${locationData.air.co}
      NO2: ${locationData.air.no2}
    ` : "User hasn't shared location yet.";

    const responseText = await generateChatResponse(userMsg.text, contextStr);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl text-white hover:scale-110 transition-transform ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Interface */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-80 max-w-[90vw] md:w-96 h-[500px] glass-panel bg-slate-900 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 transform origin-bottom-right border border-white/20 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-1.5 rounded-lg">
              <Bot size={18} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">AirSense Assistant</h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-200 rounded-bl-none'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 bg-white/5 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about air quality..."
              className="flex-grow bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;