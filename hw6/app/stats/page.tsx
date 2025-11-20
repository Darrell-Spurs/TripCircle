'use client';

import { useEffect, useState } from 'react';
import StatsCard from '../components/StatsCard';

interface Stats {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Statistics</h1>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-gray-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
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

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Average Messages per Conversation
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalConversations > 0
                      ? (stats.totalMessages / stats.totalConversations).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Engagement Rate
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalConversations > 0
                      ? ((stats.activeUsers / stats.totalConversations) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-red-800">Failed to load statistics</p>
          </div>
        )}
      </div>
    </main>
  );
}

