import React, { useState, useEffect } from 'react';
import { api, type Claim } from './api';
import { Wrench, CheckCircle, Clock, ShieldCheck, FileCheck, Layers } from 'lucide-react';

export const ServiceCenterPortal: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-center/claims');
      const claimList = res.data.claims || res.data;
      setClaims(claimList);
      if (claimList.length > 0) {
        setSelectedClaim(claimList[0]);
      }
    } catch (err: any) {
      setError('Failed to fetch service center claims feed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claimId: string, newStatus: string) => {
    try {
      await api.patch(`/service-center/claims/${claimId}/status`, { status: newStatus });
      fetchClaims();
    } catch (err) {
      alert('Failed to update claim status');
    }
  };

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench style={{ color: 'var(--accent-primary)' }} /> Service Center Repair Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Inspect AI damage detection, part-by-part fusion, and repair cost estimations
          </p>
        </div>
        <button onClick={fetchClaims} className="btn-secondary">
          Refresh Queue
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading claims database...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
          {/* Claims Sidebar Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Repair Claims ({claims.length})
            </h4>

            {claims.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active claims found.
              </div>
            ) : (
              claims.map(claim => (
                <div
                  key={claim.claim_id}
                  onClick={() => setSelectedClaim(claim)}
                  className="glass-panel glass-panel-hover"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderColor: selectedClaim?.claim_id === claim.claim_id ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: selectedClaim?.claim_id === claim.claim_id ? 'rgba(99, 102, 241, 0.12)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{claim.claim_id}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{claim.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Policy: {claim.policy_number || 'N/A'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Detailed Inspection Area */}
          <div>
            {selectedClaim ? (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>CLAIM INSPECTION</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Claim #{selectedClaim.claim_id}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Filed on: {new Date(selectedClaim.incident_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleUpdateStatus(selectedClaim.claim_id, 'REPAIR_IN_PROGRESS')}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Clock size={16} /> Mark In Repair
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedClaim.claim_id, 'COMPLETED')}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <CheckCircle size={16} /> Approve & Finalize
                    </button>
                  </div>
                </div>

                {/* AI Damage & Parts Fusion Summary Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} style={{ color: 'var(--accent-primary)' }} /> AI Part-Damage Fusion
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Front Bumper:</span>
                        <span className="badge badge-danger">Moderate Scratch & Dent</span>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Right Headlight:</span>
                        <span className="badge badge-warning">Minor Housing Crack</span>
                      </li>
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Hood Assembly:</span>
                        <span className="badge badge-success">No Major Damage</span>
                      </li>
                    </ul>
                  </div>

                  {/* Cost Estimation Breakdown */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={18} style={{ color: '#34d399' }} /> Automated Cost Estimator
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Parts Replacement:</span>
                        <strong>$420.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Labor Hours (4.5 hrs):</span>
                        <strong>$337.50</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Paint & Refinish:</span>
                        <strong>$180.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '1rem', color: '#34d399' }}>
                        <span>Total Estimated Cost:</span>
                        <strong>$937.50</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Image Preview */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Uploaded Evidence Photos</h4>
                  <div style={{
                    height: '220px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <ShieldCheck size={40} style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }} />
                      <p style={{ fontSize: '0.85rem' }}>AI Evidence Image Bounding Box Overlay Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a claim from the sidebar queue to inspect AI assessment details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
