import React, { useState, useRef } from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';

/**
 * Upload component renders a drag and drop zone for CSV files.
 * Provides a summary of the upload result and a reset button.
 */
export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setError("Only CSV files are allowed.");
      return;
    }
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to delete all transaction data? This cannot be undone.")) return;
    
    try {
      const response = await fetch('http://localhost:8000/transactions', {
        method: 'DELETE'
      });
      if (response.ok) {
        setResult(null);
        alert("All data cleared successfully.");
      }
    } catch (err) {
      console.error("Failed to reset data", err);
      alert("Failed to clear data.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="view-title" style={{ marginBottom: 0 }}>Upload Data</h2>
        <button className="btn-danger" onClick={handleReset} title="Clear all data in SQLite">
          <Trash2 size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Reset Data
        </button>
      </div>

      <div 
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud size={48} className="upload-icon" />
        <div className="upload-text">
          Drag and drop your bank transaction CSV here<br />
          or click below to browse.
        </div>
        
        <input 
          type="file" 
          accept=".csv" 
          className="hidden-input" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        <button 
          className="btn-primary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading and Processing...' : 'Select CSV File'}
        </button>
      </div>
      
      {error && (
        <div style={{ color: 'var(--danger-color)', padding: '16px', backgroundColor: 'var(--danger-bg)', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      
      {result && (
        <div className="summary-box">
          <h3>Upload Summary</h3>
          <div className="summary-item">
            <span>Status</span>
            <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Success</span>
          </div>
          <div className="summary-item">
            <span>Transactions Processed</span>
            <span>{result.total_transactions_processed}</span>
          </div>
          <div className="summary-item">
            <span>Categories Identified</span>
            <span>{result.categories_found}</span>
          </div>
          <div className="summary-item">
            <span>Anomalies Flagged</span>
            <span style={result.anomalies_flagged > 0 ? { color: 'var(--danger-color)', fontWeight: 600 } : {}}>
              {result.anomalies_flagged}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
