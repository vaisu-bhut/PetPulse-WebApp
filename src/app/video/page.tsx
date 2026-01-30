"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { videoApi, type Video, type VideoListResponse } from '@/lib/api';
import { Calendar, ChevronLeft, ChevronRight, Play } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function VideoLibraryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [videoData, setVideoData] = useState<VideoListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchVideos = async () => {
            if (user) {
                setLoading(true);
                try {
                    const data = await videoApi.listUserVideos(page, perPage);
                    setVideoData(data);
                } catch (error) {
                    console.error('Failed to fetch videos:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchVideos();
    }, [user, page]);

    // Group videos by date
    const groupVideosByDate = (videos: Video[]) => {
        const groups: { [key: string]: { [petId: number]: Video[] } } = {};

        videos.forEach((video) => {
            const date = new Date(video.created_at);
            const dateKey = formatDateKey(date);

            if (!groups[dateKey]) {
                groups[dateKey] = {};
            }

            if (!groups[dateKey][video.pet_id]) {
                groups[dateKey][video.pet_id] = [];
            }

            groups[dateKey][video.pet_id].push(video);
        });

        return groups;
    };

    const formatDateKey = (date: Date): string => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const getMoodColor = (mood: string | null) => {
        if (!mood) return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

        const moodLower = mood.toLowerCase();
        if (moodLower.includes('happy') || moodLower.includes('playful')) {
            return 'bg-green-500/10 text-green-400 border-green-500/20';
        } else if (moodLower.includes('calm') || moodLower.includes('relaxed')) {
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        } else if (moodLower.includes('anxious') || moodLower.includes('stressed')) {
            return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        } else if (moodLower.includes('aggressive') || moodLower.includes('agitated')) {
            return 'bg-red-500/10 text-red-400 border-red-500/20';
        }
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center bg-neutral-900">
                    <div className="text-white">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    const groupedVideos = videoData ? groupVideosByDate(videoData.videos) : {};
    const totalPages = videoData?.total_pages || 0;

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Video Library</h1>
                        <p className="text-neutral-400">Watch and review your pet's video clips</p>
                    </div>
                    {videoData && videoData.total > 0 && (
                        <div className="text-sm text-neutral-400">
                            {videoData.total} total {videoData.total === 1 ? 'video' : 'videos'}
                        </div>
                    )}
                </div>

                {!videoData || videoData.videos.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-800 bg-neutral-950">
                        <Play className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400 mb-4">No videos yet</p>
                        <p className="text-sm text-neutral-500">Videos will appear here once they're processed</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-8 mb-8">
                            {Object.entries(groupedVideos).map(([dateKey, petGroups]) => (
                                <div key={dateKey}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Calendar className="h-5 w-5 text-indigo-400" />
                                        <h2 className="text-xl font-semibold text-white">{dateKey}</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {Object.entries(petGroups).map(([petId, videos]) => {
                                            const pet = videos[0]?.pet;
                                            return (
                                                <div key={petId} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
                                                    <Link
                                                        href={`/pets/${petId}`}
                                                        className="flex items-center gap-3 mb-4 hover:text-indigo-400 transition"
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                            <span className="text-indigo-400 font-bold">
                                                                {pet?.name?.[0]?.toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-white">{pet?.name || 'Unknown Pet'}</h3>
                                                            <p className="text-sm text-neutral-400">
                                                                {pet?.species} • {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                                                            </p>
                                                        </div>
                                                    </Link>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {videos.map((video) => (
                                                            <div key={video.id} className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden hover:border-indigo-500/50 transition">
                                                                <div className="aspect-video bg-neutral-800 relative">
                                                                    <video
                                                                        className="w-full h-full object-contain"
                                                                        controls
                                                                        preload="none"
                                                                        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23262626'/%3E%3Ctext x='50' y='50' font-family='sans-serif' font-size='40' fill='%23525252' text-anchor='middle' dominant-baseline='middle'%3E▶%3C/text%3E%3C/svg%3E"
                                                                    >
                                                                        <source src={`http://localhost:3000/videos/${video.id}/stream`} type="video/mp4" />
                                                                        Your browser does not support the video tag.
                                                                    </video>
                                                                </div>
                                                                <div className="p-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs text-neutral-500">
                                                                            {new Date(video.created_at).toLocaleTimeString('en-US', {
                                                                                hour: 'numeric',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                        {video.mood && (
                                                                            <span className={`text-xs px-2 py-0.5 rounded border ${getMoodColor(video.mood)}`}>
                                                                                {video.mood}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {video.description && (
                                                                        <p className="text-xs text-neutral-400 line-clamp-2">{video.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${page === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'border border-neutral-800 bg-neutral-950 text-white hover:bg-neutral-900'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && <span className="text-neutral-500">...</span>}
                                </div>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
