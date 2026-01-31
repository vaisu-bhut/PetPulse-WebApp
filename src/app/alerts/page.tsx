"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { alertApi, emergencyContactApi, quickActionApi, type Alert, type EmergencyContact, type QuickAction, type CreateQuickActionRequest } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Phone, MessageSquare, Send, History, Video, ExternalLink, Bot } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';

export default function AlertsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [severityFilter, setSeverityFilter] = useState<string>('');
    const ALERTS_PER_PAGE = 10;

    // Quick Action State
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [quickActions, setQuickActions] = useState<Record<string, QuickAction[]>>({});
    const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
    const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [selectedActionType, setSelectedActionType] = useState('sms');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchAlerts = async () => {
            if (user) {
                setLoading(true);
                try {
                    const data = await alertApi.listUserAlerts(
                        currentPage,
                        ALERTS_PER_PAGE,
                        severityFilter || undefined
                    );
                    setAlerts(data.alerts);
                    setTotalPages(Math.ceil(data.total / ALERTS_PER_PAGE));
                } catch (error) {
                    console.error('Failed to fetch alerts:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchAlerts();
    }, [user, currentPage, severityFilter]);

    const handleAcknowledge = async (alertId: string) => {
        const response = prompt('Please provide your response:');
        if (!response) return;

        try {
            await alertApi.acknowledge(alertId, response);
            // Refresh alerts
            const data = await alertApi.listUserAlerts(currentPage, ALERTS_PER_PAGE, severityFilter || undefined);
            setAlerts(data.alerts);
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            alert('Failed to acknowledge alert');
        }
    };

    const handleResolve = async (alertId: string) => {
        if (!confirm('Mark this alert as resolved?')) return;

        try {
            await alertApi.resolve(alertId);
            // Refresh alerts
            const data = await alertApi.listUserAlerts(currentPage, ALERTS_PER_PAGE, severityFilter || undefined);
            setAlerts(data.alerts);
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            alert('Failed to resolve alert');
        }
    };

    // Quick Actions Logic
    useEffect(() => {
        if (user) {
            loadContacts();
        }
    }, [user]);

    useEffect(() => {
        if (alerts.length > 0) {
            loadQuickActionsForVisibleAlerts();
        }
    }, [alerts]);

    const loadContacts = async () => {
        try {
            const data = await emergencyContactApi.list();
            setContacts(data);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const loadQuickActionsForVisibleAlerts = async () => {
        const actionsMap: Record<string, QuickAction[]> = {};
        await Promise.all(alerts.map(async (alert) => {
            try {
                const actions = await quickActionApi.listForAlert(alert.id);
                actionsMap[alert.id] = actions;
            } catch (error) {
                console.error(`Failed to load actions for alert ${alert.id}:`, error);
            }
        }));
        setQuickActions(prev => ({ ...prev, ...actionsMap }));
    };

    const handleOpenQuickAction = (alert: Alert) => {
        setSelectedAlertForAction(alert);

        // Generate default message
        const petName = alert.pet_name || 'your pet';
        const defaultMsg = `🚨 URGENT: ${petName} is showing unusual behavior (${alert.alert_type}). Please check PetPulse immediately.`;
        setActionMessage(defaultMsg);

        // Default to first contact if available
        if (contacts.length > 0 && !selectedContactId) {
            setSelectedContactId(contacts[0].id);
        }

        setShowQuickActionDialog(true);
    };

    const handleExecuteAction = async () => {
        if (!selectedAlertForAction || !selectedContactId) return;

        setLoadingAction(true);
        try {
            const request: CreateQuickActionRequest = {
                emergency_contact_id: selectedContactId,
                action_type: selectedActionType,
                message: actionMessage,
                video_clip_ids: []
            };

            await quickActionApi.execute(selectedAlertForAction.id, request);

            // Refresh actions
            const actions = await quickActionApi.listForAlert(selectedAlertForAction.id);
            setQuickActions(prev => ({
                ...prev,
                [selectedAlertForAction.id]: actions
            }));

            setShowQuickActionDialog(false);
            alert('Quick action sent successfully!');
        } catch (error: any) {
            console.error('Failed to execute action:', error);
            alert(error.message || 'Failed to send action');
        } finally {
            setLoadingAction(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30';
        }
    };

    // Group alerts by pet
    const groupedAlerts = alerts.reduce((groups, alert) => {
        const petName = alert.pet_name || `Pet #${alert.pet_id}`;
        if (!groups[petName]) {
            groups[petName] = [];
        }
        groups[petName].push(alert);
        return groups;
    }, {} as Record<string, Alert[]>);

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-white">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Alerts</h1>
                        <p className="text-neutral-400 mt-2">Monitor and manage your pet alerts</p>
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => {
                            setSeverityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                {alerts.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-800 bg-neutral-950">
                        <AlertTriangle className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400 text-lg">No alerts found</p>
                        <p className="text-sm text-neutral-500 mt-2">
                            {severityFilter ? 'Try changing the severity filter' : 'Your pets are doing great!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Grouped Alerts */}
                        {Object.entries(groupedAlerts).map(([petName, petAlerts]) => (
                            <div key={petName}>
                                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                    {petName}
                                    <span className="text-sm text-neutral-500 font-normal">({petAlerts.length})</span>
                                </h2>

                                <div className="space-y-4">
                                    {petAlerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`rounded-lg border ${getSeverityColor(alert.severity_level)} bg-neutral-950 p-6`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity_level)}`}>
                                                            {alert.severity_level}
                                                        </span>
                                                        <span className="text-sm text-neutral-500">
                                                            {new Date(alert.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-white mb-2">{alert.alert_type}</h3>
                                                    {alert.message && (
                                                        <p className="text-neutral-300">{alert.message}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Critical Indicators */}
                                            {alert.critical_indicators && (
                                                <div className="mb-4 p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                                                    <p className="text-xs font-medium text-neutral-400 mb-2">Critical Indicators:</p>
                                                    <pre className="text-xs text-neutral-300 overflow-auto">
                                                        {JSON.stringify(alert.critical_indicators, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Recommended Actions */}
                                            {alert.recommended_actions && (
                                                <div className="mb-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                                                    <p className="text-xs font-medium text-indigo-400 mb-2">Recommended Actions:</p>
                                                    <pre className="text-xs text-neutral-300 overflow-auto">
                                                        {JSON.stringify(alert.recommended_actions, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* User Response */}
                                            {alert.user_response && (
                                                <div className="mb-4 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                                                    <p className="text-xs font-medium text-green-400 mb-1">Your Response:</p>
                                                    <p className="text-sm text-neutral-300">{alert.user_response}</p>
                                                    {alert.user_acknowledged_at && (
                                                        <p className="text-xs text-neutral-500 mt-2">
                                                            Acknowledged: {new Date(alert.user_acknowledged_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Outcome */}
                                            {alert.outcome && (
                                                <div className="mb-4">
                                                    <span className="text-xs text-neutral-500">Status: </span>
                                                    <span className="text-sm text-neutral-300">{alert.outcome}</span>
                                                </div>
                                            )}

                                            {/* Notification Information */}
                                            {alert.notification_sent && (
                                                <div className="mb-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                                    <p className="text-xs font-medium text-blue-400 mb-3">📧 Notification Delivery</p>

                                                    {/* Notification Channels */}
                                                    {alert.notification_channels && (
                                                        <div className="mb-3">
                                                            <p className="text-xs text-neutral-500 mb-2">Channels Used:</p>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {alert.notification_channels.email && (
                                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                                                                        ✉️ Email
                                                                    </span>
                                                                )}
                                                                {alert.notification_channels.sms && (
                                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                                                        💬 SMS
                                                                    </span>
                                                                )}
                                                                {alert.notification_channels.push && (
                                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                                                        🔔 Push
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Acknowledgement Timeline */}
                                                    {alert.user_notified_at && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                                                    <span className="text-neutral-400">Notified:</span>
                                                                    <span className="text-neutral-300">
                                                                        {new Date(alert.user_notified_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {alert.user_acknowledged_at && (
                                                                <>
                                                                    <div className="flex items-center gap-3 text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                                                            <span className="text-neutral-400">Acknowledged:</span>
                                                                            <span className="text-neutral-300">
                                                                                {new Date(alert.user_acknowledged_at).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500 ml-4">
                                                                        Response time: {Math.round((new Date(alert.user_acknowledged_at).getTime() - new Date(alert.user_notified_at).getTime()) / 1000 / 60)} minutes
                                                                    </div>
                                                                </>
                                                            )}

                                                            {!alert.user_acknowledged_at && (
                                                                <div className="flex items-center gap-2 text-xs text-amber-400">
                                                                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                                                                    <span>Awaiting acknowledgement via website</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Autonomous Action */}
                                            {alert.intervention_action && (
                                                <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start gap-3">
                                                    <div className="p-2 bg-indigo-500/20 rounded-full">
                                                        <Bot className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-indigo-300">Autonomous Action Taken</p>
                                                        <p className="text-xs text-indigo-400/80 mt-1">
                                                            {alert.intervention_action}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            {/* Quick Actions History */}
                                            {quickActions[alert.id] && quickActions[alert.id].length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-2">
                                                        <History className="h-3 w-3" />
                                                        Action History
                                                    </p>
                                                    <div className="space-y-2">
                                                        {quickActions[alert.id].map(action => (
                                                            <div key={action.id} className="text-xs bg-neutral-900 rounded p-2 flex justify-between items-center">
                                                                <span className="text-neutral-300">
                                                                    {action.action_type === 'call' ? '📞' : '💬'} {action.action_type === 'call' ? 'Called' : 'Messaged'} {action.contact_name}
                                                                </span>
                                                                <span className="text-neutral-500">
                                                                    {new Date(action.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {alert.outcome !== 'Resolved' && (
                                                <div className="flex gap-3">
                                                    {!alert.user_acknowledged_at && (
                                                        <button
                                                            onClick={() => handleAcknowledge(alert.id)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Acknowledge
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleResolve(alert.id)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Resolve
                                                    </button>
                                                    {(alert.severity_level.toLowerCase() === 'critical' || alert.severity_level.toLowerCase() === 'high') && (
                                                        <button
                                                            onClick={() => handleOpenQuickAction(alert)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition ml-auto"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Take Action
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                <span className="text-sm text-neutral-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-white hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Action Dialog */}
                {showQuickActionDialog && selectedAlertForAction && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold text-white mb-6">
                                Emergency Quick Action
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Select Emergency Contact
                                    </label>
                                    <select
                                        value={selectedContactId || ''}
                                        onChange={(e) => setSelectedContactId(Number(e.target.value))}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="" disabled>Select a contact</option>
                                        {contacts.map(contact => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.name} ({contact.contact_type}) - {contact.phone}
                                            </option>
                                        ))}
                                    </select>
                                    {contacts.length === 0 && (
                                        <p className="text-xs text-red-400 mt-1">
                                            No emergency contacts found. <a href="/profile" className="underline">Add one in your profile.</a>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Action Type
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedActionType('sms')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${selectedActionType === 'sms' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-800 text-neutral-400 hover:bg-neutral-900'}`}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            SMS
                                        </button>
                                        <button
                                            onClick={() => setSelectedActionType('call')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${selectedActionType === 'call' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-800 text-neutral-400 hover:bg-neutral-900'}`}
                                        >
                                            <Phone className="h-4 w-4" />
                                            Call
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={actionMessage}
                                        onChange={(e) => setActionMessage(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        rows={4}
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">
                                        This message will be sent immediately to the contact.
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                                    <Video className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-300">Video Evidence Attached</p>
                                        <p className="text-xs text-blue-400/80">
                                            The latest video clip of the reported behavior will be included in the message link.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowQuickActionDialog(false)}
                                    className="flex-1 rounded-lg border border-neutral-800 px-4 py-3 font-medium text-white hover:bg-neutral-900 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExecuteAction}
                                    disabled={loadingAction || !selectedContactId}
                                    className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                >
                                    {loadingAction ? 'Sending...' : 'Send Now'}
                                    {!loadingAction && <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout >
    );
}
