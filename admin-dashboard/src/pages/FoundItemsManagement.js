import React, { useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

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
    const [updating, setUpdating] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.searchItems({
                item_type: 'FOUND',
                status: filters.status,
                query: searchQuery,
                category: filters.category
            });
            setItems(response.data || []);
        } catch (error) {
            console.error('Error fetching found items:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.status, searchQuery, filters.category]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAssignStorage = async (itemId) => {
        if (!storageLocation) {
            alert('Please enter storage location');
            return;
        }

        setUpdating(true);
        try {
            await adminService.assignStorage(itemId, storageLocation, remarks);

            // Optimistic UI Update
            setItems(currentItems => currentItems.map(item =>
                (item.id === itemId || item._id === itemId)
                    ? { ...item, storage_location: storageLocation, admin_remarks: remarks, status: 'AVAILABLE' }
                    : item
            ));

            setStorageLocation('');
            setRemarks('');
            setSelectedItem(null);
            alert('Item verified and storage assigned successfully!');
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const getRecencyLabel = (dateTime) => {
        const days = Math.floor((new Date() - new Date(dateTime)) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return new Date(dateTime).toLocaleDateString();
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#2d3436', fontSize: '2.5rem', fontWeight: '800' }}>Found Items Management</h1>
                <div style={{ color: '#636e72', fontWeight: '500' }}>
                    {items.length} Discoveries Pending Action
                </div>
            </div>

            {/* Premium Search & Filters */}
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                marginBottom: '30px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <input
                        type="text"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #dfe6e9',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                        placeholder="Search categories, descriptions, or locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #dfe6e9',
                        backgroundColor: 'white',
                        minWidth: '180px',
                        cursor: 'pointer'
                    }}
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
                    style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #dfe6e9',
                        backgroundColor: 'white',
                        minWidth: '180px',
                        cursor: 'pointer'
                    }}
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="AVAILABLE">Available / Verified</option>
                    <option value="RETURNED">Returned to Owner</option>
                </select>

                <button
                    onClick={fetchItems}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#6c5ce7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)'
                    }}
                >
                    Search Database
                </button>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#636e72' }}>
                    <p style={{ fontSize: '18px' }}>Syncing discovery logs...</p>
                </div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '16px', color: '#b2bec3' }}>
                    <p style={{ fontSize: '20px' }}>No found items recorded in this sector.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {items.map(item => (
                        <div
                            key={item.id || item._id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                border: '1px solid #f1f2f6',
                                position: 'relative'
                            }}
                            onClick={() => {
                                setSelectedItem(item);
                                setStorageLocation(item.storage_location || '');
                                setRemarks(item.admin_remarks || '');
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                            }}
                        >
                            {(item.imageUrl || item.image_url) ? (
                                <div style={{ height: '200px', position: 'relative' }}>
                                    <img
                                        src={`${adminService.getBaseUrl()}/${item.imageUrl || item.image_url}`}
                                        alt={item.category}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '6px 14px',
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        borderRadius: '30px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        color: '#2d3436',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {item.category}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '160px', backgroundColor: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔎</div>
                                    <div style={{ color: 'white', fontWeight: '600' }}>{item.category}</div>
                                </div>
                            )}

                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        backgroundColor: item.status === 'AVAILABLE' ? '#d1fae5' :
                                            item.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                        color: item.status === 'AVAILABLE' ? '#059669' :
                                            item.status === 'PENDING' ? '#d97706' : '#dc2626'
                                    }}>
                                        {item.status || 'PENDING'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                                        {getRecencyLabel(item.dateTime)}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '1.25rem' }}>{item.category}</h3>
                                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '15px', height: '40px', overflow: 'hidden' }}>{item.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>
                                        <strong>Found at:</strong> {item.location}
                                    </div>
                                    <div style={{ fontSize: '18px' }} title="Details / Manage">➡️</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Management Modal */}
            {selectedItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000, padding: '20px', backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', maxWidth: '850px', width: '100%',
                        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{
                            padding: '25px 30px',
                            backgroundColor: '#6c5ce7',
                            color: 'white',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontWeight: '700' }}>Discovery Management</h2>
                            <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px', gap: '40px' }}>
                                <div>
                                    {(selectedItem.imageUrl || selectedItem.image_url) && (
                                        <div style={{ marginBottom: '25px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                            <img src={`${adminService.getBaseUrl()}/${selectedItem.imageUrl || selectedItem.image_url}`} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} alt="Found item" />
                                        </div>
                                    )}

                                    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b' }}>Reporter Insights</h4>
                                        {selectedItem.user ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>NAME</div>
                                                    <div style={{ fontWeight: '600' }}>{selectedItem.user.name}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>REGISTRATION</div>
                                                    <div style={{ fontWeight: '600' }}>{selectedItem.user.registerNumber || selectedItem.user.register_number || 'Internal'}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#94a3b8' }}>Anonymous submission</p>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>CATEGORY</div>
                                            <div style={{ fontWeight: '600' }}>{selectedItem.category}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>DISCOVERY DATE</div>
                                            <div style={{ fontWeight: '600' }}>{new Date(selectedItem.dateTime).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Storage Assignment</h4>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>STORAGE SLOT</label>
                                        <input
                                            type="text"
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
                                            placeholder="e.g. Almirah 3, Row B"
                                            value={storageLocation}
                                            onChange={(e) => setStorageLocation(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>ADMIN REMARKS</label>
                                        <textarea
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', backgroundColor: '#f8fafc' }}
                                            placeholder="Add specific collection notes..."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleAssignStorage(selectedItem.id || selectedItem._id)}
                                        disabled={updating}
                                        style={{
                                            width: '100%', padding: '16px',
                                            backgroundColor: '#6c5ce7', color: 'white',
                                            border: 'none', borderRadius: '14px',
                                            fontWeight: '700', cursor: 'pointer',
                                            boxShadow: '0 10px 15px -3px rgba(108, 92, 231, 0.4)',
                                            marginBottom: '15px'
                                        }}
                                    >
                                        {updating ? 'Verifying...' : selectedItem.storage_location ? 'Update Details' : 'Verify & Set Available'}
                                    </button>

                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        style={{ width: '100%', padding: '16px', background: '#f1f5f9', border: 'none', borderRadius: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoundItemsManagement;
