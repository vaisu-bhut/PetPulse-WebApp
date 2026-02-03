"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { videoApi, type Video, type VideoListResponse } from '@/lib/api';
import { Calendar, ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function VideoLibraryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [videoData, setVideoData] = useState<VideoListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Video Playback State
    const [activeVideo, setActiveVideo] = useState<Video | null>(null);
    const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Cleanup blob URL
    useEffect(() => {
        return () => {
            if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
        };
    }, [videoBlobUrl]);

    const handlePlayVideo = async (video: Video) => {
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
            alert("Failed to load video.");
            setActiveVideo(null);
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
        if (!mood) return 'bg-neutral-50 text-neutral-500 border-neutral-200';

        const moodLower = mood.toLowerCase();
        if (moodLower.includes('happy') || moodLower.includes('playful')) {
            return 'bg-green-50 text-green-700 border-green-200';
        } else if (moodLower.includes('calm') || moodLower.includes('relaxed')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (moodLower.includes('anxious') || moodLower.includes('stressed')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (moodLower.includes('aggressive') || moodLower.includes('agitated')) {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        return 'bg-neutral-50 text-neutral-500 border-neutral-200';
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                    <div className="text-neutral-900">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    const groupedVideos = videoData ? groupVideosByDate(videoData.videos) : {};
    const totalPages = videoData ? Math.ceil(videoData.total / perPage) : 0;

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Video Library</h1>
                        <p className="text-neutral-500 mt-2">Watch and review your pet's video clips</p>
                    </div>
                    {videoData && videoData.total > 0 && (
                        <div className="text-sm text-neutral-500 font-medium bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
                            {videoData.total} total {videoData.total === 1 ? 'video' : 'videos'}
                        </div>
                    )}
                </div>

                {!videoData || videoData.videos.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-200 bg-white shadow-sm max-w-2xl mx-auto">
                        <Play className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-900 text-lg font-medium">No videos yet</p>
                        <p className="text-sm text-neutral-500 mt-2">Videos will appear here once they're processed</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-12 mb-8">
                            {Object.entries(groupedVideos).map(([dateKey, petGroups]) => (
                                <div key={dateKey}>
                                    <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-2">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-xl font-bold text-neutral-900">{dateKey}</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {Object.entries(petGroups).map(([petId, videos]) => {
                                            return (
                                                <div key={petId} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                                                    <Link
                                                        href={`/pets/${petId}`}
                                                        className="flex items-center gap-3 mb-6 hover:opacity-80 transition group w-fit"
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition">
                                                            <span className="text-indigo-600 font-bold text-sm">
                                                                #{petId}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-neutral-900 group-hover:text-indigo-600 transition">Pet #{petId}</h3>
                                                            <p className="text-sm text-neutral-500">
                                                                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                                                            </p>
                                                        </div>
                                                    </Link>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                        {videos.map((video) => (
                                                            <div key={video.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden hover:border-indigo-300 hover:shadow-md transition group h-full flex flex-col">
                                                                <div
                                                                    className="aspect-video bg-neutral-900 relative cursor-pointer group-hover:opacity-95 transition"
                                                                    onClick={() => handlePlayVideo(video)}
                                                                >
                                                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                                                        <div className="bg-white/90 p-2 rounded-full shadow-lg group-hover:scale-110 transition">
                                                                            <Play className="h-4 w-4 text-indigo-600 ml-0.5" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                                        <p className="text-[10px] text-white font-medium truncate">{video.description || "No description"}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 flex-1">
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="text-[10px] font-medium text-neutral-500">
                                                                            {new Date(video.created_at).toLocaleTimeString('en-US', {
                                                                                hour: 'numeric',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                        {video.mood && (
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getMoodColor(video.mood)}`}>
                                                                                {video.mood}
                                                                            </span>
                                                                        )}
                                                                    </div>
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
                            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
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
                                                className={`rounded-lg px-4 py-2 text-sm font-medium transition shadow-sm ${page === pageNum
                                                    ? 'bg-indigo-600 text-white border border-indigo-600'
                                                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    {totalPages > 5 && <span className="text-neutral-400">...</span>}
                                </div>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

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
