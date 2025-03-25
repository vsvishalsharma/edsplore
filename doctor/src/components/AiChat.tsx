import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { getUserAgent } from '../lib/database';
import { generatePrompt } from '../utils/promptHandler';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export default function AiChat() {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedInitialMessage = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial context from questionnaire data
  useEffect(() => {
    const loadInitialContext = async () => {
      if (!user?.uid || hasLoadedInitialMessage.current) return;

      try {
        const userAgent = await getUserAgent(user.uid);
        if (userAgent?.questionnaireData) {
          const prompt = generatePrompt(userAgent.questionnaireData);
          setSystemPrompt(prompt);

          // Add initial greeting message from assistant
          const greeting = {
            id: `greeting_${Date.now()}`,
            role: 'assistant' as const,
            content: userAgent.questionnaireData.clinicInfo.useClinicNameInGreeting === "true"
              ? `Hello, I'm ${userAgent.questionnaireData.language?.agentName || 'Alex'} from ${userAgent.questionnaireData.clinicInfo.clinicName}. How may I assist you today?`
              : `Hello, I'm ${userAgent.questionnaireData.language?.agentName || 'Alex'}. How may I assist you today?`,
            timestamp: new Date()
          };
          setMessages([greeting]);
          hasLoadedInitialMessage.current = true;
        }
      } catch (error) {
        console.error('Error loading initial context:', error);
        setError('Failed to load chat context');
      }
    };

    loadInitialContext();
  }, [user]);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: generateMessageId(),
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage.content
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message) {
        const assistantMessage = {
          id: generateMessageId(),
          role: 'assistant' as const,
          content: data.choices[0].message.content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (messageId: string) => {
    try {
      setMessages(prev => {
        const messageIndex = prev.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) return prev;
        
        // If this is a user message, remove it and the next assistant message
        if (prev[messageIndex].role === 'user' && messageIndex + 1 < prev.length) {
          return prev.filter((_, index) => index !== messageIndex && index !== messageIndex + 1);
        }
        
        // If this is an assistant message, remove it and the previous user message
        if (prev[messageIndex].role === 'assistant' && messageIndex > 0) {
          return prev.filter((_, index) => index !== messageIndex && index !== messageIndex - 1);
        }
        
        // If neither condition is met, just remove the single message
        return prev.filter(msg => msg.id !== messageId);
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg font-medium">Loading chat context...</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white backdrop-blur-sm bg-opacity-90'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.role === 'user' && (
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-lg backdrop-blur-sm bg-opacity-90">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring focus:ring-blue-200 pr-12 min-h-[44px] max-h-[150px] py-3 px-4 transition-all duration-200"
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      <style>
        {`
          ::-webkit-scrollbar {
            display: none;
          }
          
          .fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes fadeIn {
            from { 
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}