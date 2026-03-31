'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, LogOut, Settings, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function ChatGPTUI() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Explain React Hooks',
      messages: [],
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Build a Next.js App',
      messages: [],
      createdAt: new Date(),
    },
  ]);

  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Claude. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated response. In a real app, this would come from Claude API.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! How can I assist you?',
        timestamp: new Date(),
      },
    ]);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setCurrentConversationId(remaining[0]?.id || '');
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 border-r border-gray-200 dark:border-neutral-800 flex-col bg-gray-50 dark:bg-neutral-900">
        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="m-4 gap-2 bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          <Plus className="w-4 h-4" />
          New chat
        </Button>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-2 py-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-gray-200 dark:bg-neutral-700'
                    : 'hover:bg-gray-200 dark:hover:bg-neutral-800'
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <span className="text-sm truncate text-gray-900 dark:text-gray-100">
                  {conv.title}
                </span>
                <Trash2
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Menu */}
        <div className="border-t border-gray-200 dark:border-neutral-800 p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  className="m-4 gap-2 bg-white dark:bg-neutral-800"
                >
                  <Plus className="w-4 h-4" />
                  New chat
                </Button>
                <ScrollArea className="flex-1 px-2">
                  <div className="space-y-2 py-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800"
                        onClick={() => setCurrentConversationId(conv.id)}
                      >
                        <span className="text-sm truncate">{conv.title}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentConversation?.title || 'New chat'}
          </h1>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ask me anything or try one of these examples
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        C
                      </div>
                    )}

                    <div
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-bl-none'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-neutral-700 flex-shrink-0" />
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold">
                      C
                    </div>
                    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Claude..."
                className="flex-1 rounded-full border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
