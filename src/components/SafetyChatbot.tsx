import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  Shield,
  Phone,
  AlertTriangle,
  MapPin,
  Users,
  Compass,
  Mic,
  ChevronDown,
  Trash2,
  Lock,
  ChevronUp,
  Brain,
  MessageCircle,
  AlertCircle,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isEmergencyAlert?: boolean;
}

export default function SafetyChatbot() {
  const {
    liveLocation,
    activeSOS,
    activeJourney,
    guardians,
    triggerSOS,
    fakeCallActive,
    setFakeCallActive,
    silentModeEnabled
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nidar_chat_history');
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial welcome message
        const welcome: ChatMessage = {
          id: 'welcome',
          sender: 'assistant',
          text: "Hi, I'm NIDAR AI Assistant.\n\nI can help with safety tips, emergency guidance, app features, and women safety awareness.",
          timestamp: new Date().toISOString()
        };
        setMessages([welcome]);
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
  }, []);

  // Save chat history to localStorage on change
  const saveHistory = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem('nidar_chat_history', JSON.stringify(newMessages));
    } catch (e) {
      console.error("Error storing chat history:", e);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Handle send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Clear alert badge when user is chatting actively
    if (!isOpen || isMinimized) {
      setHasUnread(true);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMsg];
    saveHistory(updatedHistory);
    setInputValue('');

    // Pre-scan keywords client-side to see if immediate emergency guidance is needed
    const lowerText = text.toLowerCase();
    const isEmergencyKeyword = 
      lowerText.includes('help') || 
      lowerText.includes('emergency') || 
      lowerText.includes('danger') || 
      lowerText.includes('sos') || 
      lowerText.includes('unsafe') || 
      lowerText.includes('accident') || 
      lowerText.includes('scared') || 
      lowerText.includes('following me');

    let immediateAlertMsg: ChatMessage | null = null;
    if (isEmergencyKeyword) {
      immediateAlertMsg = {
        id: `emergency-help-${Date.now()}`,
        sender: 'assistant',
        text: `🚨 **IMMEDIATION THREAT ACTION PANEL** 🚨\n\nI detected that you might be in danger. Please follow these directions:\n\n1. 🚶 **Move to Public Spaces**: Locate bright corridors, open shops, cafes, or populated establishments instantly.\n2. 🛡 **Trigger NIDAR SOS**: Click the pink SOS button immediately to alert all ${guardians.length} guardians in live synchronized tracking.\n3. 📞 **Dial Standard Responder Helplines**:\n   - National Emergency helpline: **112**\n   - Women Helpline: **1091**\n   - Cyber Crime: **1930**\n\n*Safety Actions available right now: Use "Fake Call" to deter suspect, or trigger "Sonic Deterrent" Siren in NIDAR features.*`,
        timestamp: new Date().toISOString(),
        isEmergencyAlert: true
      };
      // Append immediate local safety guidance to keep the user secure in real-time
      saveHistory([...updatedHistory, immediateAlertMsg]);
    }

    setIsTyping(true);

    try {
      // Build previous messages context (excluding local client-side extra cards to keep context clean)
      const formattedHistory = (immediateAlertMsg ? [...updatedHistory, immediateAlertMsg] : updatedHistory)
        .filter(m => !m.isEmergencyAlert)
        .slice(-8) // Take last 8 messages to keep token counts small and cheap
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: formattedHistory
        })
      });

      if (!res.ok) {
        throw new Error("Failed to reach NIDAR safety server");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toISOString()
      };

      if (immediateAlertMsg) {
        saveHistory([...updatedHistory, immediateAlertMsg, assistantMsg]);
      } else {
        saveHistory([...updatedHistory, assistantMsg]);
      }

      if (!isOpen || isMinimized) {
        setHasUnread(true);
      }
    } catch (err: any) {
      console.error("Error communicating with NIDAR safety servers:", err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: "I am having trouble connecting to NIDAR offline safety servers. If you are in distress, please call the NIDAR Emergency helpline directly at **112** or activate the **SOS** transmitter immediately.",
        timestamp: new Date().toISOString()
      };
      saveHistory([...updatedHistory, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle chat panel open/close
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    setHasUnread(false);
  };

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm("Reset previous conversation history with NIDAR Assistant?")) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        text: "Hi, I'm NIDAR AI Assistant.\n\nI can help with safety tips, emergency guidance, app features, and women safety awareness.",
        timestamp: new Date().toISOString()
      };
      saveHistory([welcome]);
    }
  };

  const suggestions = [
    { label: '📍 Share Location', query: "Show me my current location address details and coordinates." },
    { label: '🚨 How SOS Works', query: "How does the NIDAR SOS feature work to protect me?" },
    { label: '📞 Help Helplines', query: "List standard Indian rescue and safety emergency numbers." },
    { label: '🛡 Safety Tips', query: "Give me helpful women safety tips for late night commute and self-defense." },
    { label: '👥 Manage Guardians', query: "How do I add or manage my emergency guardians in NIDAR?" },
    { label: '🚶 Safe Journey Guide', query: "How does Route Track and deviation monitoring protect my walking journeys?" },
    { label: '🎤 Voice SOS Help', query: "How do I use Voice SOS control trigger with phrases?" }
  ];

  // Specific handler to execute action query immediately
  const handleSuggestionClick = (query: string) => {
    // If it is location, we can augment with real live GPS details!
    let augmentedQuery = query;
    if (query.includes("current location")) {
      augmentedQuery = `I am currently located near ${liveLocation?.address?.street || 'Unspecified location'}, ${liveLocation?.address?.area || 'Searching Coordinates...'}, ${liveLocation?.address?.city || ''}. Latitude: ${liveLocation?.lat?.toFixed(6) || 'NA'}, Longitude: ${liveLocation?.lng?.toFixed(6) || 'NA'}. Tell me if my environmental parameters are safe.`;
    }
    handleSendMessage(augmentedQuery);
  };

  return (
    <div id="nidar-safety-chatbot-wrapper" className="fixed bottom-24 right-4 z-50 max-w-[calc(105vw-2rem)] select-none">
      <AnimatePresence>
        {!isOpen && (
          /* Floating Action Button */
          <motion.button
            id="chatbot-fab"
            onClick={toggleOpen}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF5A7A] to-[#6366F1] text-white shadow-2xl flex items-center justify-center relative cursor-pointer outline-none border border-white/20 select-none"
            style={{ boxShadow: '0 10px 25px -5px rgba(255, 90, 122, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.4)' }}
            title="Chat with NIDAR AI Assistant"
          >
            {/* Soft pulsing halo background */}
            <span className="absolute inset-0 rounded-full bg-[#FF5A7A]/30 animate-ping" style={{ animationDuration: '2.5s' }} />
            
            <MessageCircle className="w-6 h-6 shrink-0 relative z-10" />
            
            {/* Active alert indicator */}
            {hasUnread && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center text-[8px] font-black font-sans text-white">
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, scale: 0.85, y: 100 }}
            animate={
              isMinimized
                ? { opacity: 1, scale: 0.95, y: 380, height: '62px' }
                : isExpanded
                ? { opacity: 1, scale: 1, y: 0, height: '600px' }
                : { opacity: 1, scale: 1, y: 0, height: '460px' }
            }
            exit={{ opacity: 0, scale: 0.85, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`w-85 sm:w-96 rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative ${
              isExpanded ? 'max-h-[calc(100vh-140px)]' : 'max-h-[500px]'
            }`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF5A7A] to-[#6366F1] px-4 py-3.5 flex items-center justify-between text-white shadow-md relative z-10">
              <div className="flex items-center space-x-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/10 shrink-0 relative">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight leading-none flex items-center space-x-1">
                    <span>NIDAR AI Assistant</span>
                    <Sparkles className="w-2.5 h-2.5 text-pink-200 fill-pink-200/20" />
                  </h4>
                  <p className="text-[9px] text-white/80 font-semibold leading-none mt-1">Ready to Assist • Secure Connection</p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center space-x-1 shrink-0">
                {/* Minimize toggles between minimized state */}
                <button
                  id="chatbot-ctrl-minimize"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 px-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white"
                  title={isMinimized ? "Restore" : "Minimize"}
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expand / Toggles taller mode */}
                {!isMinimized && (
                  <button
                    id="chatbot-ctrl-expand"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                )}

                {/* Clear local chat context */}
                <button
                  id="chatbot-ctrl-clear"
                  onClick={handleClearHistory}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/90 hover:text-white transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close back to FAB button */}
                <button
                  id="chatbot-ctrl-close"
                  onClick={toggleOpen}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content Body (Visible context when NOT minimized) */}
            <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50/50 ${isMinimized ? 'hidden' : 'block'}`}>
              
              {/* Message scroll log wrapper */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 font-sans text-left">
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
                    >
                      {/* Optional subtle sender badge */}
                      <span className="text-[8px] font-bold text-slate-400 font-mono mb-1 px-1">
                        {isUser ? 'YOU' : 'NIDAR SENTINEL'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                          m.isEmergencyAlert
                            ? 'bg-red-50 border border-red-200 text-slate-800'
                            : isUser
                            ? 'bg-gradient-to-r from-[#FF5A7A] to-[#FF7A59] text-white rounded-br-none'
                            : 'bg-white border border-slate-100 text-slate-805 rounded-bl-none'
                        }`}
                      >
                        {/* Render simple basic text helper or list styles */}
                        <div className="whitespace-pre-line select-text">
                          {m.text.split('\n').map((line, idx) => {
                            // Check bold markers: **text**
                            if (line.includes('**')) {
                              const regex = /\*\*(.*?)\*\*/g;
                              const parts = line.split(regex);
                              return (
                                <p key={idx} className="mb-1 leading-normal">
                                  {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-slate-900">{p}</strong> : p)}
                                </p>
                              );
                            }
                            return <p key={idx} className="mb-1 leading-normal">{line}</p>;
                          })}
                        </div>

                        {/* If it is an emergency card, add specialized action buttons */}
                        {m.isEmergencyAlert && (
                          <div className="mt-3 pt-2.5 border-t border-red-200/50 flex flex-col space-y-1.5 font-sans font-bold">
                            <button
                              onClick={() => {
                                triggerSOS('Chat Assistant Quick Crisis Trigger');
                                toggleOpen();
                              }}
                              className="w-full text-center py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] uppercase font-black tracking-wider animate-pulse flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>ACTIVATE NIDAR SOS NOW</span>
                            </button>
                            <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                              <a
                                href="tel:112"
                                className="bg-slate-900 text-white hover:bg-slate-800 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1 shrink-0"
                              >
                                <Phone className="w-3 h-3 text-red-400" />
                                <span>Call Helpline 112</span>
                              </a>
                              <button
                                onClick={() => {
                                  setFakeCallActive(true);
                                  toggleOpen();
                                }}
                                className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1"
                              >
                                <Phone className="w-3 h-3 text-indigo-200" />
                                <span>Fake Call Rescue</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator Bubble */}
                {isTyping && (
                  <div className="flex flex-col items-start animate-pulse">
                    <span className="text-[8px] font-bold text-slate-400 font-mono mb-1 px-1">NIDAR ASSISTANT TYPING...</span>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-[#FF5A7A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#FF5A7A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions quick action rail */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 shrink-0 select-none overflow-x-auto whitespace-nowrap scrollbar-none flex items-center space-x-2">
                {suggestions.map((sug, id) => (
                  <button
                    key={id}
                    onClick={() => handleSuggestionClick(sug.query)}
                    className="inline-block px-3 py-1.5 bg-white hover:bg-[#FF5A7A]/5 active:bg-[#FF5A7A]/10 border border-slate-200 hover:border-[#FF5A7A]/30 rounded-xl text-[10px] font-bold text-slate-700 hover:text-[#FF5A7A] transition-all shrink-0 cursor-pointer"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form panel */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputValue.trim()) {
                    handleSendMessage(inputValue);
                  }
                }}
                className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 relative z-10 shrink-0"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask NIDAR AI safety questions..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white focus:ring-1 focus:ring-[#FF5A7A]/30 border border-slate-200 hover:border-slate-300 focus:border-[#FF5A7A] rounded-2xl outline-none transition-all placeholder-slate-400 font-semibold"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-[#FF5A7A] to-[#6366F1] hover:shadow-md text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-103 transition-all cursor-pointer border border-white/10 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Minimized Tray Cover */}
            {isMinimized && (
              <div
                onClick={() => setIsMinimized(false)}
                className="absolute inset-[62px] top-[60px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 cursor-pointer font-bold text-[10px] z-20 text-center select-none uppercase tracking-wider"
              >
                📥 CLICK HEADER TO RESTORE PANEL CONTEXT
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
