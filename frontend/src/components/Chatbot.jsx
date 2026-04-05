import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I am the AI Scheme Assistant. How can I help you find eligible schemes today?" }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const previousMessages = messages.filter(m => m.role !== 'system');
            
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage.content, previousMessages })
            });

            const data = await response.json();
            if (response.ok) {
                setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
            } else if (response.status === 401) {
                setMessages([...updatedMessages, { role: "assistant", content: "Please log in to use the AI assistant." }]);
            } else if (response.status === 403) {
                setMessages([...updatedMessages, { role: "assistant", content: "You do not have access to the AI assistant." }]);
            } else {
                setMessages([...updatedMessages, { role: "assistant", content: data.error || "Sorry, I am facing an issue right now. Try again later." }]);
            }
        } catch (err) {
            console.error("Chat error", err);
            setMessages([...updatedMessages, { role: "assistant", content: "Sorry, could not connect to the server. Please make sure the backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div className="bg-white w-80 h-[28rem] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-green-500 p-4 flex justify-between items-center text-white rounded-t-2xl">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <MessageCircle size={20} /> AI Scheme Guide
                        </h3>
                        <button onClick={toggleChat} className="text-white hover:text-gray-200 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'}`}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-gray-200 text-gray-800 self-start rounded-xl rounded-bl-none max-w-[80%] p-3 text-sm flex gap-1 items-center">
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></span>
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay: "0.2s"}}></span>
                                <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{animationDelay: "0.4s"}}></span>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    <div className="p-3 border-t bg-white flex items-center gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ask about schemes..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button 
                    onClick={toggleChat}
                    className="w-14 h-14 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform duration-300"
                >
                    <MessageCircle size={28} />
                </button>
            )}
        </div>
    );
};

export default Chatbot;
