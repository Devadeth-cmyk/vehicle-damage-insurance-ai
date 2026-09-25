import React, { useState } from 'react';
import { FileCheck2, Plus, ArrowRight, UploadCloud, CheckCircle2 } from 'lucide-react';
import { api, type Claim, type Vehicle } from './api';

interface ClaimsModuleProps {
  claims: Claim[];
  vehicles: Vehicle[];
  onNavigate: (route: string) => void;
  onClaimCreated: () => void;
  isCreateMode?: boolean;
}

export const ClaimsModule: React.FC<ClaimsModuleProps> = ({
  claims,
  vehicles,
  onNavigate,
  onClaimCreated,
  isCreateMode = false
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 0);
  const [policyNo, setPolicyNo] = useState('POL-998877');
  const [description, setDescription] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const claimRes = await api.post('/claims', {
        vehicle_id: selectedVehicleId,
        incident_date: new Date().toISOString(),
        incident_description: description,
        policy_number: policyNo
      });

      const claimId = claimRes.data.claim_id;

      if (selectedDoc) {
        const formData = new FormData();
        formData.append('file', selectedDoc);
        await api.post(`/documents/claims/${claimId}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccess(`Claim #${claimId} submitted successfully!`);
      onClaimCreated();
      setTimeout(() => {
        onNavigate('/user/claims');
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  if (isCreateMode) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>File Insurance Claim</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Submit an official insurance claim with AI damage assessment report.
            </p>
          </div>
          <button onClick={() => onNavigate('/user/claims')} className="btn-secondary">
            View Claims
          </button>
        </div>

        {success && (
          <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleCreateClaim} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Select Vehicle</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} style={{ background: '#111827' }}>
                  {v.make} {v.model} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Policy Number</label>
            <input
              required
              value={policyNo}
              onChange={(e) => setPolicyNo(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Claim Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe incident & claim details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Supporting Document (Driving License, Policy, FIR)</label>
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <UploadCloud size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedDoc ? selectedDoc.name : 'Click to attach supporting document PDF/JPG'}</p>
              <input type="file" onChange={(e) => e.target.files && setSelectedDoc(e.target.files[0])} id="doc-upload" style={{ display: 'none' }} />
              <label htmlFor="doc-upload" className="btn-secondary" style={{ marginTop: '0.5rem', cursor: 'pointer' }}>Choose File</label>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem' }}>
            {loading ? 'Submitting Claim...' : 'Submit Claim'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>My Claims</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track filed insurance claims, status updates, and repair approvals.</p>
        </div>
        <button onClick={() => onNavigate('/user/claims/new')} className="btn-primary">
          <Plus size={18} /> File New Claim
        </button>
      </div>

      {claims.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <FileCheck2 size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>No Claims Filed</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start an AI damage assessment or file an insurance claim directly.</p>
          <button onClick={() => onNavigate('/user/claims/new')} className="btn-primary">File First Claim</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {claims.map((c) => (
            <div key={c.claim_id} className="glass-panel glass-panel-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLAIM REFERENCE</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{c.claim_id}</h4>
                  </div>
                  <span className={`badge ${c.status.toLowerCase().includes('completed') ? 'badge-success' : 'badge-info'}`}>
                    {c.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  <p><strong>Policy #:</strong> {c.policy_number || 'POL-998877'}</p>
                  <p><strong>Incident Date:</strong> {new Date(c.incident_date).toLocaleDateString()}</p>
                  <p><strong>Description:</strong> {c.incident_description}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Estimate: <strong>$937.50</strong></span>
                <button onClick={() => onNavigate('/user/service-centers')} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                  Assign Workshop <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
