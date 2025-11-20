'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchConversation();
      // Refresh every 3 seconds for real-time updates
      const interval = setInterval(fetchConversation, 3000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data);
      } else if (response.status === 404) {
        router.push('/conversations');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">Conversation not found</p>
            <Link
              href="/conversations"
              className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block"
            >
              ← Back to Conversations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/conversations"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
          >
            ← Back to Conversations
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Conversation Details</h1>
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-600">User ID:</span>
                <span className="ml-2 text-gray-900">{conversation.userId}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Total Messages:</span>
                <span className="ml-2 text-gray-900">{conversation.messages.length}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(conversation.createdAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Last Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(conversation.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Message History</h2>
          
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No messages in this conversation yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase">
                        {message.role === 'user' ? '👤 User' : '🤖 Assistant'}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

