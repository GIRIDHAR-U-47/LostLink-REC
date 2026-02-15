import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

const ClaimsManagement = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: ''
    });
    const [remarks, setRemarks] = useState('');

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.getClaimsByStatus(filters.status);
            setClaims(response.data || []);
        } catch (error) {
            console.log('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.status]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const handleClaimAction = async (claimId, action) => {
        try {
            const status = action === 'approved' ? 'APPROVED' : 'REJECTED';
            await adminService.verifyClaim(claimId, status);

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
                                        <div className="item-name">{claim.item_name}</div>
                                        <div className="item-id">ID: {claim.item_id}</div>
                                    </td>
                                    <td>
                                        <div className="claimant-name">{claim.user_name}</div>
                                        <div className="claimant-email">{claim.user_email}</div>
                                    </td>
                                    <td>{new Date(claim.claim_date).toLocaleDateString()}</td>
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
                                                        }}
                                                    >
                                                        Review
                                                    </button>
                                                </>
                                            )}
                                            {claim.status !== 'PENDING' && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => {
                                                        setSelectedClaim(claim);
                                                    }}
                                                >
                                                    View Details
                                                </button>
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
                            <h4>Item Details</h4>
                            <p><strong>Category:</strong> {selectedClaim.item?.category || selectedClaim.category || 'N/A'}</p>
                            <p><strong>Description:</strong> {selectedClaim.item?.description || selectedClaim.description || 'N/A'}</p>
                            {(selectedClaim.item?.image_url || selectedClaim.item?.imageUrl || selectedClaim.imageUrl || selectedClaim.image_url) && (
                                <img
                                    src={`${API_BASE_URL.replace('/api', '')}/${selectedClaim.item?.image_url || selectedClaim.item?.imageUrl || selectedClaim.imageUrl || selectedClaim.image_url}`}
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
                            <p><strong>Name:</strong> {selectedClaim.claimant?.name || selectedClaim.claimantName || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedClaim.claimant?.email || selectedClaim.claimantEmail || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedClaim.claimant?.phone || selectedClaim.claimantPhone || 'N/A'}</p>
                            <p><strong>Hostel/Room:</strong> {selectedClaim.claimant?.department || selectedClaim.hostel || 'N/A'}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4>Verification Information</h4>
                            <p><strong>Proof of Ownership:</strong> {selectedClaim.proofOfOwnership || 'Not provided'}</p>
                            <p><strong>Item Identifiers:</strong> {selectedClaim.identifierDetails || 'Not provided'}</p>
                        </div>

                        <div className="form-group">
                            <label>Admin Remarks & Decision</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter your decision and remarks..."
                                rows="4"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
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
        </div>
    );
};

export default ClaimsManagement;
