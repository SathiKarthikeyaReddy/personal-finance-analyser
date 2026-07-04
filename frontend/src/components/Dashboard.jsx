import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Dashboard component renders high-level aggregated analytics.
 * Fetches data from the /analytics endpoint.
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/analytics')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch analytics', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>No data available. Please upload a CSV first.</div>;

  return (
    <div>
      <h2 className="view-title">Dashboard</h2>
      
      <div className="summary-cards">
        <div className="card">
          <div className="card-title">Total Spend</div>
          <div className="card-value">${data.total_spend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div className="card">
          <div className="card-title">Transactions</div>
          <div className="card-value">{data.total_transactions}</div>
        </div>
        <div className="card">
          <div className="card-title">Anomalies Flagged</div>
          <div className="card-value" style={{ color: 'var(--danger-color)' }}>{data.anomalies.length}</div>
        </div>
        <div className="card">
          <div className="card-title">Highest Category</div>
          <div className="card-value">
            {data.spend_by_category.length > 0 ? data.spend_by_category[0].category : 'N/A'}
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">Spend by Category</div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.spend_by_category}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '6px' }} />
              <Bar dataKey="total" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">Month over Month Spend</div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.month_over_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '6px' }} />
              <Line type="monotone" dataKey="total" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">Flagged Anomalies</div>
        {data.anomalies.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No anomalies detected.</div>
        ) : (
          <div className="anomalies-list">
            {data.anomalies.map((tx) => (
              <div key={tx.id} className="anomaly-item">
                <div className="anomaly-details">
                  <div className="anomaly-desc">{tx.description}</div>
                  <div className="anomaly-meta">{tx.date} • {tx.category} • {tx.anomaly_score}σ above mean</div>
                </div>
                <div className="anomaly-amount">
                  ${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
