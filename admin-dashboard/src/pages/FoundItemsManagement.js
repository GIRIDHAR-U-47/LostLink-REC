import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminService';

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
            console.log('Fetching found items...');
            const response = await adminService.searchItems({
                item_type: 'FOUND',
                status: filters.status
            });
            console.log('Found items response:', response.data);
            setItems(response.data || []);
        } catch (error) {
            console.error('Error fetching found items:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.status]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAssignStorage = async (itemId) => {
        if (!storageLocation) {
            alert('Please enter storage location');
            return;
        }

        try {
            await adminService.assignStorage(itemId, storageLocation, remarks);

            // Optimistic UI Update: Update the local state immediately
            setItems(currentItems => currentItems.map(item =>
                (item.id === itemId || item._id === itemId)
                    ? { ...item, storage_location: storageLocation, admin_remarks: remarks, status: 'AVAILABLE' }
                    : item
            ));

            setStorageLocation('');
            setRemarks('');
            setSelectedItem(null);

            // Background refresh
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
                                <th>Thumbnail</th>
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
                                    <td>
                                        {(item.imageUrl || item.image_url) ? (
                                            <img
                                                src={`${adminService.getBaseUrl()}/${item.imageUrl || item.image_url}`}
                                                alt={item.category}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23f0f0f0" width="50" height="50"/%3E%3Ctext x="25" y="25" text-anchor="middle" dy=".3em" fill="%23999" font-size="8" font-family="sans-serif"%3ENo Img%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '10px', color: '#999' }}>No Img</div>
                                        )}
                                    </td>
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
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn" style={{ fontSize: '12px', padding: '5px 10px' }}
                                                onClick={() => setSelectedItem(item)}>
                                                Assign Storage
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Item Detail & Storage Modal */}
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
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Item Details</h2>
                            <button className="btn btn-danger" onClick={() => {
                                setSelectedItem(null);
                                setStorageLocation('');
                                setRemarks('');
                            }}>✕</button>
                        </div>

                        {(selectedItem.imageUrl || selectedItem.image_url) && (
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <img
                                    src={`${adminService.getBaseUrl()}/${selectedItem.imageUrl || selectedItem.image_url}`}
                                    alt={selectedItem.category}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div>
                                <p><strong>Category:</strong> {selectedItem.category}</p>
                                <p><strong>Location Found:</strong> {selectedItem.location}</p>
                            </div>
                            <div>
                                <p><strong>Status:</strong> {selectedItem.status || 'PENDING'}</p>
                                <p><strong>Date Reported:</strong> {new Date(selectedItem.dateTime).toLocaleDateString()}</p>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <p><strong>Description:</strong> {selectedItem.description}</p>
                            </div>
                        </div>

                        <hr />

                        <h3 style={{ marginTop: '20px' }}>Assign Storage Location</h3>
                        <div className="form-group">
                            <label>Storage Location (e.g., Rack A, Shelf 3)</label>
                            <input
                                type="text"
                                value={storageLocation}
                                onChange={(e) => setStorageLocation(e.target.value)}
                                placeholder="Enter storage location"
                                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Admin Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Optional remarks..."
                                rows="3"
                                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleAssignStorage(selectedItem.id || selectedItem._id)}>
                                Update Item
                            </button>
                            <button className="btn" style={{ flex: 1 }} onClick={() => setSelectedItem(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoundItemsManagement;
