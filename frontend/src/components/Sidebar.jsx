import React from 'react';
import { LayoutDashboard, ReceiptText, UploadCloud } from 'lucide-react';

/**
 * Sidebar component renders the left navigation menu.
 * Accepts activeView (string) and setActiveView (function) as props.
 */
export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud },
  ];

  return (
    <div className="sidebar">
      <h1>Finance Analyser</h1>
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
