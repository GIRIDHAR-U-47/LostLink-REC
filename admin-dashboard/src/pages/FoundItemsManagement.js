import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

const FoundItemsManagement = () => {
    const location = useLocation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    });

    // Check for search param on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchVal = params.get('search');
        if (searchVal) {
            setSearchQuery(searchVal);
        }
    }, [location]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [storageLocation, setStorageLocation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [updating, setUpdating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        category: '',
        description: '',
        location: '',
        storage_location: '',
        admin_remarks: '',
        image: null
    });
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [potentialLinks, setPotentialLinks] = useState([]);
    const [context, setContext] = useState(null);
    const [fetchingContext, setFetchingContext] = useState(false);
    const [handoverData, setHandoverData] = useState({
        student_id: '',
        admin_name: '',
        remarks: ''
    });

    const fetchContext = async (itemId) => {
        if (!itemId) return;
        setFetchingContext(true);
        try {
            const response = await adminService.getItemContext(itemId);
            setContext(response.data);
        } catch (error) {
            console.error('Error fetching item context:', error);
        } finally {
            setFetchingContext(false);
        }
    };

    const handleLinkItem = async (lostItemId) => {
        if (!selectedItem || !lostItemId) return;
        setUpdating(true);
        try {
            const currentId = selectedItem.id || selectedItem._id;
            await adminService.linkItems(currentId, lostItemId);
            setShowLinkModal(false);
            alert('Items linked successfully!');
            fetchContext(currentId);
            fetchItems();
        } catch (error) {
            alert('Linking failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const openLinkModal = async () => {
        setShowLinkModal(true);
        setUpdating(true);
        try {
            // Search for open LOST reports in same category
            const response = await adminService.searchItems({
                item_type: 'LOST',
                status: 'OPEN',
                category: selectedItem.category
            });
            setPotentialLinks(response.data || []);
        } catch (error) {
            console.error('Error fetching potential links:', error);
        } finally {
            setUpdating(false);
        }
    };

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

    const handleAddNewItem = async (e) => {
        e.preventDefault();
        if (!newItem.category || !newItem.location || !newItem.storage_location) {
            alert('Category, Location, and Storage Slot are mandatory.');
            return;
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('category', newItem.category);
            formData.append('description', newItem.description);
            formData.append('location', newItem.location);
            formData.append('storage_location', newItem.storage_location);
            formData.append('admin_remarks', newItem.admin_remarks);
            if (newItem.image) {
                formData.append('image', newItem.image);
            }

            const response = await adminService.addFoundItem(formData);
            setItems([response.data, ...items]);
            setShowAddModal(false);
            setNewItem({
                category: '',
                description: '',
                location: '',
                storage_location: '',
                admin_remarks: '',
                image: null
            });
            alert('Found item recorded and added to inventory!');
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const handleArchiveItem = async (itemId) => {
        if (!window.confirm('Transfer this item to the long-term archive?')) return;
        try {
            await adminService.archiveItem(itemId);
            setItems(items.map(item => (item.id === itemId || item._id === itemId) ? { ...item, status: 'ARCHIVED' } : item));
            setSelectedItem(null);
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDisposeItem = async (itemId) => {
        if (!window.confirm('Permanently mark this item as disposed?')) return;
        try {
            await adminService.disposeItem(itemId);
            setItems(items.map(item => (item.id === itemId || item._id === itemId) ? { ...item, status: 'DISPOSED' } : item));
            setSelectedItem(null);
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleHandover = async (e) => {
        e.preventDefault();
        const itemId = selectedItem.id || selectedItem._id;
        setUpdating(true);
        try {
            await adminService.handoverItem(itemId, handoverData);
            setItems(items.map(item => (item.id === itemId || item._id === itemId) ? { ...item, status: 'RETURNED' } : item));
            setShowHandoverModal(false);
            setSelectedItem(null);
            alert('Physical handover recorded successfully!');
        } catch (error) {
            alert('Handover Failed: ' + (error.response?.data?.detail || error.message));
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
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ color: '#636e72', fontWeight: '500' }}>
                        {items.length} Discoveries Tracked
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#00b894',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>+</span> Log New Discovery
                    </button>
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
                                const id = item.id || item._id;
                                setSelectedItem(item);
                                setStorageLocation(item.storage_location || '');
                                setRemarks(item.admin_remarks || '');
                                fetchContext(id);
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
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                    TRACKING ID: {item.Found_ID || (item.id || item._id).substring(0, 8).toUpperCase()}
                                </div>
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
                            {fetchingContext ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Syncing Case Context...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                                    {/* Left: Media & Links */}
                                    <div>
                                        {(selectedItem.imageUrl || selectedItem.image_url) && (
                                            <div style={{ marginBottom: '25px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                                <img src={`${adminService.getBaseUrl()}/${selectedItem.imageUrl || selectedItem.image_url}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} alt="Found item" />
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Tracking ID</div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{selectedItem.Found_ID || 'N/A'}</div>
                                            </div>
                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Current Status</div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#6c5ce7' }}>{selectedItem.status}</div>
                                            </div>
                                        </div>

                                        {/* Finder Details Section */}
                                        <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#334155', fontSize: '14px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>🔍 Finder Details</h4>
                                            {selectedItem.user ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '15px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>REPORTER</div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user.name}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>IDENTIFICATION</div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user.registerNumber || selectedItem.user.register_number || 'Internal Staff'}</div>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>CONTACT</div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Anonymous report (No user linked)</p>
                                            )}
                                        </div>

                                        {/* Linked Lost Report Section */}
                                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '2px dashed #e2e8f0' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#334155', fontSize: '14px' }}>🔗 Internal Case Link</h4>
                                            {context?.linked_item ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '10px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: '800' }}>CONNECTED LOST REPORT</div>
                                                        <div style={{ fontWeight: '700', color: '#0c4a6e' }}>{context.linked_item.Lost_ID || 'ID-LOST'}</div>
                                                        <div style={{ fontSize: '12px', color: '#0ea5e9' }}>Reported by: {context.linked_item.user?.name}</div>
                                                    </div>
                                                    <button onClick={() => window.location.href = `/admin/lost-items?search=${context.linked_item.Lost_ID}`} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #7dd3fc', background: '#fff', color: '#0284c7', fontSize: '12px', cursor: 'pointer' }}>View Case</button>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px' }}>No linked lost report found yet.</p>
                                                    <button onClick={openLinkModal} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6c5ce7', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Link Lost Report</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions & Context */}
                                    <div>
                                        <div style={{ marginBottom: '24px' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b', fontSize: '14px' }}>Administration & Logic</h4>

                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>STORAGE SLOT</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>{selectedItem.storage_location ? 'Assigned' : 'Pending'}</div>
                                                </div>
                                                <input
                                                    type="text"
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                                                    placeholder="Storage Slot ID..."
                                                    value={storageLocation}
                                                    onChange={(e) => setStorageLocation(e.target.value)}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                                <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#6c5ce7' }}>{context?.claims?.length || 0}</div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>CLAIMS</div>
                                                </div>
                                                <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{context?.claims?.filter(c => c.status === 'PENDING').length || 0}</div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>PENDING</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <button
                                                    onClick={() => handleAssignStorage(selectedItem.id || selectedItem._id)}
                                                    disabled={updating}
                                                    style={{ width: '100%', padding: '14px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}
                                                >
                                                    {updating ? 'Processing...' : 'Save Details / Verify'}
                                                </button>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <button onClick={() => window.location.href = `/admin/claims?id=${selectedItem.id || selectedItem._id}`} style={{ padding: '12px', background: '#fff', border: '1px solid #6c5ce7', color: '#6c5ce7', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>View Claims</button>

                                                    {selectedItem.status === 'AVAILABLE' || selectedItem.status === 'CLAIMED' ? (
                                                        <button onClick={() => setShowHandoverModal(true)} style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Record Handover</button>
                                                    ) : (
                                                        <button disabled style={{ padding: '12px', background: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'not-allowed' }}>Record Handover</button>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '20px' }}>
                                                <h5 style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Management Precautions</h5>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleArchiveItem(selectedItem.id || selectedItem._id)} style={{ flex: 1, padding: '10px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Archive Case</button>
                                                    <button onClick={() => handleDisposeItem(selectedItem.id || selectedItem._id)} style={{ flex: 1, padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Dispose Item</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                            <h2 style={{ margin: 0, fontWeight: '700' }}>Confirm Handover</h2>
                            <button onClick={() => setShowHandoverModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleHandover} style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '12px', fontSize: '13px', color: '#166534' }}>
                                You are about to mark this item as <strong>Returned</strong>. This requires physical verification of the student.
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
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
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

            {/* Link Item Modal */}
            {showLinkModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2200, padding: '20px', backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', maxWidth: '500px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '25px 30px', backgroundColor: '#6c5ce7', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>Link Matching Lost Report</h2>
                            <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            {potentialLinks.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No matching lost reports found in this category.</p>
                            ) : (
                                potentialLinks.map(link => (
                                    <div key={link.id || link._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{link.Lost_ID}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Reporter: {link.user?.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(link.dateTime).toLocaleDateString()}</div>
                                        </div>
                                        <button
                                            onClick={() => handleLinkItem(link.id || link._id)}
                                            style={{ padding: '8px 16px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Link
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Found Item Entry Modal */}
            <AddItemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                newItem={newItem}
                setNewItem={setNewItem}
                onSubmit={handleAddNewItem}
                updating={updating}
            />
        </div>
    );
};

/* Component for Direct Found Item Entry */
const AddItemModal = ({ isOpen, onClose, newItem, setNewItem, onSubmit, updating }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '20px', backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '24px', maxWidth: '500px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
            }}>
                <div style={{ padding: '25px 30px', backgroundColor: '#00b894', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontWeight: '700' }}>Log Discovery</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                </div>
                <form onSubmit={onSubmit} style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>CATEGORY</label>
                        <select
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="DEVICES">Devices</option>
                            <option value="DOCUMENTS">Documents</option>
                            <option value="ACCESSORIES">Accessories</option>
                            <option value="KEYS">Keys</option>
                            <option value="JEWELLERY">Jewellery</option>
                            <option value="BOOKS">Books</option>
                            <option value="OTHERS">Others</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>DESCRIPTION</label>
                        <textarea
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                            placeholder="Visual details, labels, etc..."
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>FOUND AT</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                placeholder="Location"
                                value={newItem.location}
                                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>STORAGE SLOT</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                placeholder="Box/Rack"
                                value={newItem.storage_location}
                                onChange={(e) => setNewItem({ ...newItem, storage_location: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>EVIDENCE PHOTO</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })}
                            style={{ fontSize: '12px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={updating}
                        style={{
                            width: '100%', padding: '16px',
                            backgroundColor: '#00b894', color: 'white',
                            border: 'none', borderRadius: '12px',
                            fontWeight: '700', cursor: 'pointer'
                        }}
                    >
                        {updating ? 'Syncing...' : 'Confirm Discovery'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FoundItemsManagement;
