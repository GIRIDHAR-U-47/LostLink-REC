import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

const LostItemsViewer = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    });
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                query: searchQuery,
                category: filters.category,
                item_type: 'LOST'
            };

            const response = await adminService.searchItems(params);
            setItems(response.data || []);
        } catch (error) {
            console.log('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters.category]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSearch = () => {
        fetchItems();
    };

    const getRecencyLabel = (dateTime) => {
        const days = Math.floor((new Date() - new Date(dateTime)) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    };

    return (
        <div>
            <h1>Lost Items Viewer</h1>

            {/* Search Section */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, category, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="search-button" onClick={handleSearch}>Search</button>
            </div>

            {/* Filters */}
            <div className="search-container" style={{ gap: '10px', marginBottom: '20px' }}>
                <select
                    className="search-input"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                    <option value="">All Categories</option>
                    <option value="DEVICES">Devices</option>
                    <option value="DOCUMENTS">Documents</option>
                    <option value="ACCESSORIES">Accessories</option>
                    <option value="KEYS">Keys</option>
                    <option value="JEWELLERY">Jewellery</option>
                    <option value="BOOKS">Books</option>
                </select>

                <select
                    className="search-input"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="RETURNED">Returned</option>
                    <option value="NOT_FOUND">Not Found</option>
                </select>

                <input
                    type="date"
                    className="search-input"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
            </div>

            {/* Items Display */}
            {loading ? (
                <div className="loading">Loading lost items...</div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">-</div>
                    <p>No matching lost items found</p>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '20px', color: '#666' }}>
                        Found <strong>{items.length}</strong> lost item(s)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {items.map(item => (
                            <div
                                key={item.id || item._id}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    borderLeft: `4px solid ${item.status === 'RETURNED' ? '#28a745' :
                                        item.status === 'PENDING' ? '#ffc107' : '#6c757d'
                                        }`
                                }}
                                onClick={() => setSelectedItem(item)}
                            >
                                <div style={{ marginBottom: '10px' }}>
                                    <span className={`badge badge-${item.status?.toLowerCase() || 'pending'}`}>
                                        {item.status || 'PENDING'}
                                    </span>
                                    <span style={{ float: 'right', fontSize: '12px', color: '#999' }}>
                                        {getRecencyLabel(item.dateTime)}
                                    </span>
                                </div>

                                {(item.imageUrl || item.image_url) && (
                                    <div style={{ width: '100%', height: '160px', marginBottom: '10px', overflow: 'hidden', borderRadius: '4px', backgroundColor: '#f0f0f0' }}>
                                        <img
                                            src={`${API_BASE_URL.replace('/api', '')}/${item.imageUrl || item.image_url}`}
                                            alt={item.category}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.parentNode.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                <h3 style={{ margin: '10px 0' }}>{item.category}</h3>
                                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                                    <strong>Description:</strong> {item.description}
                                </p>
                                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                                    <strong>Location:</strong> {item.location}
                                </p>
                                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                                    <strong>Reporter:</strong> {item.user?.name || item.reporterName || 'Anonymous'}
                                </p>

                                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                    <button
                                        className="btn"
                                        style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedItem(item);
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
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
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        margin: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h2>{selectedItem.category}</h2>
                            <button
                                className="btn btn-danger"
                                onClick={() => setSelectedItem(null)}
                                style={{ marginTop: '-10px' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <span className={`badge badge-${selectedItem.status?.toLowerCase()}`}>
                                {selectedItem.status || 'PENDING'}
                            </span>
                        </div>

                        {(selectedItem.imageUrl || selectedItem.image_url) && (
                            <div style={{ marginBottom: '20px' }}>
                                <img
                                    src={`${API_BASE_URL.replace('/api', '')}/${selectedItem.imageUrl || selectedItem.image_url}`}
                                    alt={selectedItem.category}
                                    style={{
                                        maxWidth: '100%',
                                        height: '300px',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4>Item Information</h4>
                                <p><strong>Category:</strong> {selectedItem.category}</p>
                                <p><strong>Description:</strong> {selectedItem.description}</p>
                                <p><strong>Location Lost:</strong> {selectedItem.location}</p>
                                <p><strong>Date Lost:</strong> {new Date(selectedItem.dateTime).toLocaleDateString()}</p>
                            </div>

                            <div>
                                <h4>Reporter Information</h4>
                                <p><strong>Name:</strong> {selectedItem.user?.name || selectedItem.reporterName || 'Anonymous'}</p>
                                <p><strong>Register No:</strong> {selectedItem.user?.registerNumber || 'Not provided'}</p>
                                <p><strong>Email:</strong> {selectedItem.user?.email || selectedItem.reporterEmail || 'Not provided'}</p>
                            </div>
                        </div>

                        {selectedItem.admin_remarks && (
                            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <strong>Admin Remarks:</strong>
                                <p>{selectedItem.admin_remarks}</p>
                            </div>
                        )}

                        {selectedItem.verified_by && (
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                                <strong>Verified by:</strong> {selectedItem.verified_by}
                                {selectedItem.verified_at && (
                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                        on {new Date(selectedItem.verified_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '20px' }}>
                            <button className="btn" onClick={() => setSelectedItem(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LostItemsViewer;
