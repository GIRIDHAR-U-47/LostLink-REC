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
    const [storageLocation, setStorageLocation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                query: searchQuery,
                category: filters.category,
                status: filters.status,
                item_type: 'LOST'
            };

            const response = await adminService.searchItems(params);
            setItems(response.data || []);
        } catch (error) {
            console.log('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters.category, filters.status]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSearch = () => {
        fetchItems();
    };

    const handleUpdateItem = async () => {
        if (!selectedItem) return;

        setUpdating(true);
        try {
            const itemId = selectedItem.id || selectedItem._id;
            await adminService.assignStorage(itemId, storageLocation, remarks);

            // Refresh local state
            setItems(prevItems => prevItems.map(item =>
                (item.id === itemId || item._id === itemId)
                    ? { ...item, storage_location: storageLocation, admin_remarks: remarks, status: 'AVAILABLE' }
                    : item
            ));

            alert('Item updated successfully! Status set to AVAILABLE.');
            setSelectedItem(null);
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update item: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
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
        <div style={{ padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#2d3436', fontSize: '2.5rem', fontWeight: '800' }}>Lost Items Explorer</h1>
                <div style={{ color: '#636e72', fontWeight: '500' }}>
                    {items.length} Reports Found
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
                <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
                    <input
                        type="text"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '1px solid #dfe6e9',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        placeholder="Search items, descriptions, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                    <option value="OTHERS">Others</option>
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
                    <option value="OPEN">Open</option>
                    <option value="PENDING">Pending</option>
                    <option value="AVAILABLE">Available for Collection</option>
                    <option value="RETURNED">Returned</option>
                </select>

                <button
                    onClick={handleSearch}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#6c5ce7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    Apply Filters
                </button>
            </div>

            {/* Items Display */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#636e72' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '20px', fontSize: '18px' }}>Scanning repository...</p>
                </div>
            ) : items.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '80px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    color: '#b2bec3'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                    <p style={{ fontSize: '20px' }}>No matching reports found in this quadrant.</p>
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
                                        src={`${API_BASE_URL.replace('/api', '')}/${item.imageUrl || item.image_url}`}
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
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#2d3436',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {item.category}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    height: '160px',
                                    backgroundColor: '#6c5ce7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
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
                                        {item.status || 'REPORTED'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#b2bec3', fontWeight: '500' }}>
                                        {getRecencyLabel(item.dateTime)}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 10px 0', color: '#2d3436', fontSize: '1.2rem' }}>{item.category}</h3>
                                <p style={{
                                    color: '#636e72',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    margin: '0 0 15px 0',
                                    height: '42px',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '2',
                                    WebkitBoxOrient: 'vertical'
                                }}>
                                    {item.description}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>
                                        <strong>Lost at:</strong> {item.location}
                                    </div>
                                    <div style={{ fontSize: '18px' }} title="Manage Report">➡️</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Detail & Management Modal */}
            {selectedItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
                    padding: '20px',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '25px 30px',
                            borderBottom: '1px solid #f1f2f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#6c5ce7',
                            color: 'white'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Manage Lost Report</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    transition: 'all 0.3s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Left Side: Details */}
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#b2bec3', textTransform: 'uppercase', marginBottom: '8px' }}>Images/Visuals</label>
                                        {(selectedItem.imageUrl || selectedItem.image_url) ? (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                <img
                                                    src={`${API_BASE_URL.replace('/api', '')}/${selectedItem.imageUrl || selectedItem.image_url}`}
                                                    alt={selectedItem.category}
                                                    style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                height: '180px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px dashed #dfe6e9'
                                            }}>
                                                <div style={{ textAlign: 'center', color: '#b2bec3' }}>
                                                    <div style={{ fontSize: '32px' }}>📷</div>
                                                    <p>No Image Provided</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#2d3436' }}>Discovery Info</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px' }}>
                                                <span style={{ fontSize: '11px', color: '#b2bec3', fontWeight: '700' }}>CATEGORY</span>
                                                <div style={{ fontWeight: '600', color: '#2d3436' }}>{selectedItem.category}</div>
                                            </div>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '10px' }}>
                                                <span style={{ fontSize: '11px', color: '#b2bec3', fontWeight: '700' }}>STATUS</span>
                                                <div style={{ fontWeight: '600', color: '#6c5ce7' }}>{selectedItem.status || 'PENDING'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '11px', color: '#b2bec3', fontWeight: '700' }}>REPORTER DETAILS</span>
                                            <div style={{ marginTop: '5px', color: '#2d3436', fontWeight: '600' }}>{selectedItem.user?.name || 'Anonymous'}</div>
                                            <div style={{ fontSize: '13px', color: '#636e72', marginTop: '3px' }}>Reg No: {selectedItem.user?.registerNumber || selectedItem.user?.register_number || 'N/A'}</div>
                                            <div style={{ fontSize: '13px', color: '#636e72' }}>{selectedItem.user?.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Actions */}
                                <div>
                                    <h4 style={{ margin: '0 0 20px 0', color: '#2d3436', borderLeft: '4px solid #6c5ce7', paddingLeft: '12px' }}>Administrative Actions</h4>

                                    <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '20px' }}>
                                        Assign a storage location and add remarks to transition this item to <strong>AVAILABLE</strong> status. This will notify the user where to collect it.
                                    </p>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2d3436', marginBottom: '8px' }}>Location</label>
                                        <input
                                            type="text"
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                borderRadius: '10px',
                                                border: '1px solid #dfe6e9',
                                                fontSize: '15px',
                                                backgroundColor: '#fdfdfd'
                                            }}
                                            placeholder="e.g. Student care Office, Student care"
                                            value={storageLocation}
                                            onChange={(e) => setStorageLocation(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#2d3436', marginBottom: '8px' }}>Admin Remarks</label>
                                        <textarea
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                borderRadius: '10px',
                                                border: '1px solid #dfe6e9',
                                                fontSize: '15px',
                                                minHeight: '120px',
                                                resize: 'vertical',
                                                backgroundColor: '#fdfdfd'
                                            }}
                                            placeholder="Add instructions or details for the user..."
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button
                                            onClick={handleUpdateItem}
                                            disabled={updating || !storageLocation}
                                            style={{
                                                flex: 2,
                                                padding: '16px',
                                                backgroundColor: '#00b894',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                cursor: storageLocation ? 'pointer' : 'not-allowed',
                                                opacity: updating || !storageLocation ? 0.7 : 1,
                                                transition: 'all 0.3s',
                                                fontSize: '16px'
                                            }}
                                        >
                                            {updating ? 'Processing...' : selectedItem.storage_location ? 'Update Details' : 'Verify & Set Available'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            style={{
                                                flex: 1,
                                                padding: '16px',
                                                backgroundColor: '#f1f2f6',
                                                color: '#2d3436',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            Dismiss
                                        </button>
                                    </div>

                                    {selectedItem.storage_location && (
                                        <div style={{
                                            marginTop: '20px',
                                            padding: '15px',
                                            backgroundColor: '#e3f2fd',
                                            borderRadius: '10px',
                                            borderLeft: '4px solid #1e88e5'
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#1e88e5', fontWeight: '800', marginBottom: '4px' }}>CURRENT ASSIGNMENT</div>
                                            <div style={{ fontSize: '14px', color: '#0d47a1' }}>
                                                Currently stored at: <strong>{selectedItem.storage_location}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LostItemsViewer;
