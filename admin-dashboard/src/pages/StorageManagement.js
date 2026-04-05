import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminService';
import { formatDate, getTrackingId } from '../utils/helpers';

const StorageManagement = () => {
    const [inventory, setInventory] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [activeTab, setActiveTab] = useState('grid');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, repRes] = await Promise.all([
                adminService.getStorageInventory(),
                adminService.getStorageReport()
            ]);
            setInventory(invRes.data);
            setReport(repRes.data);
        } catch (err) {
            console.error('Storage data fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getOccupancyColor = (count) => {
        if (count >= 10) return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '🔴' };
        if (count >= 5) return { bg: '#fff7ed', border: '#f97316', text: '#9a3412', icon: '🟠' };
        if (count >= 1) return { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '🟢' };
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', icon: '⚪' };
    };

    const getCategoryIcon = (cat) => {
        const icons = {
            'DEVICES': '📱', 'DOCUMENTS': '📄', 'KEYS': '🔑', 'ACCESSORIES': '👜',
            'PERSONAL_ITEMS': '🎒', 'BOOKS': '📚', 'JEWELLERY': '💎', 'OTHERS': '📦'
        };
        return icons[cat] || '📦';
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', color: '#6c5ce7' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#636e72' }}>Loading storage inventory...</div>
        </div>
    );

    return (
        <div style={{ padding: '20px 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Storage Management</h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Visual inventory of physical storage locations and items</p>
                </div>
                <button onClick={fetchData} style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>↻ Refresh</button>
            </div>

            {/* Summary KPIs */}
            {inventory?.summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    {[
                        { label: 'Storage Locations', value: inventory.summary.total_locations, color: '#6c5ce7', icon: '📍' },
                        { label: 'Total Stored Items', value: inventory.summary.total_stored_items, color: '#10b981', icon: '📦' },
                        { label: 'Unassigned Items', value: inventory.summary.unassigned_items, color: inventory.summary.unassigned_items > 0 ? '#ef4444' : '#94a3b8', icon: '⚠' },
                        { label: 'High-Value Stored', value: report?.high_value_in_storage || 0, color: '#f59e0b', icon: '💎' },
                        { label: 'Aging (>30 days)', value: report?.aging_report?.over_30_days || 0, color: report?.aging_report?.over_30_days > 0 ? '#ef4444' : '#94a3b8', icon: '⏰' },
                    ].map((kpi, i) => (
                        <div key={i} style={{
                            background: 'white', borderRadius: '14px', padding: '20px',
                            borderLeft: `4px solid ${kpi.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{kpi.icon} {kpi.label}</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{kpi.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[{ key: 'grid', label: '🗄 Location Grid' }, { key: 'report', label: '📊 Aging Report' }, { key: 'list', label: '📋 Full Inventory' }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                            background: activeTab === tab.key ? '#6c5ce7' : '#fff',
                            color: activeTab === tab.key ? '#fff' : '#475569',
                            border: `1px solid ${activeTab === tab.key ? '#6c5ce7' : '#e2e8f0'}`
                        }}>{tab.label}</button>
                ))}
            </div>

            {/* ===== LOCATION GRID VIEW ===== */}
            {activeTab === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {inventory?.locations?.length > 0 ? inventory.locations.map((loc, i) => {
                        const colors = getOccupancyColor(loc.total_items);
                        return (
                            <div key={i} onClick={() => setSelectedLocation(loc)}
                                style={{
                                    background: 'white', borderRadius: '16px', overflow: 'hidden',
                                    border: `2px solid ${selectedLocation?.location === loc.location ? '#6c5ce7' : colors.border + '40'}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                <div style={{ padding: '16px 20px', background: colors.bg, borderBottom: `1px solid ${colors.border}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>📍 {loc.location}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px' }}>{colors.icon}</span>
                                        <span style={{ fontSize: '20px', fontWeight: '800', color: colors.text }}>{loc.total_items}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 20px' }}>
                                    {/* Category breakdown chips */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                        {Object.entries(loc.categories || {}).map(([cat, count]) => (
                                            <span key={cat} style={{
                                                fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                                                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe'
                                            }}>{getCategoryIcon(cat)} {cat}: {count}</span>
                                        ))}
                                    </div>
                                    {loc.oldest_item_date && (
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Oldest item: {formatDate(loc.oldest_item_date)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                            No storage locations found. Assign storage to found items to see them here.
                        </div>
                    )}
                </div>
            )}

            {/* ===== AGING REPORT VIEW ===== */}
            {activeTab === 'report' && report && (
                <div>
                    {/* Aging Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { label: 'Under 7 Days', value: report.aging_report.under_7_days, color: '#10b981', bg: '#f0fdf4' },
                            { label: '7-30 Days', value: report.aging_report['7_to_30_days'], color: '#f59e0b', bg: '#fefce8' },
                            { label: 'Over 30 Days', value: report.aging_report.over_30_days, color: '#ef4444', bg: '#fef2f2' },
                        ].map((item, i) => (
                            <div key={i} style={{ background: item.bg, borderRadius: '14px', padding: '24px', textAlign: 'center', border: `1px solid ${item.color}20` }}>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: item.color }}>{item.value}</div>
                                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: item.color, marginTop: '4px' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Old Items Detail */}
                    {report.aging_report.old_items_detail?.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #fecaca' }}>
                            <div style={{ padding: '16px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                                ⚠ Items Stored Over 30 Days — Consider Archive or Disposal
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Location</th>
                                            <th>Days Stored</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.aging_report.old_items_detail.map((item, i) => (
                                            <tr key={i}>
                                                <td><span style={{ fontWeight: '600' }}>{getCategoryIcon(item.category)} {item.category}</span></td>
                                                <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || 'N/A'}</td>
                                                <td>{item.storage_location || 'Unassigned'}</td>
                                                <td>
                                                    <span style={{ fontWeight: '700', color: item.days_stored > 60 ? '#dc2626' : '#f59e0b' }}>
                                                        {item.days_stored} days
                                                    </span>
                                                </td>
                                                <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== FULL INVENTORY LIST VIEW ===== */}
            {activeTab === 'list' && (
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Date Found</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory?.locations?.flatMap(loc => loc.items.map((item, i) => (
                                    <tr key={`${loc.location}-${i}`}>
                                        <td><span style={{ fontWeight: '600', fontSize: '13px' }}>📍 {loc.location}</span></td>
                                        <td>{getCategoryIcon(item.category)} {item.category}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || 'N/A'}</td>
                                        <td>{item.dateTime ? formatDate(item.dateTime) : 'N/A'}</td>
                                        <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                    </tr>
                                )))}
                                {(!inventory?.locations || inventory.locations.length === 0) && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No items in storage</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== LOCATION DETAIL MODAL ===== */}
            {selectedLocation && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: '20px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '20px 28px', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '700', color: 'white' }}>📍 {selectedLocation.location}</h3>
                                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>{selectedLocation.total_items} items stored</div>
                            </div>
                            <button onClick={() => setSelectedLocation(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px' }}>✕</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(85vh - 80px)' }}>
                            {/* Category distribution */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                {Object.entries(selectedLocation.categories || {}).map(([cat, count]) => (
                                    <span key={cat} style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: '8px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                                        {getCategoryIcon(cat)} {cat}: {count}
                                    </span>
                                ))}
                            </div>
                            {/* Items list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedLocation.items.map((item, i) => (
                                    <div key={i} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{getCategoryIcon(item.category)} {item.category}</span>
                                            <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{item.description || 'No description'}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Found: {item.dateTime ? formatDate(item.dateTime) : 'N/A'}
                                            {item.Found_ID && <> • ID: {getTrackingId(item)}</>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageManagement;
