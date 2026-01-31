"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { userApi, emergencyContactApi, type EmergencyContact, type CreateEmergencyContactRequest } from '@/lib/api';
import { Mail, User as UserIcon, Calendar, Phone, Plus, Edit2, Trash2, AlertCircle, Users, Bell, Check, X, MapPin } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';

export default function ProfilePage() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [updating, setUpdating] = useState(false);

    // Notification Prefs (Mock for now, or could store in local storage)
    const [notifPrefs, setNotifPrefs] = useState({
        critical_alerts_email: true,
        critical_alerts_sms: true,
        daily_digest_email: true,
        marketing_emails: false
    });

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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

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
        } catch (error) {
            alert((error as Error).message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const loadContacts = async () => {
        try {
            const data = await emergencyContactApi.list();
            setContacts(data);
        } catch (error) {
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

    const handleDeleteContact = async (id: number) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            await emergencyContactApi.delete(id);
            loadContacts();
        } catch (error) {
            console.error('Failed to delete contact:', error);
            alert('Failed to delete contact');
        }
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContact) {
                await emergencyContactApi.update(editingContact.id, contactForm);
            } else {
                await emergencyContactApi.create(contactForm);
            }
            setShowContactForm(false);
            loadContacts();
        } catch (error) {
            console.error('Failed to save contact:', error);
            alert((error as Error).message || 'Failed to save contact');
        }
    };

    const getContactTypeLabel = (type: string) => {
        switch (type) {
            case 'vet': return 'Veterinarian';
            case 'neighbor': return 'Neighbor';
            case 'family': return 'Family Member';
            case 'pet_service': return 'Pet Service';
            default: return type;
        }
    };

    const getContactTypeColor = (type: string) => {
        switch (type) {
            case 'vet': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'family': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'pet_service': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    if (authLoading || !user) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-900">
                    Loading...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Profile & Settings</h1>
                        <p className="text-neutral-500 mt-2">Manage your account and emergency protocols</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Profile & Notifications */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-8">

                        {/* Profile Card */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold border border-indigo-200">
                                    {user.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900">{user.name}</h2>
                                    <p className="text-neutral-500 text-sm">{user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none bg-neutral-50"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 font-medium">{user.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">Email Address</label>
                                    {editing ? (
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none bg-neutral-50"
                                        />
                                    ) : (
                                        <p className="text-neutral-900 font-medium">{user.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">Member Since</label>
                                    <p className="text-neutral-900 font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-neutral-100">
                                {editing ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="flex-1 py-2 px-4 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={updating}
                                            className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                                        >
                                            {updating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEdit}
                                        className="w-full py-2 px-4 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification Preferences */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-indigo-600" />
                                Notification Preferences
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-neutral-900">Critical Alerts (Email)</p>
                                        <p className="text-xs text-neutral-500">Immediate emails for critical pet events</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifPrefs(p => ({ ...p, critical_alerts_email: !p.critical_alerts_email }))}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${notifPrefs.critical_alerts_email ? 'bg-indigo-600' : 'bg-neutral-200'}`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${notifPrefs.critical_alerts_email ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-neutral-900">Critical Alerts (SMS)</p>
                                        <p className="text-xs text-neutral-500">Immediate SMS texts for urgent issues</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifPrefs(p => ({ ...p, critical_alerts_sms: !p.critical_alerts_sms }))}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${notifPrefs.critical_alerts_sms ? 'bg-indigo-600' : 'bg-neutral-200'}`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${notifPrefs.critical_alerts_sms ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-neutral-900">Daily Digest</p>
                                        <p className="text-xs text-neutral-500">Daily summary of pet activities</p>
                                    </div>
                                    <button
                                        onClick={() => setNotifPrefs(p => ({ ...p, daily_digest_email: !p.daily_digest_email }))}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${notifPrefs.daily_digest_email ? 'bg-indigo-600' : 'bg-neutral-200'}`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${notifPrefs.daily_digest_email ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Emergency Contacts */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm h-full">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        Emergency Contacts
                                    </h2>
                                    <p className="text-neutral-500 text-sm mt-1">Trusted contacts for quick response actions</p>
                                </div>
                                <button
                                    onClick={handleAddContact}
                                    className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Contact
                                </button>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {loadingContacts ? (
                                    <div className="text-center py-12">
                                        <p className="text-neutral-500">Loading contacts...</p>
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                                        <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                                        <p className="text-neutral-500 font-medium">No emergency contacts yet</p>
                                        <p className="text-sm text-neutral-400 mt-1">Add trusted people who can help with your pets.</p>
                                        <button onClick={handleAddContact} className="mt-4 text-indigo-600 font-medium hover:underline text-sm">Add your first contact</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {contacts.map((contact) => (
                                            <div key={contact.id} className="relative group rounded-xl border border-neutral-200 bg-white p-5 hover:border-indigo-200 hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getContactTypeColor(contact.contact_type)}`}>
                                                        {getContactTypeLabel(contact.contact_type)}
                                                    </span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditContact(contact)} className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-500 hover:text-indigo-600 transition">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteContact(contact.id)} className="p-1.5 hover:bg-red-50 rounded-md text-neutral-500 hover:text-red-600 transition">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-neutral-900">{contact.name}</h3>

                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                                                        {contact.phone}
                                                    </div>
                                                    {contact.email && (
                                                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                            <Mail className="h-3.5 w-3.5 text-neutral-400" />
                                                            {contact.email}
                                                        </div>
                                                    )}
                                                    {contact.address && (
                                                        <div className="flex items-start gap-2 text-sm text-neutral-600">
                                                            <MapPin className="h-3.5 w-3.5 text-neutral-400 mt-0.5" />
                                                            <span className="truncate">{contact.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form Modal */}
                {showContactForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
                            <h3 className="mb-6 text-xl font-bold text-neutral-900">
                                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </h3>
                            <form onSubmit={handleSaveContact} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={contactForm.name}
                                            onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                        <select
                                            value={contactForm.contact_type}
                                            onChange={e => setContactForm({ ...contactForm, contact_type: e.target.value })}
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="family">Family</option>
                                            <option value="neighbor">Neighbor</option>
                                            <option value="vet">Veterinarian</option>
                                            <option value="pet_service">Pet Service</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number *</label>
                                    <input
                                        required
                                        type="tel"
                                        value={contactForm.phone}
                                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={contactForm.email}
                                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={contactForm.address}
                                        onChange={e => setContactForm({ ...contactForm, address: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={contactForm.notes}
                                        onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                        placeholder="Availability, key instructions, etc."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactForm(false)}
                                        className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition"
                                    >
                                        Save Contact
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
