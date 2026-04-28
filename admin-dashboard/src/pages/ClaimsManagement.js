import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';
import { formatDateTime, getItemId } from '../utils/helpers';

const ClaimsManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const itemId = queryParams.get('id');

    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', view: 'prioritized' });
    const [remarks, setRemarks] = useState('');
    const [proofReviewed, setProofReviewed] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [handoverData, setHandoverData] = useState({ student_id: '', admin_name: '', remarks: '' });
    // Issue 3: Messaging
    const [messageText, setMessageText] = useState('');
    const [requireResponse, setRequireResponse] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    // Issue 3: Rejection
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionRemarks, setRejectionRemarks] = useState('');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [claimContext, setClaimContext] = useState(null);
    const [contextLoading, setContextLoading] = useState(false);

    const handleHandover = async (e) => {
        e.preventDefault();
        if (!selectedClaim || !selectedClaim.item) return;
        const hItemId = getItemId(selectedClaim.item);
        setUpdating(true);
        try {
            await adminService.handoverItem(hItemId, handoverData);
            alert('Physical handover recorded successfully!');
            setShowHandoverModal(false);
            setSelectedClaim(null);
            setClaimContext(null);
            fetchClaims();
        } catch (error) {
            alert('Handover Failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (itemId) {
                response = await adminService.getClaimsForItem(itemId);
                setClaims(response.data || []);
            } else if (filters.view === 'prioritized' && !filters.status) {
                response = await adminService.getPrioritizedClaims();
                setClaims(response.data || []);
            } else {
                response = await adminService.getClaimsByStatus(filters.status);
                setClaims(response.data || []);
            }
        } catch (error) {
            console.error('Claims fetch failed:', error);
            // Fallback to regular claims
            try {
                const fallback = await adminService.getClaimsByStatus(filters.status);
                setClaims(fallback.data || []);
            } catch (e2) {
                alert('Claims Fetch Failed: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.view, itemId]);

    useEffect(() => { fetchClaims(); }, [fetchClaims]);

    // Issue 1: Load full context when a claim is selected
    const loadClaimContext = async (claim) => {
        const claimId = getItemId(claim);
        setSelectedClaim(claim);
        setProofReviewed(false);
        setRemarks('');
        setContextLoading(true);
        setClaimContext(null);
        try {
            const res = await adminService.getClaimFullContext(claimId);
            setClaimContext(res.data);
        } catch (err) {
            console.error('Context load failed:', err);
        } finally {
            setContextLoading(false);
        }
    };

    const handleClaimAction = async (claimId, action) => {
        try {
            const status = action === 'approved' ? 'APPROVED' : 'REJECTED';
            await adminService.verifyClaim(claimId, status, remarks);
            alert(`Claim ${action} successfully`);
            setRemarks('');
            setSelectedClaim(null);
            setClaimContext(null);
            fetchClaims();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    // Issue 3: Send message to claimant
    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedClaim) return;
        const claimId = getItemId(selectedClaim);
        setSendingMessage(true);
        try {
            await adminService.sendClaimMessage(claimId, messageText, requireResponse);
            alert('Message sent to claimant!');
            setMessageText('');
            setRequireResponse(false);
            // Refresh context to show new message
            loadClaimContext(selectedClaim);
        } catch (err) {
            alert('Failed to send message: ' + (err.response?.data?.detail || err.message));
        } finally {
            setSendingMessage(false);
        }
    };

    // Issue 3: Reject with reason
    const handleRejectWithReason = async () => {
        if (!rejectionReason.trim()) { alert('Please provide a rejection reason'); return; }
        const claimId = getItemId(selectedClaim);
        setUpdating(true);
        try {
            await adminService.rejectClaimWithReason(claimId, rejectionReason, rejectionRemarks);
            alert('Claim rejected. Claimant has been notified with the reason.');
            setShowRejectModal(false);
            setSelectedClaim(null);
            setClaimContext(null);
            setRejectionReason('');
            setRejectionRemarks('');
            fetchClaims();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setUpdating(false);
        }
    };

    const getPriorityColor = (level) => {
        switch (level) {
            case 'URGENT': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: '#ef4444' };
            case 'HIGH': return { bg: '#fff7ed', border: '#f97316', text: '#9a3412', badge: '#f97316' };
            case 'MEDIUM': return { bg: '#fefce8', border: '#eab308', text: '#854d0e', badge: '#eab308' };
            default: return { bg: '#f0fdf4', border: '#22c55e', text: '#166534', badge: '#22c55e' };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#10b981';
            case 'REJECTED': return '#ef4444';
            case 'PENDING': return '#f59e0b';
            default: return '#6c757d';
        }
    };

    const imgBase = API_BASE_URL.replace('/api', '');

    return (
        <div style={{ padding: '20px 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>Claims Command Center</h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Prioritized claim verification with full context comparison</p>
                </div>
                <button onClick={fetchClaims} style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>
                    ↻ Refresh
                </button>
            </div>

            {/* View Toggle & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {[{ key: 'prioritized', label: '🎯 Prioritized' }, { key: 'all', label: '📋 All Claims' }].map(v => (
                        <button key={v.key} onClick={() => setFilters({ ...filters, view: v.key, status: v.key === 'prioritized' ? '' : filters.status })}
                            style={{
                                padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                background: filters.view === v.key ? '#6c5ce7' : '#fff',
                                color: filters.view === v.key ? '#fff' : '#475569', borderRadius: 0
                            }}>{v.label}</button>
                    ))}
                </div>
                {filters.view === 'all' && (
                    <select className="search-input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{ minWidth: '180px', flex: 'unset' }}>
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                )}
                {filters.view === 'prioritized' && (
                    <div style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '600', padding: '8px 16px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                        ⚡ Showing pending claims sorted by urgency score
                    </div>
                )}
            </div>

            {itemId && (
                <div style={{ backgroundColor: '#e0f2fe', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #7dd3fc', color: '#0369a1' }}>
                    <div style={{ fontWeight: '600' }}>📍 Showing claims for Item: <span style={{ fontFamily: 'monospace', background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{itemId.slice(-6).toUpperCase()}</span></div>
                    <button onClick={() => window.location.href = '/claims'} style={{ background: '#fff', border: '1px solid #0284c7', color: '#0284c7', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Clear Filter</button>
                </div>
            )}

            {/* Claims List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6c5ce7' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading claims...</div>
                </div>
            ) : claims.length === 0 ? (
                <div className="empty-state"><p>No claims to display</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {claims.map(claim => {
                        const priorityColors = getPriorityColor(claim.priority_level);
                        const isPrioritized = filters.view === 'prioritized' && claim.priority_level;
                        return (
                            <div key={getItemId(claim)} style={{
                                background: 'white', borderRadius: '14px', padding: '20px', border: `1px solid ${isPrioritized ? priorityColors.border + '40' : '#e2e8f0'}`,
                                borderLeft: isPrioritized ? `4px solid ${priorityColors.badge}` : '4px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s', cursor: 'pointer',
                            }}
                                onClick={() => loadClaimContext(claim)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{claim.item?.category || 'Unknown Item'}</span>
                                            <span style={{ fontSize: '11px', color: '#fff', background: getStatusColor(claim.status), padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>{claim.status}</span>
                                            {isPrioritized && (
                                                <span style={{ fontSize: '10px', color: '#fff', background: priorityColors.badge, padding: '3px 10px', borderRadius: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>{claim.priority_level}</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            <span>🆔 {claim.Claim_ID || getItemId(claim).slice(-6).toUpperCase()}</span>
                                            <span>👤 {claim.claimant?.name || 'Unknown'}</span>
                                            <span>📅 {formatDateTime(claim.submissionDate)}</span>
                                            {claim.hours_pending !== undefined && (
                                                <span style={{ 
                                                    color: (claim.days_pending >= 7) ? '#ef4444' : '#64748b', 
                                                    fontWeight: (claim.days_pending >= 7) ? '800' : '500',
                                                    backgroundColor: (claim.days_pending >= 7) ? '#fee2e2' : 'transparent',
                                                    padding: (claim.days_pending >= 7) ? '2px 8px' : '0',
                                                    borderRadius: '4px'
                                                }}>
                                                    ⏱ {claim.days_pending > 0 ? `${claim.days_pending}d` : `${Math.round(claim.hours_pending)}h`} pending
                                                    {claim.days_pending >= 7 && " 🚨 DEADLINE EXPIRED"}
                                                </span>
                                            )}
                                            {claim.competing_claims > 1 && <span style={{ color: '#ef4444', fontWeight: '700' }}>⚠ {claim.competing_claims} competing claims</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {isPrioritized && (
                                            <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: '10px', backgroundColor: priorityColors.bg, border: `1px solid ${priorityColors.border}30` }}>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: priorityColors.text }}>{claim.priority_score}</div>
                                                <div style={{ fontSize: '9px', color: priorityColors.text, fontWeight: '700', textTransform: 'uppercase' }}>Score</div>
                                            </div>
                                        )}
                                        {isPrioritized && claim.priority_reasons?.length > 0 && (
                                            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '200px' }}>
                                                {claim.priority_reasons.map((r, i) => <div key={i} style={{ marginBottom: '2px' }}>• {r}</div>)}
                                            </div>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); loadClaimContext(claim); }}
                                            style={{ padding: '8px 18px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', background: '#6c5ce7', color: '#fff', border: 'none' }}>
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* =================== FULL CONTEXT MODAL (Issue 1 + 2 + 3) =================== */}
            {selectedClaim && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex',
                    justifyContent: 'center', alignItems: 'flex-start', zIndex: 2000,
                    padding: '20px', overflowY: 'auto', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#f8fafc', borderRadius: '20px', maxWidth: '1200px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden', margin: '20px 0'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 30px', background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontWeight: '800', fontSize: '20px', color: 'white' }}>Claim Verification Center</h2>
                                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
                                    ID: {selectedClaim.Claim_ID || getItemId(selectedClaim).slice(-8).toUpperCase()} • {selectedClaim.status}
                                    {selectedClaim.priority_level && <> • Priority: {selectedClaim.priority_level}</>}
                                </div>
                            </div>
                            <button onClick={() => { setSelectedClaim(null); setClaimContext(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>

                        {contextLoading ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#6c5ce7' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading full context...</div>
                            </div>
                        ) : (
                            <div style={{ padding: '24px' }}>
                                {/* ===== SIDE-BY-SIDE COMPARISON (Issue 1) ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>

                                    {/* Found Item Card */}
                                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <div style={{ padding: '14px 20px', background: '#10b981', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📦 FOUND ITEM (Being Claimed)
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            {claimContext?.found_item ? (
                                                <>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>CATEGORY</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>{claimContext.found_item.category}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>DESCRIPTION</div>
                                                    <div style={{ fontSize: '14px', color: '#334155', marginBottom: '12px', lineHeight: '1.5' }}>{claimContext.found_item.description || 'No description'}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>LOCATION FOUND</div>
                                                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>{claimContext.found_item.location}</div>
                                                    {claimContext.found_item.storage_location && (
                                                        <>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>STORAGE</div>
                                                            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>📍 {claimContext.found_item.storage_location}</div>
                                                        </>
                                                    )}
                                                    {(claimContext.found_item.imageUrl || claimContext.found_item.image_url) && (
                                                        <img src={`${imgBase}/${claimContext.found_item.imageUrl || claimContext.found_item.image_url}`} alt="Found"
                                                            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                                    )}
                                                </>
                                            ) : <div style={{ color: '#94a3b8', fontSize: '13px' }}>Item data unavailable</div>}
                                        </div>
                                    </div>

                                    {/* Lost Item / Match Card */}
                                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <div style={{ padding: '14px 20px', background: '#ef4444', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            🔍 MATCHING LOST REPORT
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            {claimContext?.linked_lost_item ? (
                                                <>
                                                    <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '12px', fontSize: '11px', color: '#166534', fontWeight: '600' }}>✅ Linked Lost Report</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>CATEGORY</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>{claimContext.linked_lost_item.category}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>DESCRIPTION</div>
                                                    <div style={{ fontSize: '14px', color: '#334155', marginBottom: '12px', lineHeight: '1.5' }}>{claimContext.linked_lost_item.description || 'N/A'}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>REPORTED BY</div>
                                                    <div style={{ fontSize: '13px', color: '#334155' }}>{claimContext.linked_lost_item.reporter?.name || 'Unknown'}</div>
                                                </>
                                            ) : claimContext?.matching_lost_reports?.length > 0 ? (
                                                <>
                                                    <div style={{ padding: '8px 12px', background: '#fefce8', borderRadius: '8px', marginBottom: '12px', fontSize: '11px', color: '#854d0e', fontWeight: '600' }}>🤖 AI-Suggested Matches ({claimContext.matching_lost_reports.length})</div>
                                                    {claimContext.matching_lost_reports.map((lr, i) => (
                                                        <div key={i} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '8px', background: '#fafafa' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{lr.category}</span>
                                                                <span style={{ fontSize: '11px', fontWeight: '800', color: lr.similarity_score > 30 ? '#10b981' : '#f59e0b', background: lr.similarity_score > 30 ? '#f0fdf4' : '#fefce8', padding: '2px 8px', borderRadius: '6px' }}>
                                                                    {lr.similarity_score}% match
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{lr.description?.substring(0, 100) || 'No description'}</div>
                                                            {lr.shared_keywords?.length > 0 && (
                                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                                    {lr.shared_keywords.map((kw, ki) => (
                                                                        <span key={ki} style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{kw}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>By: {lr.reporter?.name || 'Unknown'}</div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>No matching lost reports found</div>}
                                        </div>
                                    </div>

                                    {/* Claimant + Proof Card */}
                                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <div style={{ padding: '14px 20px', background: '#8b5cf6', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            👤 CLAIMANT & PROOF
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            {claimContext?.claimant ? (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>
                                                            {claimContext.claimant.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{claimContext.claimant.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{claimContext.claimant.email}</div>
                                                            {claimContext.claimant.registerNumber && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Reg: {claimContext.claimant.registerNumber}</div>}
                                                        </div>
                                                    </div>
                                                    {/* Claimant Trust Score */}
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                                        <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f0fdf4', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#166534' }}>{claimContext.claimant.approved_claims || 0}</div>
                                                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Approved</div>
                                                        </div>
                                                        <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#fef2f2', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#991b1b' }}>{claimContext.claimant.rejected_claims || 0}</div>
                                                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>Rejected</div>
                                                        </div>
                                                        <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f5f3ff', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#5b21b6' }}>{claimContext.claimant.total_claims || 0}</div>
                                                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase' }}>Total</div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : <div style={{ color: '#94a3b8', fontSize: '13px' }}>Claimant info unavailable</div>}

                                            {/* Verification Details */}
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px', marginTop: '12px' }}>VERIFICATION DETAILS</div>
                                            <div style={{ fontSize: '13px', color: '#334155', padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                                                {selectedClaim.verificationDetails || claimContext?.claim?.verificationDetails || 'Not provided'}
                                            </div>

                                            {/* Proof Image */}
                                            {(selectedClaim.proofImageUrl || claimContext?.claim?.proofImageUrl) && (
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>PROOF IMAGE</div>
                                                    <img src={`${imgBase}/${selectedClaim.proofImageUrl || claimContext?.claim?.proofImageUrl}`} alt="Proof"
                                                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} />
                                                </div>
                                            )}

                                            {/* Other claims on same item */}
                                            {claimContext?.other_claims_on_item?.length > 0 && (
                                                <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>⚠ {claimContext.other_claims_on_item.length} Other Claim(s) on This Item</div>
                                                    {claimContext.other_claims_on_item.map((oc, i) => (
                                                        <div key={i} style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '4px' }}>
                                                            • {oc.claimant?.name || 'Unknown'} — {oc.status}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ===== MESSAGING SECTION (Issue 3) ===== */}
                                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        💬 Communication with Claimant
                                    </h4>
                                    {/* Message History */}
                                    {claimContext?.messages?.length > 0 && (
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                                            {claimContext.messages.map((msg, i) => (
                                                <div key={i} style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', background: msg.sender_role === 'ADMIN' ? '#ede9fe' : '#e0f2fe', borderLeft: `3px solid ${msg.sender_role === 'ADMIN' ? '#8b5cf6' : '#0ea5e9'}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '700', color: msg.sender_role === 'ADMIN' ? '#6d28d9' : '#0369a1' }}>
                                                            {msg.sender_role === 'ADMIN' ? '🛡 Admin' : '👤 Claimant'}: {msg.sender_name}
                                                        </span>
                                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{formatDateTime(msg.sent_at)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#334155' }}>{msg.message}</div>
                                                    {msg.require_response && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', fontWeight: '600' }}>⚠ Response requested</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* New Message */}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Ask for more proof, clarify details, or send instructions..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px', fontSize: '13px', resize: 'vertical' }} />
                                            <label style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={requireResponse} onChange={(e) => setRequireResponse(e.target.checked)} />
                                                Request response from claimant
                                            </label>
                                        </div>
                                        <button onClick={handleSendMessage} disabled={sendingMessage || !messageText.trim()}
                                            style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', background: '#3b82f6', whiteSpace: 'nowrap' }}>
                                            {sendingMessage ? 'Sending...' : '📤 Send'}
                                        </button>
                                    </div>
                                </div>

                                {/* ===== ACTION BUTTONS ===== */}
                                {selectedClaim.status === 'PENDING' && (
                                    <>
                                        {/* Proof Image Verification Checkbox */}
                                        {(selectedClaim.proofImageUrl || claimContext?.claim?.proofImageUrl) && (
                                            <div style={{ padding: '15px', background: '#fefce8', borderRadius: '12px', border: '1px solid #fef08a', marginBottom: '20px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#854d0e' }}>
                                                    <input type="checkbox" checked={proofReviewed} onChange={(e) => setProofReviewed(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                                    I confirm that I have reviewed the Proof of Ownership image/document
                                                </label>
                                            </div>
                                        )}

                                        {/* Authentication Role Check */}
                                        {localStorage.getItem('role') === 'ADMIN' ? (
                                            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Admin Decision Remarks (MANDATORY) *</label>
                                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
                                                        placeholder="Provide justification for approval or rejection..." rows="2"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button 
                                                        onClick={() => handleClaimAction(getItemId(selectedClaim), 'approved')}
                                                        disabled={!remarks.trim() || (selectedClaim.proofImageUrl && !proofReviewed)}
                                                        style={{ 
                                                            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', border: 'none', color: 'white',
                                                            background: (!remarks.trim() || (selectedClaim.proofImageUrl && !proofReviewed)) ? '#94a3b8' : '#10b981',
                                                            cursor: (!remarks.trim() || (selectedClaim.proofImageUrl && !proofReviewed)) ? 'not-allowed' : 'pointer'
                                                        }}>
                                                        ✅ Approve Claim
                                                    </button>
                                                    <button onClick={() => { setShowRejectModal(true); setRejectionReason(''); setRejectionRemarks(''); }}
                                                        style={{ flex: 1, padding: '14px', background: '#ef4444', borderRadius: '12px', fontWeight: '800', fontSize: '14px', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                        ❌ Reject with Reason
                                                    </button>
                                                    <button onClick={() => { setSelectedClaim(null); setClaimContext(null); }}
                                                        style={{ padding: '14px 28px', background: '#e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', color: '#475569', cursor: 'pointer' }}>
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '15px', background: '#fee2e2', borderRadius: '10px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
                                                ⛔ INSIGHT: You do not have elevated privileges (ADMIN role) to approve or reject this claim.
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Approved claim → Handover */}
                                {selectedClaim.status === 'APPROVED' && (
                                    <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <button onClick={() => { setHandoverData({ student_id: selectedClaim.claimant?.registerNumber || claimContext?.claimant?.registerNumber || '', admin_name: '', remarks: '' }); setShowHandoverModal(true); }}
                                            style={{ flex: 1, padding: '14px', background: '#10b981', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', color: 'white' }}>
                                            🤝 Record Physical Handover
                                        </button>
                                        <button onClick={() => { setSelectedClaim(null); setClaimContext(null); }}
                                            style={{ padding: '14px 28px', background: '#e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', color: '#475569' }}>
                                            Close
                                        </button>
                                    </div>
                                )}

                                {selectedClaim.status === 'REJECTED' && (
                                    <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        {(selectedClaim.rejection_reason || selectedClaim.admin_remarks || selectedClaim.adminRemarks) && (
                                            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', color: '#991b1b' }}>
                                                <strong>Rejection Reason:</strong> {selectedClaim.rejection_reason || selectedClaim.admin_remarks || selectedClaim.adminRemarks}
                                            </div>
                                        )}
                                        <button onClick={() => { setSelectedClaim(null); setClaimContext(null); }}
                                            style={{ padding: '14px 28px', background: '#e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', color: '#475569' }}>
                                            Close
                                        </button>
                                    </div>
                                )}
                                
                                {selectedClaim.status === 'RETURNED' && (
                                     <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <button onClick={() => { setSelectedClaim(null); setClaimContext(null); }}
                                            style={{ padding: '14px 28px', background: '#e2e8f0', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', color: '#475569' }}>
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== REJECT WITH REASON MODAL (Issue 3) ===== */}
            {showRejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500, backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'white', borderRadius: '20px', maxWidth: '480px', width: '90%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '24px 28px', background: '#ef4444', color: 'white' }}>
                            <h3 style={{ margin: 0, fontWeight: '800', color: 'white' }}>Reject Claim</h3>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>The claimant will be notified with your reason</div>
                        </div>
                        <div style={{ padding: '28px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>REJECTION REASON *</label>
                                <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', marginBottom: '8px' }}>
                                    <option value="">Select a reason...</option>
                                    <option value="Description does not match the found item">Description mismatch</option>
                                    <option value="Insufficient proof of ownership">Insufficient proof</option>
                                    <option value="Unable to verify identity">Identity not verified</option>
                                    <option value="Item already claimed by verified owner">Already claimed</option>
                                    <option value="Duplicate claim submission">Duplicate claim</option>
                                    <option value="other">Other (specify below)</option>
                                </select>
                                {rejectionReason === 'other' && (
                                    <textarea value={rejectionRemarks} onChange={(e) => { setRejectionReason(e.target.value || 'other'); setRejectionRemarks(e.target.value); }}
                                        placeholder="Specify the rejection reason..."
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '13px' }} />
                                )}
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>ADDITIONAL REMARKS (Optional)</label>
                                <textarea value={rejectionRemarks} onChange={(e) => setRejectionRemarks(e.target.value)}
                                    placeholder="Provide any additional context..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px', fontSize: '13px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={handleRejectWithReason} disabled={updating || !rejectionReason.trim() || rejectionReason === 'other'}
                                    style={{ flex: 1, padding: '14px', background: '#ef4444', borderRadius: '12px', fontWeight: '700', border: 'none', color: 'white' }}>
                                    {updating ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                                <button onClick={() => setShowRejectModal(false)}
                                    style={{ padding: '14px 24px', background: '#e2e8f0', borderRadius: '12px', fontWeight: '700', border: 'none', color: '#475569' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HANDOVER MODAL */}
            {showHandoverModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500, padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', maxWidth: '450px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
                        <div style={{ padding: '25px 30px', backgroundColor: '#10b981', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: '700', color: 'white' }}>Confirm Handover</h2>
                            <button onClick={() => setShowHandoverModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleHandover} style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '12px', fontSize: '13px', color: '#166534' }}>
                                You are about to mark this item as <strong>Returned</strong>. This requires physical verification.
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>STUDENT ID / REGISTER NO</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} placeholder="e.g. 21BE001"
                                    value={handoverData.student_id} onChange={(e) => setHandoverData({ ...handoverData, student_id: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>ADMIN SIGNATURE (NAME)</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} placeholder="Your full name"
                                    value={handoverData.admin_name} onChange={(e) => setHandoverData({ ...handoverData, admin_name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>HANDOVER REMARKS</label>
                                <textarea style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px' }} placeholder="Verified ID card, student collected in person..."
                                    value={handoverData.remarks} onChange={(e) => setHandoverData({ ...handoverData, remarks: e.target.value })} />
                            </div>
                            <button type="submit" disabled={updating}
                                style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                {updating ? 'Saving...' : 'Finalize Handover'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimsManagement;
