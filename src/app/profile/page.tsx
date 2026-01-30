"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';
import { Mail, User as UserIcon, Calendar } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';

export default function ProfilePage() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [updating, setUpdating] = useState(false);

    if (!user && !authLoading) {
        router.push('/login');
        return null;
    }

    const handleEdit = () => {
        setFormData({ name: user?.name || '', email: user?.email || '' });
        setEditing(true);
    };

    const handleSave = async () => {
        setUpdating(true);
        try {
            await userApi.updateProfile(formData);
            await refreshUser();
            setEditing(false);
        } catch (error: any) {
            alert(error.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-900">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <h1 className="text-2xl font-semibold text-white mb-8">Profile Settings</h1>

                <div className="max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-20 w-20 rounded-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{user.name[0].toUpperCase()}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                            <p className="text-neutral-400">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                                <UserIcon className="h-4 w-4" />
                                Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                />
                            ) : (
                                <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{user.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                />
                            ) : (
                                <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{user.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                                <Calendar className="h-4 w-4" />
                                Member Since
                            </label>
                            <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">
                                {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            {editing ? (
                                <>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="flex-1 rounded-lg border border-neutral-800 px-4 py-3 font-medium text-white hover:bg-neutral-900 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={updating}
                                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                    >
                                        {updating ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEdit}
                                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 transition"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
