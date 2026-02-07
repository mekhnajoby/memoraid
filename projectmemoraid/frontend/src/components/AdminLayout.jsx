import React from 'react';
import AdminNavbar from './AdminNavbar';
import '../pages/Admin.css';

const AdminLayout = ({ children, title, subtitle }) => {
    return (
        <div className="admin-layout">
            <AdminNavbar />
            <main className="admin-content">
                <div className="admin-header">
                    <h1>{title}</h1>
                    <p className="admin-subtitle">{subtitle}</p>
                </div>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
