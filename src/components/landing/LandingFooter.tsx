"use client";

import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function LandingFooter() {
    return (
        <footer className="bg-white border-t border-neutral-200 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
                            <Activity className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-bold text-neutral-900">PetPulse</span>
                    </div>
                    <div className="flex gap-8 text-sm text-neutral-500">
                        <Link href="/roadmap" className="hover:text-indigo-600 transition">Roadmap</Link>
                    </div>
                </div>
                <div className="border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-400">
                    <p>&copy; {new Date().getFullYear()} PetPulse AI. All rights reserved.</p>
                    <p>Made with ❤️ for pets everywhere.</p>
                </div>
            </div>
        </footer>
    );
}
