import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import adminService from '../services/adminService';
import { API_BASE_URL } from '../services/api';

const LostItemsViewer = () => {
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

    const handleLinkItem = async (foundItemId) => {
        if (!selectedItem || !foundItemId) return;
        setUpdating(true);
        try {
            const currentId = selectedItem.id || selectedItem._id;
            await adminService.linkItems(currentId, foundItemId);
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
            // Search for AVAILABLE/PENDING FOUND items in same category
            const response = await adminService.searchItems({
                item_type: 'FOUND',
                status: 'AVAILABLE',
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

    const handleNotifyOwner = async () => {
        if (!selectedItem) return;
        setUpdating(true);
        try {
            const itemId = selectedItem.id || selectedItem._id;
            await adminService.notifyOwner(itemId, remarks);
            alert('Owner notified successfully with your remarks!');
            fetchItems();
            setSelectedItem(null);
        } catch (error) {
            console.error('Notify failed:', error);
            alert('Failed to notify owner: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateItem = async () => {
        if (!selectedItem) return;

        setUpdating(true);
        try {
            const itemId = selectedItem.id || selectedItem._id;
            const nextStatus = selectedItem.status === 'AVAILABLE' ? 'RETURNED' : 'AVAILABLE';
            await adminService.assignStorage(itemId, storageLocation, remarks, nextStatus);

            alert(`Item updated successfully! Status set to ${nextStatus}.`);
            fetchItems();
            setSelectedItem(null);
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update item: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUpdating(false);
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
                                const id = item.id || item._id;
                                setSelectedItem(item);
                                setStorageLocation(item.storage_location || '');
                                setRemarks(item.admin_remarks || '');
                                setHandoverData({
                                    student_id: item.user?.registerNumber || item.user?.register_number || '',
                                    admin_name: '',
                                    remarks: ''
                                });
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
                                <div style={{ fontSize: '11px', color: '#b2bec3', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                    REPORT ID: {item.Lost_ID || (item.id || item._id).substring(0, 8).toUpperCase()}
                                </div>
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
                            {fetchingContext ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Reconstructing Case History...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                                    {/* Left Side: Media & Context */}
                                    <div>
                                        <div style={{ marginBottom: '24px' }}>
                                            {(selectedItem.imageUrl || selectedItem.image_url) ? (
                                                <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                                    <img
                                                        src={`${API_BASE_URL.replace('/api', '')}/${selectedItem.imageUrl || selectedItem.image_url}`}
                                                        alt={selectedItem.category}
                                                        style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    height: '200px',
                                                    backgroundColor: '#f8fafc',
                                                    borderRadius: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '2px dashed #e2e8f0',
                                                    flexDirection: 'column'
                                                }}>
                                                    <span style={{ fontSize: '40px' }}>📦</span>
                                                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>No Image Evidence</p>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Report ID</div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>{selectedItem.Lost_ID || 'N/A'}</div>
                                            </div>
                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Report Status</div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#6c5ce7' }}>{selectedItem.status}</div>
                                            </div>
                                        </div>

                                        {/* Owner Details */}
                                        <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#334155', fontSize: '14px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>👤 Owner Information</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '15px' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>FULL NAME</div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user?.name || 'Unknown'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>ROLL / REGISTRATION</div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user?.registerNumber || selectedItem.user?.register_number || 'N/A'}</div>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>EMAIL CONTACT</div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedItem.user?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Linked Found Item */}
                                        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#334155', fontSize: '14px' }}>🔎 Resolved by Discovery</h4>
                                            {context?.linked_item ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '10px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '10px', color: '#047857', fontWeight: '800' }}>LINKED FOUND ITEM</div>
                                                        <div style={{ fontWeight: '700', color: '#064e3b' }}>{context.linked_item.Found_ID || 'ID-FOUND'}</div>
                                                        <div style={{ fontSize: '12px', color: '#10b981' }}>Category: {context.linked_item.category}</div>
                                                    </div>
                                                    <button onClick={() => window.location.href = `/admin/found-items?search=${context.linked_item.Found_ID}`} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #6ee7b7', background: '#fff', color: '#059669', fontSize: '12px', cursor: 'pointer' }}>View Asset</button>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px' }}>No matching discovery linked.</p>
                                                    <button onClick={openLinkModal} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#00b894', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Link Found Item</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Actions */}
                                    <div>
                                        <div style={{ marginBottom: '25px' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b', fontSize: '14px' }}>Administrative Control</h4>

                                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>ADMIN REMARKS</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '100px', fontSize: '13px' }}
                                                    placeholder="Add verification notes about ownership or potential leads..."
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                                                <button
                                                    onClick={handleNotifyOwner}
                                                    disabled={updating}
                                                    style={{
                                                        padding: '14px',
                                                        background: updating ? '#f1f2f6' : '#fff',
                                                        border: '1px solid #6c5ce7',
                                                        color: '#6c5ce7',
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: updating ? 'not-allowed' : 'pointer',
                                                        opacity: updating ? 0.7 : 1
                                                    }}
                                                >
                                                    {updating ? 'Processing...' : '📧 Notify Owner'}
                                                </button>
                                                <button
                                                    onClick={() => selectedItem.status === 'AVAILABLE' ? setShowHandoverModal(true) : handleUpdateItem()}
                                                    disabled={updating}
                                                    style={{
                                                        padding: '14px',
                                                        background: updating ? '#a29bfe' : '#6c5ce7',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: updating ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {updating ? 'Updating...' : (selectedItem.status === 'AVAILABLE' ? '🤝 Record Handover' : 'Mark Resolved')}
                                                </button>
                                            </div>

                                            {(context?.linked_item || selectedItem.status === 'AVAILABLE') && (
                                                <div style={{ marginTop: '30px' }}>
                                                    <h5 style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Physical Handover Logic</h5>
                                                    <button
                                                        onClick={() => setShowHandoverModal(true)}
                                                        style={{ width: '100%', padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                                    >
                                                        🤝 Record Handover
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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
                        <div style={{ padding: '25px 30px', backgroundColor: '#00b894', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>Link Discovery to Report</h2>
                            <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            {potentialLinks.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No available found items matching this category.</p>
                            ) : (
                                potentialLinks.map(link => (
                                    <div key={link.id || link._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{link.Found_ID}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Location: {link.location}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(link.dateTime).toLocaleDateString()}</div>
                                        </div>
                                        <button
                                            onClick={() => handleLinkItem(link.id || link._id)}
                                            style={{ padding: '8px 16px', background: '#00b894', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
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
        </div>
    );
};

export default LostItemsViewer;
