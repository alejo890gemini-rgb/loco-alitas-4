import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem, Table, Sale, InventoryItem } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { XIcon, SendIcon, ChatBotIcon } from './Icons';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    tables: Table[];
    sales: Sale[];
    inventory: InventoryItem[];
}

interface Message {
    role: 'user' | 'bot';
    text: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, menuItems, tables, sales, inventory }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ role: 'bot', text: '¡Hola! Soy LocoBot, tu asistente de IA. ¿En qué puedo ayudarte hoy?' }]);
        }
    }, [isOpen, messages.length]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponseText = await getChatbotResponse(input, {
                menu: menuItems,
                tables,
                sales,
                inventory,
            });
            const botMessage: Message = { role: 'bot', text: botResponseText };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'bot', text: 'Oops, algo salió mal. Inténtalo de nuevo.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-full max-h-[600px] z-50 flex flex-col">
            <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl flex flex-col h-full border border-[var(--card-border)]">
                <header className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                        <ChatBotIcon className="w-7 h-7 text-[var(--primary-red)]"/>
                        <h2 className="text-lg font-bold text-white">Asistente LocoBot</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-white/10">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-[var(--primary-red)] text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white/10 text-gray-200 rounded-bl-none">
                                <p className="text-sm animate-pulse">Pensando...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-[var(--card-border)]">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Pregúntale a LocoBot..."
                            className="w-full p-3 pr-12 rounded-lg bg-black/20 border-[var(--card-border)] focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] text-white placeholder-gray-500"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-400 hover:text-[var(--primary-red)] disabled:opacity-50">
                           <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};