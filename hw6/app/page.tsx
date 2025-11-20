'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from './components/StatsCard';

interface Stats {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Dashboard Overview
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Conversations"
              value={stats.totalConversations}
              icon="💬"
              color="blue"
            />
            <StatsCard
              title="Total Messages"
              value={stats.totalMessages}
              icon="📝"
              color="green"
            />
            <StatsCard
              title="Active Users (24h)"
              value={stats.activeUsers}
              icon="👥"
              color="purple"
            />
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">Failed to load statistics</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/conversations"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              View Conversations
            </h2>
            <p className="text-gray-600">
              Browse all conversations with your LINE bot, view message history, and filter by user or date.
            </p>
          </Link>

          <Link
            href="/stats"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Detailed Statistics
            </h2>
            <p className="text-gray-600">
              View comprehensive statistics and analytics about your chatbot usage.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

