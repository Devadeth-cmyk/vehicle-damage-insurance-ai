import React from 'react';
import { FileCheck2, Clock, CheckCircle2, ShieldCheck, Download, FileText, Package } from 'lucide-react';
import type { Claim } from './api';

interface ClaimDetailsViewProps {
  claimId: string;
  claims: Claim[];
  onNavigate: (route: string) => void;
}

export const ClaimDetailsView: React.FC<ClaimDetailsViewProps> = ({ claimId, claims, onNavigate }) => {
  const claim = claims.find((c) => c.claim_id === claimId) || claims[0];

  const timelineSteps = [
    { title: 'Claim Submitted', desc: 'Submitted by customer', status: 'completed' },
    { title: 'Service Center Received', desc: 'Queued for workshop assessment', status: 'completed' },
    { title: 'Vehicle Assessment', desc: 'AI computer vision scanning', status: 'completed' },
    { title: 'Technician Verification', desc: 'Master estimator verification', status: 'active' },
    { title: 'Claim Package Generated', desc: 'JSON/PDF/ZIP bundle prepared', status: 'pending' },
    { title: 'Insurer Review', desc: 'Final insurer settlement review', status: 'pending' }
  ];

  if (!claim) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', background: '#ffffff' }}>
        <p style={{ color: '#64748b' }}>Claim details not found.</p>
        <button onClick={() => onNavigate('/claims')} className="btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Claims List
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* HEADER BAR */}
      <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>CLAIM RECORD</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Claim #{claim.claim_id}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              Policy #: {claim.policy_number || 'POL-2026-9988'} • Filed on {new Date(claim.incident_date).toLocaleDateString()}
            </p>
          </div>
          <span className="badge badge-warning">{claim.status}</span>
        </div>

        {/* CUSTOMER-FRIENDLY TIMELINE */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Claim Progress Timeline</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {timelineSteps.map((stg, i) => (
            <div key={i} style={{ background: stg.status === 'completed' ? '#f0fdf4' : stg.status === 'active' ? '#e0f2fe' : '#f8fafc', border: `1px solid ${stg.status === 'completed' ? '#bbf7d0' : stg.status === 'active' ? '#bae6fd' : '#e2e8f0'}`, padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ color: stg.status === 'completed' ? '#16a34a' : stg.status === 'active' ? '#0284c7' : '#94a3b8', marginBottom: '0.25rem' }}>
                {stg.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: stg.status === 'pending' ? '#94a3b8' : '#0f172a' }}>{stg.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RELEASED PRELIMINARY ASSESSMENT & REPAIR ESTIMATE */}
      <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck style={{ color: '#0284c7' }} /> AI-Assisted Preliminary Assessment
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Preliminary detection & indicative repair cost summary. Final settlement subject to insurer review.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Detected Vehicle Damage</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Front Bumper:</span>
                <span className="badge badge-warning">Dent (Moderate)</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Headlamp Assembly:</span>
                <span className="badge badge-danger">Broken Lamp (Severe)</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Side Door Panel:</span>
                <span className="badge badge-info">Scratch (Minor)</span>
              </li>
            </ul>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Indicative Repair Estimate</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Front Bumper Dent:</span> <strong>$120.00</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Headlamp Unit:</span> <strong>$180.00</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Paint & Labor (4 hrs):</span> <strong>$220.00</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', marginTop: '0.4rem', fontSize: '1rem', color: '#16a34a' }}>
                <span>Indicative Total:</span> <strong>$520.00</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLAIM PACKAGE DOWNLOAD SECTION */}
      <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package style={{ color: '#16a34a' }} /> Claim Package Exports
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Download compiled claim documentation and PDF assessment reports.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.open(`http://127.0.0.1:8000/api/v1/claims/${claim.claim_id}/package/pdf`)} className="btn-primary">
            <FileText size={18} /> View Claim Report PDF
          </button>
          <button onClick={() => window.open(`http://127.0.0.1:8000/api/v1/claims/${claim.claim_id}/package/zip`)} className="btn-secondary">
            <Download size={18} /> Download Claim Package ZIP
          </button>
        </div>
      </div>
    </div>
  );
};
