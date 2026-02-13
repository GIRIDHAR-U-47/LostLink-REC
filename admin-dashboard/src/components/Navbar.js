import React from 'react';

const Navbar = ({ userInfo, onLogout }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src="/logo.png" alt="REC Logo" style={{ height: '30px', marginRight: '10px', verticalAlign: 'middle' }} onError={(e) => e.target.style.display = 'none'} />
                REC LostLink Admin Panel
            </div>
            <div className="navbar-user">
                <span>Welcome, {userInfo?.name}</span>
                <button className="navbar-button" onClick={onLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
