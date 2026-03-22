import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onToggle, userInfo }) => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/found-items', label: 'Found Items' },
        { path: '/lost-items', label: 'Lost Items' },
        { path: '/matches', label: 'Match Supervision' },
        { path: '/claims', label: 'Claims' },
        { path: '/handovers', label: 'Handover Registry' },
        { path: '/broadcast', label: 'Broadcast' },
        { path: '/logs', label: 'Activity Logs' },
        { path: '/profile', label: 'Profile' },
    ];

    return (
        <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>ADMIN CONSOLE</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '5px' }}>REC STUDENT CARE</div>
            </div>
            <ul className="sidebar-menu">
                {menuItems.map(item => (
                    <li key={item.path} className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
                        <Link to={item.path} className="sidebar-link">
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
