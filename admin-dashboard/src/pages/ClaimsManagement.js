import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

const ClaimsManagement = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const itemId = queryParams.get('id');

    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: ''
    });
    const [remarks, setRemarks] = useState('');
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [handoverData, setHandoverData] = useState({
        student_id: '',
        admin_name: '',
        remarks: ''
    });

    const handleHandover = async (e) => {
        e.preventDefault();
        if (!selectedClaim || !selectedClaim.item) return;
        const itemId = selectedClaim.item.id || selectedClaim.item._id;
        setUpdating(true);
        try {
            await adminService.handoverItem(itemId, handoverData);
            alert('Physical handover recorded successfully!');
            setShowHandoverModal(false);
            setSelectedClaim(null);
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
            } else {
                response = await adminService.getClaimsByStatus(filters.status);
            }
            console.log('Claims API Response:', response.data);
            setClaims(response.data || []);
        } catch (error) {
            console.error('Network Error Details:', {
                message: error.message,
                config: error.config,
                url: error.config?.url,
                headers: error.config?.headers
            });
            alert('Claims Fetch Failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [filters.status, itemId]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const handleClaimAction = async (claimId, action) => {
        try {
            const status = action === 'approved' ? 'APPROVED' : 'REJECTED';
            await adminService.verifyClaim(claimId, status, remarks);

            alert(`Claim ${action} successfully`);
            setRemarks('');
            setSelectedClaim(null);
            fetchClaims();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#28a745';
            case 'REJECTED': return '#dc3545';
            case 'PENDING': return '#ffc107';
            default: return '#6c757d';
        }
    };

    return (
        <div>
            <h1>Claims Management</h1>

            {/* Filters */}
            <div className="search-container" style={{ gap: '10px', marginBottom: '20px' }}>
                <select
                    className="search-input"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Claims</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                <button className="search-button" onClick={fetchClaims}>Refresh</button>
            </div>

            {itemId && (
                <div style={{
                    backgroundColor: '#e0f2fe',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #7dd3fc',
                    color: '#0369a1'
                }}>
                    <div style={{ fontWeight: '600' }}>
                        📍 Showing claims for Item ID: <span style={{ fontFamily: 'monospace', background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{itemId}</span>
                    </div>
                    <button
                        onClick={() => window.location.href = '/admin/claims'}
                        style={{ background: '#fff', border: '1px solid #0284c7', color: '#0284c7', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Claims Table */}
            {loading ? (
                <div className="loading">Loading claims...</div>
            ) : claims.length === 0 ? (
                <div className="empty-state">
                    <p>No claims to display</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="claims-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Claimant Details</th>
                                <th>Claim Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(claim => (
                                <tr key={claim.id || claim._id}>
                                    <td>
                                        <div className="item-name">{claim.item?.category || 'Unknown Item'}</div>
                                        <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '4px 0' }}>CLAIM ID: {claim.Claim_ID || (claim.id || claim._id).substring(0, 8).toUpperCase()}</div>
                                        <div className="item-id">Item ID: {claim.item?.Lost_ID || claim.item?.Found_ID || (claim.item?.id || claim.item?._id)?.substring(0, 8)}</div>
                                    </td>
                                    <td>
                                        <div className="claimant-name">{claim.claimant?.name || 'Unknown User'}</div>
                                        <div className="claimant-email">{claim.claimant?.email}</div>
                                        {claim.claimant?.registerNumber && <div style={{ fontSize: '11px', color: '#666' }}>{claim.claimant.registerNumber}</div>}
                                    </td>
                                    <td>{new Date(claim.submissionDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge badge-${claim.status.toLowerCase()}`}
                                            style={{ backgroundColor: getStatusColor(claim.status) }}>
                                            {claim.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {claim.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => {
                                                            setSelectedClaim(claim);
                                                            setRemarks('');
                                                        }}
                                                    >
                                                        Review
                                                    </button>
                                                </>
                                            )}
                                            {claim.status !== 'PENDING' && (
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => {
                                                            setSelectedClaim(claim);
                                                            setRemarks(claim.adminRemarks || claim.admin_remarks || '');
                                                            setHandoverData({
                                                                student_id: claim.claimant?.registerNumber || '',
                                                                admin_name: '',
                                                                remarks: ''
                                                            });
                                                        }}
                                                    >
                                                        Details
                                                    </button>
                                                    {claim.status === 'APPROVED' && (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            style={{ backgroundColor: '#10b981' }}
                                                            onClick={() => {
                                                                setSelectedClaim(claim);
                                                                setHandoverData({
                                                                    student_id: claim.claimant?.registerNumber || '',
                                                                    admin_name: '',
                                                                    remarks: ''
                                                                });
                                                                setShowHandoverModal(true);
                                                            }}
                                                        >
                                                            Handover
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Claim Details Modal */}
            {selectedClaim && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>Item Details</h4>
                                <button
                                    onClick={() => window.location.href = `/admin/found-items?search=${selectedClaim.item?.Found_ID}`}
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #6c5ce7', background: '#fff', color: '#6c5ce7', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    View Asset Case
                                </button>
                            </div>
                            <p><strong>Category:</strong> {selectedClaim.item?.category || 'N/A'}</p>
                            <p><strong>Description:</strong> {selectedClaim.item?.description || 'N/A'}</p>
                            {(selectedClaim.item?.imageUrl || selectedClaim.item?.image_url) && (
                                <img
                                    src={`${API_BASE_URL.replace('/api', '')}/${selectedClaim.item?.imageUrl || selectedClaim.item?.image_url}`}
                                    alt={selectedClaim.item?.category}
                                    style={{
                                        maxWidth: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        marginTop: '10px'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            )}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4>Claimant Information</h4>
                            <p><strong>Name:</strong> {selectedClaim.claimant?.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedClaim.claimant?.email || 'N/A'}</p>
                            <p><strong>Register No:</strong> {selectedClaim.claimant?.registerNumber || 'N/A'}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4>Verification Information</h4>
                            <p><strong>Description/Proof:</strong> {selectedClaim.verificationDetails || 'Not provided'}</p>

                            {selectedClaim.proofImageUrl && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>Proof Image:</strong>
                                    <img
                                        src={`${API_BASE_URL.replace('/api', '')}/${selectedClaim.proofImageUrl}`}
                                        alt="Proof"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: '4px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Admin Remarks & Decision</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter your decision and remarks..."
                                rows="4"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                disabled={selectedClaim.status !== 'PENDING'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                className="btn"
                                style={{ backgroundColor: '#28a745', flex: 1, color: 'white', padding: '10px', border: 'none', borderRadius: '4px' }}
                                onClick={() => handleClaimAction(selectedClaim.id || selectedClaim._id, 'approved')}
                            >
                                Approve Claim
                            </button>
                            <button
                                className="btn"
                                style={{ backgroundColor: '#dc3545', flex: 1, color: 'white', padding: '10px', border: 'none', borderRadius: '4px' }}
                                onClick={() => handleClaimAction(selectedClaim.id || selectedClaim._id, 'rejected')}
                            >
                                Reject Claim
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{ padding: '10px 20px', border: 'none', borderRadius: '4px' }}
                                onClick={() => setSelectedClaim(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Physical Handover Modal */}
            {showHandoverModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2100, padding: '20px', backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', maxWidth: '450px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '25px 30px', backgroundColor: '#10b981', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: '700', color: 'white' }}>Confirm Handover</h2>
                            <button onClick={() => setShowHandoverModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleHandover} style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '12px', fontSize: '13px', color: '#166534' }}>
                                You are about to mark this item as <strong>Returned</strong>. This requires physical verification of the student ID.
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>STUDENT ID / REGISTER NO</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    placeholder="e.g. 21BE001"
                                    value={handoverData.student_id}
                                    onChange={(e) => setHandoverData({ ...handoverData, student_id: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>ADMIN SIGNATURE (NAME)</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    placeholder="Your full name"
                                    value={handoverData.admin_name}
                                    onChange={(e) => setHandoverData({ ...handoverData, admin_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>HANDOVER REMARKS</label>
                                <textarea
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px' }}
                                    placeholder="Verified ID card, student collected in person..."
                                    value={handoverData.remarks}
                                    onChange={(e) => setHandoverData({ ...handoverData, remarks: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updating}
                                style={{
                                    width: '100%', padding: '16px',
                                    backgroundColor: '#10b981', color: 'white',
                                    border: 'none', borderRadius: '12px',
                                    fontWeight: '700', cursor: 'pointer'
                                }}
                            >
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
