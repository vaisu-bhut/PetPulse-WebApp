import Link from 'next/link';
import { ArrowLeft, CheckCircle, Circle, Clock, Star } from 'lucide-react';

export default function RoadmapPage() {
    return (
        <div className="min-h-screen bg-neutral-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-indigo-600 transition mb-6">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
                    </Link>
                    <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-4">Product Roadmap</h1>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                        We're building the future of pet care. Here's a look at what we've shipped and what's coming next.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Now / In Progress */}
                    <RoadmapSection
                        title="In Progress"
                        icon={<Clock className="h-6 w-6 text-indigo-500" />}
                        items={[
                            { title: "Advanced Behavior Tagging", desc: "Granular classification of pet activities (e.g., eating, sleeping, playing) using multi-modal AI models.", status: "in-progress" },
                            { title: "Mobile App (iOS & Android)", desc: "Native mobile applications for on-the-go monitoring and push notifications.", status: "in-progress" },
                            { title: "Two-Way Audio", desc: "Talk to your pet directly through the browser interface.", status: "in-progress" }
                        ]}
                    />

                    {/* Next Up */}
                    <RoadmapSection
                        title="Next Up (Q2 2026)"
                        icon={<Star className="h-6 w-6 text-orange-500" />}
                        items={[
                            { title: "Vet Connect", desc: "Directly share video clips and health reports with your veterinarian.", status: "planned" },
                            { title: "Multi-Pet Recognition", desc: "Facial recognition to distinguish between multiple pets in the same household.", status: "planned" },
                            { title: "Smart Feeder Integration", desc: "Control compatible smart feeders based on activity levels.", status: "planned" }
                        ]}
                    />

                    {/* Completed */}
                    <RoadmapSection
                        title="Recently Completed"
                        icon={<CheckCircle className="h-6 w-6 text-green-500" />}
                        items={[
                            { title: "Video Playback Library", desc: "Browsable archive of all recorded events.", status: "completed" },
                            { title: "Real-time Alerts", desc: "Instant notifications for critical events.", status: "completed" },
                            { title: "Daily Digests", desc: "Automated AI-generated summary videos.", status: "completed" }
                        ]}
                    />
                </div>

                <div className="mt-16 text-center">
                    <p className="text-neutral-500 mb-4">Have a feature request?</p>
                    <a href="mailto:feedback@petpulse.ai" className="inline-flex items-center justify-center rounded-full bg-white border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 shadow-sm">
                        Submit Feedback
                    </a>
                </div>
            </div>
        </div>
    );
}

function RoadmapSection({ title, icon, items }: { title: string, icon: any, items: { title: string, desc: string, status: string }[] }) {
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
                {icon}
                <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
            </div>
            <div className="divide-y divide-neutral-100">
                {items.map((item, index) => (
                    <div key={index} className="p-6 hover:bg-neutral-50 transition">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                            <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-neutral-600">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Shipped</span>
    }
    if (status === 'in-progress') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Building</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">Planned</span>
}
