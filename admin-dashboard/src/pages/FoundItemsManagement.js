import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

const FoundItemsManagement = () => {
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
    const [storageLocation, setStorageLocation] = useState('');
    const [remarks, setRemarks] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const params = new URLSearchParams();
            if (searchQuery) params.append('query', searchQuery);
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);
            params.append('item_type', 'FOUND');

            const response = await axios.get(`${API_BASE}/admin/items/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data || []);
        } catch (error) {
            console.log('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAssignStorage = async (itemId) => {
        if (!storageLocation) {
            alert('Please enter storage location');
            return;
        }

        try {
            const token = localStorage.getItem('userToken');
            await axios.put(`${API_BASE}/admin/items/${itemId}/assign-storage`, {
                storage_location: storageLocation,
                admin_remarks: remarks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Storage location assigned successfully');
            setStorageLocation('');
            setRemarks('');
            setSelectedItem(null);
            fetchItems();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div>
            <h1>Found Items Management</h1>

            {/* Search & Filters */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, category, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button" onClick={fetchItems}>Search</button>
            </div>

            <div className="search-container" style={{ gap: '10px' }}>
                <select
                    className="search-input"
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
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
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RETURNED">Returned</option>
                </select>
            </div>

            {/* Items Table */}
            {loading ? (
                <div className="loading">Loading items...</div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">-</div>
                    <p>No found items to display</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Location Found</th>
                                <th>Status</th>
                                <th>Storage Location</th>
                                <th>Date Reported</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id || item._id}>
                                    <td><strong>{item.category}</strong></td>
                                    <td>{item.description}</td>
                                    <td>{item.location}</td>
                                    <td>
                                        <span className={`badge badge-${item.status?.toLowerCase() || 'pending'}`}>
                                            {item.status || 'PENDING'}
                                        </span>
                                    </td>
                                    <td>{item.storage_location || 'Not assigned'}</td>
                                    <td>{new Date(item.dateTime).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn" style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                                            onClick={() => setSelectedItem(item)}>
                                            Assign Storage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Storage Assignment Modal */}
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
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2>Assign Storage Location</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Item: {selectedItem.category}</p>

                        <div className="form-group">
                            <label>Storage Location (e.g., Rack A, Shelf 3)</label>
                            <input
                                type="text"
                                value={storageLocation}
                                onChange={(e) => setStorageLocation(e.target.value)}
                                placeholder="Enter storage location"
                            />
                        </div>

                        <div className="form-group">
                            <label>Admin Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Optional remarks..."
                                rows="3"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-success" onClick={() => handleAssignStorage(selectedItem.id || selectedItem._id)}>
                                Confirm
                            </button>
                            <button className="btn btn-danger" onClick={() => setSelectedItem(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoundItemsManagement;
