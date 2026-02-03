"use client";

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Activity } from 'lucide-react';

export default function LandingNavbar() {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-neutral-900">PetPulse</span>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition">Features</a>
                    <a href="#workflow" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition">How it Works</a>
                    <Link href="/roadmap" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition">Roadmap</Link>
                </nav>
                <div className="flex items-center gap-4">
                    {user ? (
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 shadow-sm hover:shadow"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
