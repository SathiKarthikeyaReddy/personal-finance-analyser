import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Upload from './components/Upload';

/**
 * App component is the root layout tying the Sidebar and Main Content views together.
 */
function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="main-content">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'transactions' && <Transactions />}
        {activeView === 'upload' && <Upload />}
      </main>
    </div>
  );
}

export default App;
