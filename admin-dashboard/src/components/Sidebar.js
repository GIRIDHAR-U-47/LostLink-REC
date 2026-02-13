import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onToggle, userInfo }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: '📊 Dashboard', icon: '📈' },
        { path: '/found-items', label: '📦 Found Items', icon: '📦' },
        { path: '/lost-items', label: '🔍 Lost Items', icon: '🔍' },
        { path: '/claims', label: '⚖️ Claims', icon: '⚖️' },
        { path: '/profile', label: '👤 Profile', icon: '👤' },
    ];

    return (
        <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #404060' }}>
                <div style={{ fontSize: '30px', marginBottom: '10px' }}>🏫</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Student Care Admin</div>
            </div>
            <ul className="sidebar-menu">
                {menuItems.map(item => (
                    <li key={item.path} className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
                        <Link to={item.path} className="sidebar-link">
                            <span>{item.icon} {item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
