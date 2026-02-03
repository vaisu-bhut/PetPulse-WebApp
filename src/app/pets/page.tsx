"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { petApi, type Pet } from '@/lib/api';
import { Plus, Trash2, PawPrint } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function PetsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [pets, setPets] = useState<Pet[]>([]);
    const [showAddPet, setShowAddPet] = useState(false);
    const [newPet, setNewPet] = useState({ name: '', age: 0, species: '', breed: '', bio: '' });
    const [petLoading, setPetLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchPets = async () => {
            if (user) {
                try {
                    const userPets = await petApi.list();
                    setPets(userPets);
                } catch (error) {
                    console.error('Failed to fetch pets:', error);
                }
            }
        };
        fetchPets();
    }, [user]);

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setPetLoading(true);

        try {
            const pet = await petApi.create(newPet);
            setPets([...pets, pet]);
            setShowAddPet(false);
            setNewPet({ name: '', age: 0, species: '', breed: '', bio: '' });
        } catch (error: any) {
            console.error('Failed to create pet:', error);
            setError((error as Error).message || 'Failed to create pet');
        } finally {
            setPetLoading(false);
        }
    };

    const handleDeletePet = async (id: number) => {
        if (!confirm('Are you sure you want to delete this pet?')) return;
        try {
            await petApi.delete(id);
            setPets(pets.filter(p => p.id !== id));
        } catch (error: any) {
            alert((error as Error).message || 'Failed to delete pet');
        }
    };

    if (authLoading || !user) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                    <div className="text-neutral-900">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">My Pets</h1>
                        <p className="text-neutral-500 mt-2">Manage your registered pets</p>
                    </div>
                    <button
                        onClick={() => setShowAddPet(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Pet
                    </button>
                </div>

                {pets.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-200 bg-white shadow-sm max-w-2xl mx-auto">
                        <PawPrint className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-900 text-lg font-medium">No pets added yet</p>
                        <button
                            onClick={() => setShowAddPet(true)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium mt-2"
                        >
                            Add your first pet
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pets.map((pet) => (
                            <Link
                                key={pet.id}
                                href={`/pets/${pet.id}`}
                                className="block rounded-xl border border-neutral-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{pet.name}</h3>
                                        <p className="text-sm font-medium text-neutral-500">{pet.species} • {pet.breed}</p>
                                        <span className="text-xs text-neutral-400 mt-1 block">{pet.age} years old</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent Link navigation
                                            handleDeletePet(pet.id);
                                        }}
                                        className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-600 line-clamp-3">{pet.bio || 'No bio available.'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Add Pet Modal */}
                {showAddPet && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-neutral-100">
                            <h3 className="text-xl font-bold text-neutral-900 mb-6">Add New Pet</h3>

                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAddPet} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.name}
                                        onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Species</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.species}
                                        onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                        placeholder="Dog, Cat, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Breed</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.breed}
                                        onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={newPet.age}
                                        onChange={(e) => setNewPet({ ...newPet, age: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Bio</label>
                                    <textarea
                                        required
                                        value={newPet.bio}
                                        onChange={(e) => setNewPet({ ...newPet, bio: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddPet(false);
                                            setError('');
                                        }}
                                        className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={petLoading}
                                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                    >
                                        {petLoading ? 'Adding...' : 'Add Pet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
