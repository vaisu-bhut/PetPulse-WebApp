"use client";

import { Activity, ShieldCheck, Video } from 'lucide-react';

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">Features</h2>
                    <p className="text-3xl font-bold text-neutral-900 sm:text-4xl">Everything you need to stay connected.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Activity className="h-6 w-6 text-white" />}
                        title="Real-time Monitoring"
                        description="Live video streaming with low latency, accessible from anywhere in the world on any device."
                        color="bg-blue-500"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="h-6 w-6 text-white" />}
                        title="Smart Alerts"
                        description="AI-powered detection of unusual behaviors, from excessive barking to distress signals."
                        color="bg-indigo-500"
                    />
                    <FeatureCard
                        icon={<Video className="h-6 w-6 text-white" />}
                        title="Daily Digests"
                        description="Automated video summaries of your pet's day, highlighting key moments and activities."
                        color="bg-violet-500"
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
    return (
        <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-100 hover:shadow-lg transition duration-300">
            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-6 shadow-md`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">{title}</h3>
            <p className="text-neutral-600 leading-relaxed">
                {description}
            </p>
        </div>
    )
}
