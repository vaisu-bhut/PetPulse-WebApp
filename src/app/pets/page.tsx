"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { petApi, type Pet } from '@/lib/api';
import { Plus, Trash2 } from "lucide-react";
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
                    console.log('Fetched pets:', userPets);
                    setPets(userPets);
                } catch (error) {
                    console.error('Failed to fetch pets:', error);
                }
            }
        };
        fetchPets();
    }, [user]);

    const handleAddPet = async (e: React.FormEvent) => {
        console.log('=== handleAddPet CALLED ===');
        e.preventDefault();
        setError('');
        setPetLoading(true);

        console.log('Creating pet with data:', newPet);

        try {
            const pet = await petApi.create(newPet);
            console.log('Pet created successfully:', pet);
            setPets([...pets, pet]);
            setShowAddPet(false);
            setNewPet({ name: '', age: 0, species: '', breed: '', bio: '' });
        } catch (error: any) {
            console.error('Failed to create pet:', error);
            setError(error.message || 'Failed to create pet');
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
            alert(error.message || 'Failed to delete pet');
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">My Pets</h1>
                        <p className="text-neutral-400">Manage your registered pets</p>
                    </div>
                    <button
                        onClick={() => setShowAddPet(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add Pet
                    </button>
                </div>

                {pets.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-800 bg-neutral-950">
                        <p className="text-neutral-400 mb-4">No pets added yet</p>
                        <button
                            onClick={() => setShowAddPet(true)}
                            className="text-indigo-400 hover:text-indigo-300"
                        >
                            Add your first pet
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pets.map((pet) => (
                            <Link
                                key={pet.id}
                                href={`/pets/${pet.id}`}
                                className="block rounded-xl border border-neutral-800 bg-neutral-950 p-6 hover:border-indigo-500/50 hover:bg-neutral-900 transition cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{pet.name}</h3>
                                        <p className="text-sm text-neutral-400">{pet.species} • {pet.breed}</p>
                                        <span className="text-xs text-neutral-500">{pet.age} years old</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent Link navigation
                                            handleDeletePet(pet.id);
                                        }}
                                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-red-400 transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-neutral-400 line-clamp-3">{pet.bio}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Add Pet Modal */}
                {showAddPet && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Add New Pet</h3>

                            {error && (
                                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAddPet} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.name}
                                        onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Species</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.species}
                                        onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="Dog, Cat, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Breed</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPet.breed}
                                        onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Age</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={newPet.age}
                                        onChange={(e) => setNewPet({ ...newPet, age: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
                                    <textarea
                                        required
                                        value={newPet.bio}
                                        onChange={(e) => setNewPet({ ...newPet, bio: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddPet(false);
                                            setError('');
                                        }}
                                        className="flex-1 rounded-lg border border-neutral-800 px-4 py-2 font-medium text-white hover:bg-neutral-900 transition"
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
