"use client";

import DashboardLayout from '@/components/DashboardLayout';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  PawPrint,
  Video
} from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <header className="flex items-center justify-between pb-8">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-neutral-400">Welcome back!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-1.5 text-sm text-green-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              System Online
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<PawPrint className="text-indigo-400" />} label="Your Pets" value="0" sub="Total Registered" />
          <StatCard icon={<CheckCircle className="text-green-400" />} label="Status" value="Comfortable" sub="Overall Mood" />
          <StatCard icon={<Clock className="text-blue-400" />} label="Last Activity" value="2m ago" sub="Sleeping" />
          <StatCard icon={<AlertTriangle className="text-amber-400" />} label="Alerts Today" value="3" sub="2 Resolved" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Feed Placeholder */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-neutral-800 bg-black overflow-hidden relative group">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600/90 text-white text-xs font-medium uppercase tracking-wider">Live</span>
                <span className="px-2 py-0.5 rounded bg-black/50 text-white text-xs backdrop-blur">Cam 01</span>
              </div>
              <div className="aspect-video bg-neutral-800 flex items-center justify-center">
                <Video className="h-12 w-12 text-neutral-600" />
              </div>
            </div>
          </div>

          {/* Right Column: Alerts */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Recent Alerts</h3>
                <button className="text-xs text-indigo-400 hover:text-indigo-300">View All</button>
              </div>

              <div className="space-y-4">
                <AlertItem
                  severity="medium"
                  title="Pacing Detected"
                  time="10:42 AM"
                  desc="Repeated movement pattern detected for > 5 mins."
                  action="Intervention: Classical Music Started"
                />
                <AlertItem
                  severity="low"
                  title="Vocalization"
                  time="09:15 AM"
                  desc="Short duration barking/whining observed."
                  action="Logged Only"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-neutral-900 p-2">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-neutral-500">
        <Activity className="h-3 w-3" />
        {sub}
      </div>
    </div>
  );
}

function AlertItem({ severity, title, time, desc, action }: { severity: 'low' | 'medium' | 'critical', title: string, time: string, desc: string, action: string }) {
  const color = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20"
  }[severity];

  return (
    <div className="relative border-l-2 border-neutral-800 pl-4 pb-4 last:pb-0">
      <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-800 border-2 border-neutral-950" />
      <div className={`mb-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${color}`}>
        {severity.toUpperCase()}
      </div>
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <span className="text-xs text-neutral-500">{time}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{desc}</p>
      {action && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400">
          <Activity className="h-3 w-3" />
          {action}
        </div>
      )}
    </div>
  );
}
