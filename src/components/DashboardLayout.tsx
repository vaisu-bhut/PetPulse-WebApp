"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Activity,
    LayoutDashboard,
    LogOut,
    PawPrint,
    User,
    Video,
    ShieldAlert
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="flex min-h-screen bg-neutral-900 text-white font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral-800 bg-neutral-950 px-4 py-8">
                <div className="flex items-center gap-2 px-2 pb-8">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">PetPulse</span>
                </div>

                <nav className="space-y-1">
                    <NavItem href="/" icon={<LayoutDashboard />} label="Dashboard" active={pathname === '/'} />
                    <NavItem href="/pets" icon={<PawPrint />} label="My Pets" active={pathname === '/pets'} />
                    <NavItem href="/video" icon={<Video />} label="Video Library" active={pathname === '/video'} />
                    <NavItem href="/alerts" icon={<ShieldAlert />} label="Alerts" active={pathname === '/alerts'} />
                    <NavItem href="/profile" icon={<User />} label="Profile" active={pathname === '/profile'} />
                </nav>

                <div className="absolute bottom-8 left-4 right-4">
                    <div className="rounded-xl bg-neutral-900 p-4 border border-neutral-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center">
                                <span className="text-sm font-medium">{user.name[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium hover:bg-neutral-700 transition"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 w-full">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
        >
            {icon}
            {label}
        </Link>
    );
}
