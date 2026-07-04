import React, { useEffect, useState } from 'react';

/**
 * Transactions component renders a full data table of all transactions.
 * Supports sorting and filtering.
 */
export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchTransactions();
  }, [categoryFilter]);

  const fetchTransactions = () => {
    setLoading(true);
    let url = 'http://localhost:8000/transactions';
    if (categoryFilter) {
      url += `?category=${encodeURIComponent(categoryFilter)}`;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch transactions", err);
        setLoading(false);
      });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'amount') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const uniqueCategories = [...new Set(transactions.map(tx => tx.category))].filter(Boolean);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="view-title" style={{ marginBottom: 0 }}>Transactions</h2>
        
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ 
            background: 'var(--bg-secondary)', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border-color)', 
            padding: '8px 12px', 
            borderRadius: '6px' 
          }}
        >
          <option value="">All Categories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div>Loading transactions...</div>
      ) : (
        <div className="data-table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('date')}>Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('description')}>Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('amount')}>Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('category')}>Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(tx => (
                <tr key={tx.id} className={tx.is_anomaly === 1 ? 'is-anomaly' : ''}>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td>${tx.amount.toFixed(2)}</td>
                  <td>{tx.category}</td>
                  <td>
                    {tx.is_anomaly === 1 && (
                      <span style={{ color: 'var(--danger-color)', fontWeight: 500 }}>Yes ({tx.anomaly_score}σ)</span>
                    )}
                  </td>
                </tr>
              ))}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
