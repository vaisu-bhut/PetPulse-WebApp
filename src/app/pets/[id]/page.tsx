"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { petApi, videoApi, type Pet, type Video } from '@/lib/api';
import { ArrowLeft, Calendar, Save, Trash2, Play } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function PetProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const petId = parseInt(params.id as string);

    const [pet, setPet] = useState<Pet | null>(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', species: '', breed: '', age: 0, bio: '' });
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState<Video[]>([]);
    const [videosLoading, setVideosLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const VIDEOS_PER_PAGE = 6;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchPet = async () => {
            if (user && petId) {
                try {
                    const fetchedPet = await petApi.get(petId);
                    setPet(fetchedPet);
                    setFormData({
                        name: fetchedPet.name,
                        species: fetchedPet.species,
                        breed: fetchedPet.breed,
                        age: fetchedPet.age,
                        bio: fetchedPet.bio,
                    });
                } catch (error) {
                    console.error('Failed to fetch pet:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPet();
    }, [user, petId]);

    useEffect(() => {
        const fetchVideos = async () => {
            if (user && petId) {
                setVideosLoading(true);
                try {
                    const videoData = await videoApi.listPetVideos(petId, currentPage, VIDEOS_PER_PAGE);
                    setVideos(videoData.videos);
                    setTotalPages(Math.ceil(videoData.total / VIDEOS_PER_PAGE));
                } catch (error) {
                    console.error('Failed to fetch videos:', error);
                } finally {
                    setVideosLoading(false);
                }
            }
        };
        fetchVideos();
    }, [user, petId, currentPage, VIDEOS_PER_PAGE]);

    const handleEdit = () => {
        setFormData({
            name: pet?.name || '',
            species: pet?.species || '',
            breed: pet?.breed || '',
            age: pet?.age || 0,
            bio: pet?.bio || '',
        });
        setEditing(true);
    };

    const handleSave = async () => {
        setUpdating(true);
        try {
            const updated = await petApi.update(petId, formData);
            setPet(updated);
            setEditing(false);
        } catch (error: any) {
            alert(error.message || 'Failed to update pet');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${pet?.name}? This cannot be undone.`)) return;
        try {
            await petApi.delete(petId);
            router.push('/pets');
        } catch (error: any) {
            alert(error.message || 'Failed to delete pet');
        }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-white">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (!pet) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <p className="text-white">Pet not found</p>
                    <Link href="/pets" className="text-indigo-400 hover:text-indigo-300">
                        ← Back to Pets
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <Link
                    href="/pets"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Pets
                </Link>

                {/* Header with back button and delete */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{pet.name}</h1>
                        <p className="text-neutral-400 mt-2">{pet.species} • {pet.breed}</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Pet
                    </button>
                </div>

                {/* 2-Column Grid Layout */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Pet Details Card */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 lg:sticky lg:top-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{pet.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Species</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.species}
                                                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        ) : (
                                            <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{pet.species}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Breed</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.breed}
                                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                            />
                                        ) : (
                                            <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{pet.breed}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Age</label>
                                    {editing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    ) : (
                                        <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">{pet.age} years old</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
                                    {editing ? (
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-white px-4 py-3 rounded-lg bg-neutral-900 whitespace-pre-wrap">{pet.bio}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        Added
                                    </label>
                                    <p className="text-white px-4 py-3 rounded-lg bg-neutral-900">
                                        {new Date(pet.created_at).toLocaleDateString()}
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
                                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                            >
                                                <Save className="h-4 w-4" />
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

                    {/* Right Column - Videos, Alerts, Digests */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Videos Section */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Play className="h-5 w-5 text-indigo-400" />
                                Videos
                            </h2>

                            {videosLoading ? (
                                <div className="text-center py-8 rounded-2xl border border-neutral-800 bg-neutral-950">
                                    <p className="text-neutral-400">Loading videos...</p>
                                </div>
                            ) : videos.length === 0 ? (
                                <div className="text-center py-8 rounded-2xl border border-neutral-800 bg-neutral-950">
                                    <Play className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                                    <p className="text-neutral-400">No videos yet</p>
                                    <p className="text-sm text-neutral-500 mt-2">Videos will appear here once processed</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {videos.map((video) => {
                                            const isActive = activeVideoId === video.id;
                                            const moodColor = video.mood === 'Alert and Reactive' ? 'border-red-500/30' :
                                                video.mood === 'Playful' ? 'border-green-500/30' :
                                                    video.mood === 'Calm' ? 'border-blue-500/30' :
                                                        'border-neutral-700';

                                            return (
                                                <div
                                                    key={video.id}
                                                    className={`rounded-lg border ${moodColor} bg-neutral-950 overflow-hidden transition-all ${isActive ? 'ring-2 ring-indigo-500' : ''}`}
                                                >
                                                    {isActive ? (
                                                        // Expanded video player - LIMITED HEIGHT
                                                        <div className="bg-neutral-900 relative max-h-96 flex items-center justify-center">
                                                            <video
                                                                className="w-full max-h-96 object-contain"
                                                                controls
                                                                autoPlay
                                                                preload="auto"
                                                            >
                                                                <source src={`http://localhost:3000/videos/${video.id}/stream`} type="video/mp4" />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                            <button
                                                                onClick={() => setActiveVideoId(null)}
                                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white px-3 py-1 rounded text-sm transition"
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // Compact preview card
                                                        <div
                                                            onClick={() => setActiveVideoId(video.id)}
                                                            className="relative h-[150px] bg-gradient-to-br from-neutral-900 to-neutral-800 cursor-pointer group overflow-hidden"
                                                        >
                                                            {/* Gradient overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                                                            {/* Hover effect */}
                                                            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors z-10" />

                                                            {/* Center play icon */}
                                                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                                                <div className="text-center">
                                                                    <Play className="h-12 w-12 text-white/90 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                                                    <p className="text-white text-sm font-medium">Tap to View</p>
                                                                </div>
                                                            </div>

                                                            {/* Video info at bottom */}
                                                            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                                                <div className="flex items-center justify-between text-xs mb-1">
                                                                    <span className="text-white/80">
                                                                        {new Date(video.created_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                    {video.mood && (
                                                                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/90 backdrop-blur-sm">
                                                                            {video.mood}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Description (always visible) */}
                                                    {video.description && (
                                                        <div className="p-3 border-t border-neutral-800">
                                                            <p className="text-xs text-neutral-400 line-clamp-2">{video.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-6 px-4">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-neutral-400">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {/* End Right Column */}
                </div>
                {/* End Grid */}
            </div>
            {/* End Container */}
        </DashboardLayout>
    );
}
