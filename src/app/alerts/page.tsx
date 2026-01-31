"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { alertApi, type Alert } from '@/lib/api';
import { AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";
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

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-red-50 text-red-700 border-red-200';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
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
                        <h1 className="text-3xl font-bold text-neutral-900">Alerts</h1>
                        <p className="text-neutral-500 mt-2">Monitor and manage your pet alerts</p>
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => {
                            setSeverityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-neutral-900 focus:border-indigo-500 focus:outline-none shadow-sm"
                    >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                {alerts.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-neutral-200 bg-white shadow-sm max-w-2xl mx-auto">
                        <AlertTriangle className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-900 text-lg font-medium">No alerts found</p>
                        <p className="text-sm text-neutral-500 mt-2">
                            {severityFilter ? 'Try changing the severity filter' : 'Your pets are doing great!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Grouped Alerts */}
                        {Object.entries(groupedAlerts).map(([petName, petAlerts]) => (
                            <div key={petName}>
                                <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                    {petName}
                                    <span className="text-sm text-neutral-500 font-normal">({petAlerts.length})</span>
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {petAlerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            onClick={() => router.push(`/alerts/${alert.id}`)}
                                            className="group relative flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md cursor-pointer"
                                        >
                                            {/* Icon Badge */}
                                            <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-full border ${getSeverityColor(alert.severity_level)} bg-opacity-10`}>
                                                <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity_level).replace('bg-', 'text-').split(' ')[1]}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-bold text-neutral-900">{alert.alert_type}</p>
                                                    <span className="text-xs text-neutral-400">•</span>
                                                    <span className="text-xs text-neutral-500">{new Date(alert.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-neutral-600 truncate">{alert.message || 'No description available'}</p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-none">
                                                {alert.outcome === 'Resolved' ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        Resolved
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${alert.severity_level === 'critical' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                                        }`}>
                                                        {alert.severity_level.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-indigo-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>
                        <span className="text-sm text-neutral-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
