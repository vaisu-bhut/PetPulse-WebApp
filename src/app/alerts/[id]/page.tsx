"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { alertApi, emergencyContactApi, quickActionApi, type Alert, type EmergencyContact, type QuickAction, type CreateQuickActionRequest } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, ChevronLeft, Phone, MessageSquare, Send, History, Video, ExternalLink, Bot, Share2, Download, Mail } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';

export default function AlertDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const alertId = params.id as string;

    const [alertData, setAlertData] = useState<Alert | null>(null);
    const [loading, setLoading] = useState(true);

    // Quick Action State
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
    const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [selectedActionType, setSelectedActionType] = useState('sms');
    const [isManualEdit, setIsManualEdit] = useState(false);
    const [activePlatform, setActivePlatform] = useState<'sms' | 'email'>('sms');

    // Parsed message content for display/editing
    const [parsedMessage, setParsedMessage] = useState<{ sms_text: string, email_body: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && alertId) {
            loadAlert();
            loadContacts();
            loadQuickActions();
        }
    }, [user, alertId]);

    const loadAlert = async () => {
        try {
            const data = await alertApi.get(alertId);
            setAlertData(data);
        } catch (error) {
            console.error('Failed to load alert:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadContacts = async () => {
        try {
            const data = await emergencyContactApi.list();
            setContacts(data);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const loadQuickActions = async () => {
        try {
            const actions = await quickActionApi.listForAlert(alertId);
            setQuickActions(actions);
        } catch (error) {
            console.error('Failed to load actions:', error);
        }
    };

    const handleAcknowledge = async () => {
        const response = prompt('Please provide your response:');
        if (!response) return;

        try {
            await alertApi.acknowledge(alertId, response);
            loadAlert();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            alert('Failed to acknowledge alert');
        }
    };

    const handleResolve = async () => {
        if (!confirm('Mark this alert as resolved?')) return;

        try {
            await alertApi.resolve(alertId);
            loadAlert();
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            alert('Failed to resolve alert');
        }
    };

    const handleOpenQuickAction = (preGeneratedAction?: QuickAction) => {
        if (!alertData) return;

        setIsManualEdit(false);
        setActivePlatform('sms'); // Default to SMS view
        let actionToUse = preGeneratedAction;

        // If no explicit action provided, see if we have ANY pending one to start with
        if (!actionToUse && selectedContactId) {
            actionToUse = quickActions.find(a => a.emergency_contact_id === selectedContactId && a.status === 'pending');
        }

        if (!actionToUse) {
            actionToUse = quickActions.find(a => a.status === 'pending');
        }

        if (actionToUse) {
            setSelectedContactId(actionToUse.emergency_contact_id);
            updateMessageFromAction(actionToUse, 'sms');
        } else {
            // Default to first contact if available and no contact selected
            if (contacts.length > 0 && !selectedContactId) {
                setSelectedContactId(contacts[0].id);
            }

            // Generate default message (manual override)
            const petName = alertData.pet_name || 'your pet';
            const defaultMsg = `🚨 URGENT: ${petName} is showing unusual behavior (${alertData.alert_type}). Please check PetPulse immediately.`;
            setActionMessage(defaultMsg);
            setParsedMessage(null);
        }

        setShowQuickActionDialog(true);
    };

    const updateMessageFromAction = (action: QuickAction, platform: 'sms' | 'email') => {
        try {
            const content = JSON.parse(action.message);
            setParsedMessage(content);
            if (platform === 'email') {
                setActionMessage(content.email_body || action.message);
            } else {
                setActionMessage(content.sms_text || action.message);
            }
        } catch (e) {
            setParsedMessage(null);
            setActionMessage(action.message);
        }
    };

    // Handle platform tab switch
    const handlePlatformChange = (platform: 'sms' | 'email') => {
        if (platform === activePlatform) return;

        setActivePlatform(platform);

        // If we have an AI suggestion and user hasn't edited, swap to the other version
        if (parsedMessage && !isManualEdit) {
            if (platform === 'email') {
                setActionMessage(parsedMessage.email_body || actionMessage);
            } else {
                setActionMessage(parsedMessage.sms_text || actionMessage);
            }
        }
    };

    // Sync message if contact changes while dialog is open and user hasn't manually edited
    useEffect(() => {
        if (showQuickActionDialog && selectedContactId && !isManualEdit) {
            // See if there's a pending action for this SPECIFIC contact
            const action = quickActions.find(a => a.emergency_contact_id === selectedContactId && a.status === 'pending');
            if (action) {
                updateMessageFromAction(action, activePlatform);
            } else {
                // If no pending action for THIS contact, revert to generic default
                const petName = alertData?.pet_name || 'your pet';
                const defaultMsg = `🚨 URGENT: ${petName} is showing unusual behavior (${alertData?.alert_type}). Please check PetPulse immediately.`;
                setActionMessage(defaultMsg);
                setParsedMessage(null);
            }
        }
    }, [selectedContactId, showQuickActionDialog, quickActions, alertData, isManualEdit, activePlatform]);

    const handleShare = async (platform: 'whatsapp' | 'email') => {
        if (!alertData) return;

        const title = `PetPulse Alert: ${alertData.alert_type}`;

        // Platforms are now synchronized with the textarea (actionMessage)
        const text = actionMessage;

        // Find contact details
        const contact = contacts.find(c => c.id === selectedContactId);
        const phoneNumber = contact?.phone || '';
        const emailAddress = contact?.email || '';

        // Try to fetch video file if available
        let filesArray: File[] = [];
        if (alertData.video_id) {
            try {
                // Fetch video blob
                // We need an endpoint that returns the raw video or similar. 
                // Using the stream endpoint: /api/videos/:id/stream
                const videoUrl = `/api/videos/${alertData.video_id}/stream`;
                const response = await fetch(videoUrl);
                const blob = await response.blob();
                const file = new File([blob], "evidence.mp4", { type: "video/mp4" });
                filesArray = [file];
            } catch (e) {
                console.error("Failed to fetch video for sharing", e);
            }
        }

        if (navigator.share && navigator.canShare({ files: filesArray })) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    files: filesArray
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for desktop / unsupported
            if (platform === 'whatsapp') {
                window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
            } else if (platform === 'email') {
                window.open(`mailto:${emailAddress}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`, '_blank');
            }

            // If video exists, trigger download separately as fallback
            if (alertData.video_id) {
                const link = document.createElement('a');
                link.href = `/api/videos/${alertData.video_id}/stream`;
                link.download = `alert_${alertData.id}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    };

    const handleExecuteAction = async () => {
        if (!alertData || !selectedContactId) return;

        setLoadingAction(true);
        try {
            const request: CreateQuickActionRequest = {
                emergency_contact_id: selectedContactId,
                action_type: selectedActionType,
                message: actionMessage,
                video_clip_ids: []
            };

            await quickActionApi.execute(alertData.id, request);
            await loadQuickActions();
            setShowQuickActionDialog(false);
            alert('Quick action sent successfully!');
        } catch (error) {
            console.error('Failed to execute action:', error);
            alert((error as Error).message || 'Failed to send action');
        } finally {
            setLoadingAction(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-50 text-red-700 border-red-200';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
        }
    };

    if (loading || !alertData) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                    <div className="text-neutral-900">Loading Alert...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 w-full">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Alerts
                </button>

                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alertData.severity_level)}`}>
                                {alertData.severity_level.toUpperCase()}
                            </span>
                            <span className="text-sm text-neutral-500">
                                {new Date(alertData.created_at).toLocaleString()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900">{alertData.alert_type}</h1>
                        {alertData.pet_name && <p className="text-neutral-500 mt-1">Pet: {alertData.pet_name}</p>}
                    </div>

                    <div className="flex gap-3">
                        {!alertData.outcome || alertData.outcome !== 'Resolved' ? (
                            <>
                                <button
                                    onClick={handleAcknowledge}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                                >
                                    Acknowledge
                                </button>
                                <button
                                    onClick={handleResolve}
                                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium text-sm"
                                >
                                    Resolve
                                </button>
                            </>
                        ) : (
                            <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Resolved
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Video Evidence */}
                        {alertData.video_id ? (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <Video className="h-5 w-5 text-neutral-900" />
                                    <h3 className="text-lg font-semibold text-neutral-900">Video Evidence</h3>
                                </div>
                                <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                                    <video
                                        controls
                                        className="w-full h-full object-contain"
                                        src={`/api/videos/${alertData.video_id}/stream`}
                                        preload="metadata"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Video Evidence</h3>
                                <p className="text-neutral-500 text-sm">No video evidence available for this alert.</p>
                            </div>
                        )}

                        {/* Status Card */}
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Status & Message</h3>
                            <p className="text-neutral-600 mb-4">{alertData.message || 'No description available.'}</p>

                            {alertData.outcome && (
                                <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center text-sm">
                                    <span className="text-neutral-500">Current Outcome:</span>
                                    <span className="font-medium text-neutral-900">{alertData.outcome}</span>
                                </div>
                            )}
                        </div>

                        {/* Critical Indicators */}
                        {alertData.critical_indicators && (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Critical Indicators</h3>
                                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-sm text-neutral-700 overflow-auto">
                                    <pre>{JSON.stringify(alertData.critical_indicators, null, 2)}</pre>
                                </div>
                            </div>
                        )}

                        {/* Analysis / Recommended Actions */}
                        {alertData.recommended_actions && (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recommended Actions</h3>
                                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-900 overflow-auto">
                                    <pre>{JSON.stringify(alertData.recommended_actions, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="lg:col-span-4 space-y-6">


                        {/* Pre-generated Actions (Pending) */}
                        {quickActions.filter(a => a.status === 'pending').map(action => (
                            <div key={action.id} className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-indigo-900 mb-2">AI Suggested Action</h3>
                                <p className="text-sm text-indigo-700 mb-4">
                                    Gemini has prepared a response for <strong>{action.contact_name}</strong>.
                                </p>
                                <button
                                    onClick={() => handleOpenQuickAction(action)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white border border-indigo-600 rounded-xl hover:bg-indigo-700 transition font-medium"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Review & Send
                                </button>
                            </div>
                        ))}

                        {/* General Quick Action Button */}
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Manual Response</h3>
                            <button
                                onClick={() => handleOpenQuickAction()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition font-medium"
                            >
                                <Send className="h-4 w-4" />
                                Create New Message
                            </button>
                        </div>

                        {/* Action History */}
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="h-5 w-5 text-neutral-500" />
                                <h3 className="text-lg font-semibold text-neutral-900">Action History</h3>
                            </div>

                            {quickActions.filter(a => a.status !== 'pending').length === 0 ? (
                                <p className="text-sm text-neutral-500">No actions taken yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {quickActions.filter(a => a.status !== 'pending').map(action => {
                                        let displayMsg = action.message;
                                        try {
                                            const parsed = JSON.parse(action.message);
                                            displayMsg = parsed.sms_text || action.message;
                                        } catch (e) {
                                            // Keep original if not JSON
                                        }
                                        return (
                                            <div key={action.id} className="relative border-l-2 border-neutral-200 pl-4 pb-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-neutral-700">{action.action_type.toUpperCase()}</span>
                                                    <span className="text-xs text-neutral-400">{new Date(action.created_at).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-xs text-neutral-600 mb-1">To: {action.contact_name}</p>
                                                <p className="text-xs text-neutral-500 italic">"{displayMsg}"</p>
                                                <p className="text-xs mt-1 font-medium text-indigo-600">{action.status}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Automated Intervention */}
                        {alertData.intervention_action && (
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Bot className="h-5 w-5 text-indigo-500" />
                                    <h3 className="text-lg font-semibold text-neutral-900">Automated Intervention</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="text-sm text-indigo-800">{alertData.intervention_action}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Action Dialog */}
                {showQuickActionDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <h3 className="mb-4 text-xl font-bold text-neutral-900">Send Alert Notification</h3>

                            {/* Contact Selection */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-neutral-700">Select Contact</label>
                                <select
                                    className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-neutral-900 focus:border-indigo-500 focus:outline-none"
                                    value={selectedContactId || ''}
                                    onChange={(e) => setSelectedContactId(Number(e.target.value))}
                                >
                                    <option value="" disabled>Select a contact</option>
                                    {contacts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.contact_type})</option>
                                    ))}
                                </select>

                                {/* Contact Details Display */}
                                {selectedContactId && contacts.find(c => c.id === selectedContactId) && (
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {contacts.find(c => c.id === selectedContactId)?.phone}
                                        </div>
                                        {contacts.find(c => c.id === selectedContactId)?.email ? (
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {contacts.find(c => c.id === selectedContactId)?.email}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-neutral-400 italic">
                                                <Mail className="h-3 w-3 opacity-50" />
                                                No email provided
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Message */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex bg-neutral-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => handlePlatformChange('sms')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activePlatform === 'sms' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            SMS / WhatsApp
                                        </button>
                                        <button
                                            onClick={() => handlePlatformChange('email')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activePlatform === 'email' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            Email
                                        </button>
                                    </div>
                                    {(parsedMessage || isManualEdit) && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${parsedMessage ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                            {parsedMessage ? '✨ AI Suggestion' : 'Custom'}
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none transition-all"
                                    rows={activePlatform === 'email' ? 8 : 4}
                                    value={actionMessage}
                                    onChange={(e) => {
                                        setActionMessage(e.target.value);
                                        setIsManualEdit(true);
                                        setParsedMessage(null);
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowQuickActionDialog(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                                >
                                    Close
                                </button>

                                {parsedMessage ? (
                                    <>
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            Share WhatsApp
                                        </button>
                                        <button
                                            onClick={() => handleShare('email')}
                                            disabled={!contacts.find(c => c.id === selectedContactId)?.email}
                                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Mail className="h-4 w-4" />
                                            Share Email
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleExecuteAction}
                                        disabled={loadingAction || !selectedContactId}
                                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {loadingAction ? 'Sending...' : 'Log & Send'}
                                        <Send className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout >
    );
}
