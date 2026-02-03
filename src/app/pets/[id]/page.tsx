"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { petApi, videoApi, alertApi, type Pet, type Video, type Alert } from '@/lib/api';
import { ArrowLeft, Calendar, Save, Trash2, Play, AlertTriangle, X, Activity } from "lucide-react";
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
    const VIDEOS_PER_PAGE = 2; // Compact limit

    // Alerts State
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [alertsPage, setAlertsPage] = useState(1);
    const [alertsTotalPages, setAlertsTotalPages] = useState(1);
    const ALERTS_PER_PAGE = 4; // Compact limit

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
        setActiveVideoId(null); // Clear previous inline player if any

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

    useEffect(() => {
        const fetchAlerts = async () => {
            if (user && petId) {
                setAlertsLoading(true);
                try {
                    const data = await alertApi.listPetAlerts(petId, alertsPage, ALERTS_PER_PAGE);
                    setAlerts(data.alerts);
                    setAlertsTotalPages(Math.ceil(data.total / ALERTS_PER_PAGE));
                } catch (error) {
                    console.error('Failed to fetch alerts:', error);
                } finally {
                    setAlertsLoading(false);
                }
            }
        };
        fetchAlerts();
    }, [user, petId, alertsPage]);

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
            <div className="h-[calc(100vh)] flex flex-col p-6 md:p-8 overflow-hidden bg-neutral-50 box-border">
                {/* Header Area - Compact */}
                <div className="flex-none flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/pets"
                            className="flex items-center justify-center p-2 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-indigo-600 hover:border-indigo-200 transition"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                                {pet.name}
                                <span className="text-sm font-normal text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                                    {pet.species}
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - Fills remaining height */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">

                    {/* Quadrant 1: Pet Profile (Edit) */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-neutral-100 flex-none bg-neutral-50/50">
                            <h2 className="font-bold text-neutral-900">Pet Details</h2>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Name</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full text-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-neutral-900">{pet.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Age</label>
                                        {editing ? (
                                            <input
                                                type="number"
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                                                className="w-full text-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-neutral-900">{pet.age} years</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Species</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.species}
                                                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                                className="w-full text-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-neutral-900">{pet.species}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Breed</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.breed}
                                                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                                className="w-full text-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-neutral-900">{pet.breed}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">Attributes & Bio</label>
                                    {editing ? (
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full text-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                                            rows={3}
                                        />
                                    ) : (
                                        <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">{pet.bio || "No bio added."}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Footer: Fixed height to prevent layout jumps on button toggle */}
                        <div className="p-4 border-t border-neutral-100 flex-none bg-neutral-50/50 h-[72px] flex items-center gap-2">
                            {editing ? (
                                <>
                                    <button onClick={() => setEditing(false)} className="flex-1 h-10 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition">Cancel</button>
                                    <button onClick={handleSave} disabled={updating} className="flex-1 h-10 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">Save</button>
                                </>
                            ) : (
                                <button onClick={handleEdit} className="w-full h-10 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">Edit Details</button>
                            )}
                        </div>
                    </div>

                    {/* Quadrant 2: Wellness Pulse (Swaped to Top Right) */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-neutral-100 flex-none bg-neutral-50/50">
                            <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-500" />
                                Wellness Pulse
                            </h2>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-center items-center">
                            {/* Graphical Donut Chart Visual */}
                            <div className="relative w-40 h-40">
                                {(() => {
                                    const total = alerts.length || 1;
                                    const crit = alerts.filter(a => a.severity_level === 'critical').length;
                                    const high = alerts.filter(a => a.severity_level === 'high').length;
                                    const med = alerts.filter(a => a.severity_level === 'medium').length; // Treating medium as warning

                                    // Calculate degrees
                                    const critDeg = (crit / total) * 360;
                                    const highDeg = (high / total) * 360;
                                    const medDeg = (med / total) * 360;
                                    const remDeg = 360 - (critDeg + highDeg + medDeg); // Green/Safe

                                    // Create conic gradient string
                                    // Order: Red -> Orange -> Yellow -> Green
                                    const grad = `conic-gradient(
                                        #ef4444 0deg ${critDeg}deg, 
                                        #f97316 ${critDeg}deg ${critDeg + highDeg}deg,
                                        #eab308 ${critDeg + highDeg}deg ${critDeg + highDeg + medDeg}deg,
                                        #4ade80 ${critDeg + highDeg + medDeg}deg 360deg
                                    )`;

                                    return (
                                        <div
                                            className="w-full h-full rounded-full"
                                            style={{ background: grad }}
                                        >
                                            <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-neutral-900">{alerts.length}</span>
                                                <span className="text-xs text-neutral-500 uppercase tracking-wide">Alerts</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-6 w-full max-w-xs grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mb-1" />
                                    <span className="text-neutral-600">Critical</span>
                                    <span className="font-bold">{alerts.filter(a => a.severity_level === 'critical').length}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 mb-1" />
                                    <span className="text-neutral-600">Warning</span>
                                    <span className="font-bold">{alerts.filter(a => ['high', 'medium'].includes(a.severity_level)).length}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-400 mb-1" />
                                    <span className="text-neutral-600">Normal</span>
                                    <span className="font-bold text-green-600">OK</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quadrant 3: Recent Videos */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-neutral-100 flex items-center justify-between flex-none bg-neutral-50/50">
                            <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                                <Play className="h-4 w-4 text-indigo-500" />
                                Recent Videos
                            </h2>
                            <Link href="/video" className="text-xs text-indigo-600 font-medium hover:underline">View All</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {videosLoading ? (
                                <p className="text-sm text-neutral-400 text-center py-4">Loading...</p>
                            ) : videos.length === 0 ? (
                                <p className="text-sm text-neutral-400 text-center py-4">No recent videos.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {videos.slice(0, 2).map(video => (
                                        <div key={video.id} className="relative aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-black group max-h-[160px]">
                                            <div onClick={() => handlePlayVideo(video)} className="w-full h-full cursor-pointer relative bg-neutral-900">
                                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                                    <div className="bg-white/90 p-1.5 rounded-full shadow-lg group-hover:scale-110 transition"><Play className="h-3 w-3 text-indigo-600" /></div>
                                                </div>
                                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                    <p className="text-[10px] text-white font-medium truncate">{video.description || "No description"}</p>
                                                    <p className="text-[10px] text-neutral-300">{new Date(video.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quadrant 4: Recent Activities (Swapped to Bottom Right) */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-neutral-100 flex items-center justify-between flex-none bg-neutral-50/50">
                            <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                Recent Activities
                            </h2>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setAlertsPage(p => Math.max(1, p - 1))} disabled={alertsPage === 1}
                                    className="p-1 hover:bg-neutral-200 rounded text-neutral-500 disabled:opacity-30"
                                >←</button>
                                <span className="text-xs text-neutral-500 w-12 text-center">{alertsPage}/{alertsTotalPages}</span>
                                <button
                                    onClick={() => setAlertsPage(p => Math.min(alertsTotalPages, p + 1))} disabled={alertsPage === alertsTotalPages}
                                    className="p-1 hover:bg-neutral-200 rounded text-neutral-500 disabled:opacity-30"
                                >→</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {alertsLoading ? (
                                <p className="text-sm text-neutral-400 text-center py-4">Loading...</p>
                            ) : alerts.length === 0 ? (
                                <p className="text-sm text-neutral-400 text-center py-4">No recent activities.</p>
                            ) : (
                                <div className="space-y-3">
                                    {alerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            onClick={() => router.push(`/alerts/${alert.id}`)}
                                            className="p-3 rounded-lg border border-neutral-100 bg-neutral-50 hover:border-indigo-200 cursor-pointer flex gap-3 group transition"
                                        >
                                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity_level === 'critical' ? 'bg-red-500' : alert.severity_level === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-indigo-600 transition">{alert.alert_type}</span>
                                                    <span className="text-[10px] text-neutral-400">{new Date(alert.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-neutral-600 truncate">{alert.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

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

// Add this to your global CSS or just use standard Tailwind
// .custom-scrollbar::-webkit-scrollbar { width: 4px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 4px; }
// .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d4; }
