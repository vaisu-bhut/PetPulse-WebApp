"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import { petApi, alertApi, videoApi, type Pet, type Alert, type Video as VideoType } from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  PawPrint,
  Play,
  ShieldAlert,
  Video,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPets: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    recentActivityTime: 'N/A'
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [recentVideos, setRecentVideos] = useState<VideoType[]>([]);
  const [severityData, setSeverityData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [activityData, setActivityData] = useState<{ name: string; alerts: number }[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoType | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Cleanup blob URL on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);

  const handlePlayVideo = async (video: VideoType) => {
    setActiveVideo(video);
    setIsVideoLoading(true);
    setVideoBlobUrl(null);

    try {
      const response = await fetch(`/api/videos/${video.id}/stream`);
      if (!response.ok) throw new Error('Failed to load video');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoBlobUrl(url);
    } catch (error) {
      console.error("Video load error:", error);
      alert("Failed to load video. Please try again.");
      setActiveVideo(null); // Close modal on error
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleCloseModal = () => {
    setActiveVideo(null);
    setVideoBlobUrl(null);
    setIsVideoLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Parallel data fetching
        const [pets, alertsData, videosData] = await Promise.all([
          petApi.list(),
          alertApi.listUserAlerts(1, 100), // Get enough for stats
          videoApi.listUserVideos(1, 20) // Get more videos for the list
        ]);

        // 1. Basic Stats
        const totalPets = pets.length;
        const totalAlerts = alertsData.total;
        const criticalAlerts = alertsData.alerts.filter(a => a.severity_level === 'critical').length;
        const recentActivityTime = alertsData.alerts.length > 0
          ? new Date(alertsData.alerts[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'None';

        setStats({ totalPets, totalAlerts, criticalAlerts, recentActivityTime });
        setRecentAlerts(alertsData.alerts.slice(0, 4)); // Show top 4
        setRecentVideos(videosData.videos); // Store all fetched videos

        // 2. Prepare Severity Chart Data
        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        alertsData.alerts.forEach(a => {
          const sev = a.severity_level as keyof typeof severityCounts;
          if (severityCounts[sev] !== undefined) severityCounts[sev]++;
        });

        setSeverityData([
          { name: 'Critical', value: severityCounts.critical, color: '#ef4444' }, // Red
          { name: 'High', value: severityCounts.high, color: '#f97316' },     // Orange
          { name: 'Medium', value: severityCounts.medium, color: '#eab308' },   // Yellow
          { name: 'Low', value: severityCounts.low, color: '#3b82f6' }        // Blue
        ].filter(d => d.value > 0));

        // 3. Prepare Activity Chart Data (Alerts per Day - Last 7 Days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toLocaleDateString(); // "MM/DD/YYYY" or locale format
        }).reverse();

        const alertsPerDay: Record<string, number> = {};
        alertsData.alerts.forEach(a => {
          const date = new Date(a.created_at).toLocaleDateString();
          alertsPerDay[date] = (alertsPerDay[date] || 0) + 1;
        });

        const chartData = last7Days.map(date => ({
          name: date.split('/')[0] + '/' + date.split('/')[1], // Simple MM/DD
          alerts: alertsPerDay[date] || 0
        }));
        setActivityData(chartData);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen bg-neutral-50 text-neutral-500">
          Loading Dashboard...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
            <p className="text-neutral-500">Welcome back, {user?.name}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-green-600 shadow-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            SYSTEM ONLINE
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<PawPrint className="text-indigo-600 h-6 w-6" />}
            label="Total Pets"
            value={stats.totalPets.toString()}
            sub="Registered"
          />
          <StatCard
            icon={<ShieldAlert className="text-red-500 h-6 w-6" />}
            label="Critical Alerts"
            value={stats.criticalAlerts.toString()}
            sub="Require Attention"
          />
          <StatCard
            icon={<Activity className="text-blue-500 h-6 w-6" />}
            label="Total Activity"
            value={stats.totalAlerts.toString()}
            sub="Events Logged"
          />
          <StatCard
            icon={<Clock className="text-neutral-500 h-6 w-6" />}
            label="Last Event"
            value={stats.recentActivityTime}
            sub="Latest Update"
          />
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart: Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Activity Trends (7 Days)
            </h3>
            {/* Only render chart if there is data, else placeholder */}
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#737373', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#737373', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#eff6ff' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="alerts" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Chart: Severity */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alert Distribution
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-neutral-400">No alerts data</div>
              )}
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-xs">
                {severityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-600 font-medium">{item.name}</span>
                    <span className="text-neutral-400">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Alerts List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900">Recent Alerts</h3>
                <Link href="/alerts" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</Link>
              </div>
              <div className="divide-y divide-neutral-100">
                {recentAlerts.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">No recent alerts found.</div>
                ) : (
                  recentAlerts.map(alert => (
                    <div key={alert.id} className="p-4 hover:bg-neutral-50 transition flex items-start gap-4">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${alert.severity_level === 'critical' ? 'bg-red-500' :
                        alert.severity_level === 'high' ? 'bg-orange-500' :
                          alert.severity_level === 'medium' ? 'bg-yellow-400' : 'bg-blue-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-neutral-900">{alert.alert_type}</p>
                          <span className="text-xs text-neutral-400">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-neutral-600 truncate">{alert.message}</p>
                        {/* Pet Name Tag */}
                        <div className="mt-2 flex items-center gap-2">
                          <PawPrint className="h-3 w-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500 font-medium">{alert.pet_name || 'Unknown Pet'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Videos List (Now with Playback Modal) */}
          <div>
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-sm">New Clips</h3>
                <Link href="/video" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">All Videos</Link>
              </div>
              <div className="divide-y divide-neutral-100">
                {recentVideos.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-400">No videos yet.</div>
                ) : (
                  recentVideos.slice(0, 5).map(video => (
                    <div
                      key={video.id}
                      onClick={() => handlePlayVideo(video)}
                      className="p-3 flex gap-3 hover:bg-neutral-50 transition cursor-pointer group"
                    >
                      <div className="h-16 w-24 bg-neutral-900 rounded-lg flex-shrink-0 overflow-hidden relative border border-neutral-200">
                        <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition">
                          <Play className="h-5 w-5 text-white opacity-80" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <p className="text-xs font-medium text-neutral-900 line-clamp-2">{video.description || 'No description'}</p>
                        <span className="text-[10px] text-neutral-400 mt-1">{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Playback Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-black rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl relative border border-neutral-800">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-neutral-800 text-white rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="aspect-video bg-neutral-900 flex items-center justify-center">
                {isVideoLoading ? (
                  <div className="flex flex-col items-center gap-3 text-neutral-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <p className="text-sm font-medium">Fetching video from secure storage...</p>
                  </div>
                ) : videoBlobUrl ? (
                  <video
                    src={videoBlobUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-neutral-500 text-sm">Video unavailable</div>
                )}
              </div>
              <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                <h3 className="text-lg font-bold text-white mb-1">{activeVideo.description || 'Video Clip'}</h3>
                <p className="text-sm text-neutral-400">
                  Captured on {new Date(activeVideo.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-100">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <div className={`h-1.5 w-1.5 rounded-full ${label.includes('Critical') ? 'bg-red-500' : 'bg-green-500'}`} />
        <span className="text-xs text-neutral-500 font-medium">{sub}</span>
      </div>
    </div>
  );
}
