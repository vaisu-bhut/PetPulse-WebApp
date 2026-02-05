"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { alertApi, emergencyContactApi, quickActionApi, type Alert, type EmergencyContact, type QuickAction, type CreateQuickActionRequest } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, ChevronLeft, Phone, MessageSquare, Send, History, Video, ExternalLink, Bot, User, Share2, Download, Mail, Activity, Shield, Zap, Clock, Info, AlertCircle } from "lucide-react";
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
        const note = prompt('Optional resolution note (leave blank if none):');
        if (note === null) return; // User cancelled

        try {
            await alertApi.resolve(alertId, note || undefined);
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

    const handleShare = async (platform: 'whatsapp' | 'email', actionId?: string) => {
        if (!alertData) return;

        const title = `PetPulse Alert: ${alertData.alert_type}`;
        const text = actionMessage;
        const contact = contacts.find(c => c.id === selectedContactId);
        const phoneNumber = contact?.phone || '';
        const emailAddress = contact?.email || '';

        // Check for recent identical action (debounce 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentAction = quickActions.find(a =>
            a.status !== 'pending' &&
            a.action_type.toLowerCase() === platform.toLowerCase() &&
            new Date(a.sent_at || a.created_at) > fiveMinutesAgo
        );

        // Log to backend if not debounced
        if (!recentAction) {
            try {
                // If it's a specific AI action, we use its contact ID, otherwise use selected contact
                const contactId = actionId
                    ? quickActions.find(a => a.id === actionId)?.emergency_contact_id
                    : selectedContactId;

                if (contactId) {
                    await quickActionApi.execute(alertData.id, {
                        emergency_contact_id: contactId,
                        action_type: platform,
                        message: actionMessage
                    });
                    loadQuickActions();
                }
            } catch (e) {
                console.error("Failed to log sharing action:", e);
            }
        } else if (actionId) {
            // Even if debounced, if it's an AI action we should mark it as 'sent' locally 
            // so it moves out of the "suggested" area.
            setQuickActions(prev => prev.map(a =>
                a.id === actionId ? { ...a, status: 'sent', sent_at: new Date().toISOString() } : a
            ));
        }

        let filesArray: File[] = [];
        if (alertData.video_id) {
            try {
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
                await navigator.share({ title, text, files: filesArray });
            } catch (e) { console.error('Error sharing:', e); }
        } else {
            if (platform === 'whatsapp') {
                window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
            } else if (platform === 'email') {
                window.open(`mailto:${emailAddress}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`, '_blank');
            }
        }
        setShowQuickActionDialog(false);
    };

    const handleExecuteAction = async () => {
        if (!alertData || !selectedContactId) return;

        // Check for recent identical action (debounce 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentAction = quickActions.find(a =>
            a.status !== 'pending' &&
            a.action_type.toLowerCase() === selectedActionType.toLowerCase() &&
            new Date(a.sent_at || a.created_at) > fiveMinutesAgo
        );

        if (recentAction) {
            setShowQuickActionDialog(false);
            alert(`An identical ${selectedActionType} was recently logged. Sharing action complete.`);
            return;
        }

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

    const getSeverityStyles = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
            default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
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

    // Consolidate and debounce quick actions
    const processedQuickActions = quickActions
        .filter(a => a.status !== 'pending')
        .sort((a, b) => new Date(a.sent_at || a.created_at).getTime() - new Date(b.sent_at || b.created_at).getTime());

    const debouncedActions: typeof processedQuickActions = [];
    const lastActionByType: Record<string, number> = {};

    processedQuickActions.forEach(action => {
        const type = action.action_type.toLowerCase();
        const time = new Date(action.sent_at || action.created_at).getTime();
        if (!lastActionByType[type] || (time - lastActionByType[type]) > 5 * 60 * 1000) {
            debouncedActions.push(action);
            lastActionByType[type] = time;
        }
    });

    // Consolidate all logs
    const auditLogs = [
        ...(alertData.intervention_action ? [{
            id: 'auto-int',
            type: 'AUTO-RESPONSE',
            content: alertData.intervention_action,
            time: alertData.created_at,
            icon: <Bot className="h-3 w-3" />,
            color: 'text-red-500 border-red-500'
        }] : []),
        ...(alertData.user_response ? [{
            id: 'user-ack',
            type: 'USER-ACK',
            content: alertData.user_response,
            time: alertData.user_acknowledged_at || alertData.created_at,
            icon: <User className="h-3 w-3" />,
            color: 'text-indigo-600 border-indigo-600'
        }] : []),
        ...(alertData.resolved_at ? [{
            id: 'case-resolved',
            type: 'RESOLVED',
            content: alertData.outcome || 'Case marked as resolved by user.',
            time: alertData.resolved_at,
            icon: <CheckCircle className="h-3 w-3" />,
            color: 'text-green-600 border-green-600'
        }] : []),
        ...debouncedActions.map(action => {
            let msg = action.message;
            try { msg = JSON.parse(action.message).sms_text || action.message; } catch (e) { }
            return {
                id: action.id,
                type: action.action_type.toUpperCase(),
                content: `To ${action.contact_name}: "${msg}"`,
                time: action.sent_at || action.created_at,
                icon: <Send className="h-3 w-3" />,
                color: 'text-green-600 border-green-600'
            };
        })
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <DashboardLayout>
            <div className="h-screen overflow-hidden flex flex-col px-6 md:px-8 pt-6 pb-12 w-full">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 mb-8 transition-all hover:translate-x-[-4px]"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-sm font-medium tracking-wide uppercase">Back to Dashboard</span>
                </button>

                {/* Header Section */}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6 flex-shrink-0">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest border ${getSeverityStyles(alertData.severity_level)}`}>
                                {alertData.severity_level.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 text-neutral-400 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-100">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium uppercase tracking-tight">
                                    {new Date(alertData.created_at).toLocaleString('en-US', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
                                {alertData.alert_type}
                            </h1>
                            {alertData.pet_name && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <p className="text-neutral-500 font-medium tracking-wide text-xs">
                                        Monitoring: <span className="text-indigo-600 font-bold">{alertData.pet_name}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        {!alertData.outcome || alertData.outcome !== 'Resolved' ? (
                            <button
                                onClick={handleResolve}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                Mark Resolved
                            </button>
                        ) : (
                            <div className="px-6 py-3 bg-green-500 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-green-500/20 border border-green-400">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">Case Resolved</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow min-h-0 overflow-hidden pb-4">
                    {/* Left Column: Video & Insights */}
                    <div className="lg:col-span-6 flex flex-col gap-6 min-h-0 overflow-hidden p-2">
                        {/* Video Evidence */}
                        <div className="group relative p-0.5 rounded-[1.5rem] bg-gradient-to-br from-neutral-200 to-neutral-50 shadow-xl transition-all hover:shadow-indigo-500/10 flex-shrink-0 max-w-2xl mx-auto w-full">
                            <div className="p-5 rounded-[1.45rem] bg-white border border-neutral-100 overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                            <Video className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-base font-black text-neutral-900 tracking-tight">Observation Clip</h3>
                                    </div>
                                    {alertData.video_id && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-100 text-[10px] font-bold text-neutral-500">
                                            <Shield className="h-3 w-3" />
                                            ENCRYPTED
                                        </div>
                                    )}
                                </div>

                                {alertData.video_id ? (
                                    <div className="rounded-3xl overflow-hidden bg-black aspect-video relative shadow-inner group-hover:shadow-indigo-500/5 transition-all">
                                        <video
                                            controls
                                            className="w-full h-full object-contain"
                                            src={`/api/videos/${alertData.video_id}/stream`}
                                            preload="metadata"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                ) : (
                                    <div className="rounded-3xl bg-neutral-50 border-2 border-dashed border-neutral-200 aspect-video flex flex-col items-center justify-center text-center p-10">
                                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                            <AlertCircle className="h-8 w-8 text-neutral-300" />
                                        </div>
                                        <h4 className="text-neutral-900 font-bold">No Visual Evidence</h4>
                                        <p className="text-sm text-neutral-400 max-w-xs mt-2">Telemetry data recorded, feed unavailable.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* System Insight & Safety Protocol (Fills remaining height) */}
                        <div className="flex-grow flex flex-col gap-6 min-h-0">
                            <div className="flex-grow p-6 rounded-[1.5rem] bg-white border border-neutral-100 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Activity className="h-24 w-24" />
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-base font-black text-neutral-900 tracking-tight">System Insight</h3>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar max-h-[200px] lg:max-h-none">
                                    <p className="text-neutral-600 leading-relaxed font-medium">
                                        {alertData.message || 'No specific description provided by the monitoring system.'}
                                    </p>
                                </div>
                            </div>

                            {alertData.recommended_actions && (
                                <div className="p-5 rounded-[1.5rem] bg-indigo-600 text-white shadow-xl relative overflow-hidden group flex-shrink-0">
                                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-20" />
                                    <div className="flex items-center gap-3 mb-3 relative z-10">
                                        <div className="p-1.5 bg-white/20 rounded-lg text-white">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-base font-black tracking-tight uppercase tracking-[0.2em]">Safety Protocol</h3>
                                    </div>
                                    <div className="space-y-2.5 relative z-10">
                                        {Array.isArray(alertData.recommended_actions) ? (
                                            alertData.recommended_actions.map((action, i) => (
                                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
                                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
                                                    <p className="text-xs font-bold leading-relaxed">{action}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
                                                <p className="text-xs font-bold leading-relaxed">{String(alertData.recommended_actions)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Quick Actions & Audit Log */}
                    <div className="lg:col-span-6 flex flex-col gap-6 min-h-0 overflow-hidden p-2">
                        {/* Gemini Protocol (Quick Actions) */}
                        <div className="flex-shrink-0 space-y-4">
                            {quickActions.filter(a => a.status === 'pending').map(action => (
                                <div key={action.id} className="relative group overflow-hidden p-0.5 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-200/50">
                                    <div className="p-5 rounded-[1.45rem] bg-white transition-all group-hover:bg-white/95">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                <Bot className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <h3 className="text-base font-black text-neutral-900 tracking-tight">Gemini Protocol</h3>
                                        </div>
                                        <p className="text-xs text-neutral-500 font-medium leading-relaxed mb-4">
                                            Response for <span className="text-indigo-600 font-bold">{action.contact_name}</span> is ready.
                                        </p>
                                        <button
                                            onClick={() => handleOpenQuickAction(action)}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-lg shadow-indigo-200 active:scale-[0.98]"
                                        >
                                            <Zap className="h-3.5 w-3.5" />
                                            Execute Suggestion
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Audit Log (Consolidated) - Fills remaining height with internal scroll */}
                        <div className="flex-grow min-h-0 p-6 rounded-[1.5rem] bg-white border border-neutral-100 shadow-lg flex flex-col overflow-hidden">
                            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                                <div className="p-1.5 bg-neutral-50 rounded-lg text-neutral-400">
                                    <History className="h-4 w-4" />
                                </div>
                                <h3 className="text-base font-black text-neutral-900 tracking-tight">Audit Log</h3>
                            </div>

                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-50">
                                {auditLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Clock className="h-8 w-8 text-neutral-100 mb-2" />
                                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">System Ready</p>
                                    </div>
                                ) : (
                                    auditLogs.map(log => (
                                        <div key={log.id} className="relative pl-8">
                                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-sm z-10 ${log.id === 'auto-int' ? 'border-red-400' : 'border-indigo-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.id === 'auto-int' ? 'bg-red-400' : 'bg-indigo-400'}`} />
                                            </div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${log.color.split(' ')[0]}`}>{log.type}</span>
                                                <span className="text-[10px] font-bold text-neutral-400">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs font-bold text-neutral-900 leading-relaxed italic line-clamp-3">"{log.content}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Action Dialog */}
                {showQuickActionDialog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-neutral-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                                <Zap className="h-32 w-32 text-indigo-500" />
                            </div>

                            <h3 className="mb-2 text-3xl font-black text-neutral-900 tracking-tight">Dispatch Message</h3>
                            <p className="mb-8 text-neutral-500 font-medium">Configure alert notification protocol</p>

                            {/* Contact Selection */}
                            <div className="mb-8 group">
                                <label className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-focus-within:text-indigo-500 transition-colors">Select Recipient</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4 pr-12 text-neutral-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all cursor-pointer"
                                        value={selectedContactId || ''}
                                        onChange={(e) => setSelectedContactId(Number(e.target.value))}
                                    >
                                        <option value="" disabled>Search contacts...</option>
                                        {contacts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} — {c.contact_type}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                        <ChevronLeft className="h-4 w-4 -rotate-90" />
                                    </div>
                                </div>

                                {/* Contact Details Display */}
                                {selectedContactId && contacts.find(c => c.id === selectedContactId) && (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                                            <Phone className="h-3 w-3" />
                                            {contacts.find(c => c.id === selectedContactId)?.phone}
                                        </div>
                                        {contacts.find(c => c.id === selectedContactId)?.email && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                                                <Mail className="h-3 w-3" />
                                                {contacts.find(c => c.id === selectedContactId)?.email}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Message Composer */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 shadow-inner">
                                        <button
                                            onClick={() => handlePlatformChange('sms')}
                                            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activePlatform === 'sms' ? 'bg-white text-indigo-600 shadow-md' : 'text-neutral-500 hover:text-neutral-900'}`}
                                        >
                                            Mobile / WA
                                        </button>
                                        <button
                                            onClick={() => handlePlatformChange('email')}
                                            className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activePlatform === 'email' ? 'bg-white text-indigo-600 shadow-md' : 'text-neutral-500 hover:text-neutral-900'}`}
                                        >
                                            Secure Email
                                        </button>
                                    </div>
                                    {(parsedMessage || isManualEdit) && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${parsedMessage ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                                            {parsedMessage ? <Zap className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                                            {parsedMessage ? 'AI Suggestion' : 'Manual'}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <textarea
                                        className="w-full rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-6 text-sm font-medium leading-relaxed text-neutral-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all resize-none shadow-inner"
                                        rows={activePlatform === 'email' ? 8 : 5}
                                        value={actionMessage}
                                        onChange={(e) => {
                                            setActionMessage(e.target.value);
                                            setIsManualEdit(true);
                                            setParsedMessage(null);
                                        }}
                                        placeholder="Type security directive..."
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-neutral-300 pointer-events-none">
                                        {actionMessage.length} CHR
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-10 pt-8 border-t border-neutral-50">
                                <button
                                    onClick={() => setShowQuickActionDialog(false)}
                                    className="px-6 py-4 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                                >
                                    Dismiss
                                </button>

                                <div className="flex gap-4">
                                    {parsedMessage ? (
                                        <>
                                            <button
                                                onClick={() => handleShare('whatsapp')}
                                                className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-[#22c35e] transition-all shadow-lg shadow-green-200 active:scale-95"
                                            >
                                                <Share2 className="h-4 w-4" />
                                                WhatsApp
                                            </button>
                                            <button
                                                onClick={() => handleShare('email')}
                                                disabled={!contacts.find(c => c.id === selectedContactId)?.email}
                                                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-30 disabled:grayscale active:scale-95"
                                            >
                                                <Mail className="h-4 w-4" />
                                                Transmit
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleExecuteAction}
                                            disabled={loadingAction || !selectedContactId}
                                            className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl shadow-neutral-200 disabled:opacity-30 active:scale-95"
                                        >
                                            {loadingAction ? 'TRANSMITTING...' : 'EXECUTE PROTOCOL'}
                                            {!loadingAction && <Send className="h-4 w-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e5e5;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d4d4d4;
                }
            `}</style>
        </DashboardLayout >
    );
}
