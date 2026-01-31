"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { userApi, emergencyContactApi, EmergencyContact, CreateEmergencyContactRequest } from '@/lib/api';
import { Mail, User as UserIcon, Calendar, Phone, Plus, Edit2, Trash2, AlertCircle, Users } from "lucide-react";
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

    // Emergency Contacts state
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
    const [contactForm, setContactForm] = useState<CreateEmergencyContactRequest>({
        contact_type: 'neighbor',
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        priority: 0,
    });

    // Load emergency contacts
    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

    const loadContacts = async () => {
        try {
            const data = await emergencyContactApi.list();
            setContacts(data);
        } catch (error: any) {
            console.error('Failed to load contacts:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const handleAddContact = () => {
        setEditingContact(null);
        setContactForm({
            contact_type: 'neighbor',
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: '',
            priority: 0,
        });
        setShowContactForm(true);
    };

    const handleEditContact = (contact: EmergencyContact) => {
        setEditingContact(contact);
        setContactForm({
            contact_type: contact.contact_type,
            name: contact.name,
            phone: contact.phone,
            email: contact.email || '',
            address: contact.address || '',
            notes: contact.notes || '',
            priority: contact.priority,
        });
        setShowContactForm(true);
    };

    const handleSaveContact = async () => {
        try {
            if (editingContact) {
                await emergencyContactApi.update(editingContact.id, contactForm);
            } else {
                await emergencyContactApi.create(contactForm);
            }
            await loadContacts();
            setShowContactForm(false);
        } catch (error: any) {
            alert(error.message || 'Failed to save contact');
        }
    };

    const handleDeleteContact = async (id: number) => {
        if (!confirm('Are you sure you want to delete this emergency contact?')) return;
        try {
            await emergencyContactApi.delete(id);
            await loadContacts();
        } catch (error: any) {
            alert(error.message || 'Failed to delete contact');
        }
    };

    const getContactIcon = (type: string) => {
        switch (type) {
            case 'emergency_911': return '🚨';
            case 'neighbor': return '👥';
            case 'veterinarian': return '🏥';
            case 'pet_service': return '🐾';
            default: return '📞';
        }
    };

    const getContactTypeLabel = (type: string) => {
        switch (type) {
            case 'emergency_911': return 'Emergency 911';
            case 'neighbor': return 'Neighbor';
            case 'veterinarian': return 'Veterinarian';
            case 'pet_service': return 'Pet Service';
            default: return type;
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

                {/* Emergency Contacts Section */}
                <div className="max-w-2xl mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <h2 className="text-xl font-semibold text-white">Emergency Contacts</h2>
                        </div>
                        <button
                            onClick={handleAddContact}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition"
                        >
                            <Plus className="h-4 w-4" />
                            Add Contact
                        </button>
                    </div>

                    {loadingContacts ? (
                        <div className="text-center py-8 text-neutral-400">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center">
                            <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                            <p className="text-neutral-400 mb-4">No emergency contacts yet</p>
                            <p className="text-sm text-neutral-500 mb-6">
                                Add emergency contacts to quickly notify them when critical alerts occur
                            </p>
                            <button
                                onClick={handleAddContact}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition"
                            >
                                <Plus className="h-4 w-4" />
                                Add Your First Contact
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 hover:border-neutral-700 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="text-3xl">{getContactIcon(contact.contact_type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                                        {getContactTypeLabel(contact.contact_type)}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center gap-2 text-neutral-300">
                                                        <Phone className="h-4 w-4 text-neutral-500" />
                                                        {contact.phone}
                                                    </div>
                                                    {contact.email && (
                                                        <div className="flex items-center gap-2 text-neutral-300">
                                                            <Mail className="h-4 w-4 text-neutral-500" />
                                                            {contact.email}
                                                        </div>
                                                    )}
                                                    {contact.notes && (
                                                        <p className="text-neutral-400 mt-2">{contact.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditContact(contact)}
                                                className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contact Form Dialog */}
                {showContactForm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold text-white mb-6">
                                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Contact Type
                                    </label>
                                    <select
                                        value={contactForm.contact_type}
                                        onChange={(e) => setContactForm({ ...contactForm, contact_type: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="neighbor">👥 Neighbor</option>
                                        <option value="veterinarian">🏥 Veterinarian</option>
                                        <option value="pet_service">🐾 Pet Service</option>
                                        <option value="emergency_911">🚨 Emergency 911</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={contactForm.address}
                                        onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="123 Main St"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={contactForm.notes}
                                        onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        rows={3}
                                        placeholder="Additional information..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowContactForm(false)}
                                    className="flex-1 rounded-lg border border-neutral-800 px-4 py-3 font-medium text-white hover:bg-neutral-900 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveContact}
                                    disabled={!contactForm.name || !contactForm.phone}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    {editingContact ? 'Update Contact' : 'Add Contact'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
