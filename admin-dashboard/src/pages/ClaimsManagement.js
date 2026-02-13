import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

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
            const token = localStorage.getItem('userToken');
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);

            const response = await axios.get(`${API_BASE}/admin/items/search?item_type=CLAIM${params ? '&' + params : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClaims(response.data || []);
        } catch (error) {
            console.log('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const handleClaimAction = async (claimId, action) => {
        try {
            const token = localStorage.getItem('userToken');
            const payload = {
                status: action === 'approved' ? 'APPROVED' : 'REJECTED',
                admin_remarks: remarks
            };

            await axios.put(`${API_BASE}/claims/${claimId}/verify`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Claim ${action} successfully`);
            setRemarks('');
            setSelectedClaim(null);
            fetchClaims();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
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
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
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
                    <div className="empty-state-icon">-</div>
                    <p>No claims to display</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Claimant Name</th>
                                <th>Item Category</th>
                                <th>Item Description</th>
                                <th>Status</th>
                                <th>Claim Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(claim => (
                                <tr key={claim.id || claim._id}>
                                    <td><strong>{claim.claimantName || 'N/A'}</strong></td>
                                    <td>{claim.category}</td>
                                    <td>{claim.description}</td>
                                    <td>
                                        <span className={`badge badge-${claim.status?.toLowerCase() || 'pending'}`}
                                            style={{ backgroundColor: getStatusColor(claim.status || 'PENDING') }}>
                                            {claim.status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td>{new Date(claim.dateTime).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn"
                                            style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                                            onClick={() => setSelectedClaim(claim)}
                                            disabled={claim.status !== 'PENDING'}
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Claim Review Modal */}
            {selectedClaim && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    overflow: 'auto'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2>Review Claim</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <h4>Item Details</h4>
                            <p><strong>Category:</strong> {selectedClaim.category}</p>
                            <p><strong>Description:</strong> {selectedClaim.description}</p>
                            {selectedClaim.imageUrl && (
                                <img
                                    src={`http://10.234.72.182:8080/${selectedClaim.imageUrl}`}
                                    alt={selectedClaim.category}
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
                            <p><strong>Name:</strong> {selectedClaim.claimantName || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedClaim.claimantEmail || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedClaim.claimantPhone || 'N/A'}</p>
                            <p><strong>Hostel/Room:</strong> {selectedClaim.hostel || 'N/A'}</p>
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
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn"
                                style={{ backgroundColor: '#28a745', flex: 1 }}
                                onClick={() => handleClaimAction(selectedClaim.id || selectedClaim._id, 'approved')}
                            >
                                ✓ Approve Claim
                            </button>
                            <button
                                className="btn"
                                style={{ backgroundColor: '#dc3545', flex: 1 }}
                                onClick={() => handleClaimAction(selectedClaim.id || selectedClaim._id, 'rejected')}
                            >
                                ✕ Reject Claim
                            </button>
                            <button
                                className="btn btn-secondary"
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
