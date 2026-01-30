"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { alertApi, type Alert } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
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

                                            {/* Actions */}
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
            </div>
        </DashboardLayout>
    );
}
