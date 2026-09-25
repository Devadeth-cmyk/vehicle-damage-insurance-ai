import React, { useState } from 'react';
import { api, type Vehicle, type Claim } from './api';
import { ArrowLeft, ArrowRight, UploadCloud, CheckCircle2, FileText, Car, Shield, Sparkles } from 'lucide-react';

interface NewClaimWizardProps {
  vehicles: Vehicle[];
  onNavigate: (route: string) => void;
  onClaimSubmitted: (claim: Claim) => void;
}

export const NewClaimWizard: React.FC<NewClaimWizardProps> = ({
  vehicles,
  onNavigate,
  onClaimSubmitted
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 0);

  // Step 2: Accident details
  const [accidentDate, setAccidentDate] = useState('2026-09-24');
  const [accidentTime, setAccidentTime] = useState('14:30');
  const [accidentLocation, setAccidentLocation] = useState('Highway 101, Exit 24');
  const [accidentType, setAccidentType] = useState('Front collision');
  const [description, setDescription] = useState('Front bumper dented and headlamp glass cracked after minor collision.');

  // Step 3: Insurance information
  const [insurerName, setInsurerName] = useState('State Auto Insurance');
  const [policyNo, setPolicyNo] = useState('POL-2026-9988');
  const [policyType, setPolicyType] = useState('Comprehensive Bumper-to-Bumper');
  const [policyStart, setPolicyStart] = useState('2026-01-01');
  const [policyExpiry, setPolicyExpiry] = useState('2027-01-01');

  // Step 4 & 5: Evidence & Documents
  const [evidenceFiles, setEvidenceFiles] = useState<{ category: string; file: File }[]>([]);
  const [documentFiles, setDocumentFiles] = useState<{ name: string; file: File }[]>([]);

  // Confirmation Checkbox
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const handleEvidenceAdd = (category: string, file: File) => {
    setEvidenceFiles((prev) => [...prev, { category, file }]);
  };

  const handleDocumentAdd = (file: File) => {
    setDocumentFiles((prev) => [...prev, { name: file.name, file }]);
  };

  const handleSubmitClaim = async () => {
    if (!confirmed) return;
    setLoading(true);

    try {
      // 1. Submit Claim to FastAPI backend
      const claimRes = await api.post('/claims', {
        vehicle_id: selectedVehicleId,
        incident_date: `${accidentDate}T${accidentTime}:00Z`,
        incident_description: description,
        policy_number: policyNo
      });

      const claimId = claimRes.data.claim_id;

      // 2. Upload evidence files if provided
      for (const item of evidenceFiles) {
        const formData = new FormData();
        formData.append('file', item.file);
        await api.post(`/documents/claims/${claimId}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Fetch fresh created claim record
      const listRes = await api.get('/claims');
      const updated = listRes.data.find((c: Claim) => c.claim_id === claimId) || claimRes.data;

      setCreatedClaim(updated);
      onClaimSubmitted(updated);
      setLoading(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit claim.');
      setLoading(false);
    }
  };

  if (createdClaim) {
    return (
      <div className="glass-panel" style={{ maxWidth: '650px', margin: '2rem auto', padding: '3rem', textAlign: 'center', background: '#ffffff' }}>
        <div style={{ width: '64px', height: '64px', background: '#dcfce7', color: '#15803d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <CheckCircle2 size={36} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Claim Submitted Successfully
        </h2>
        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Claim ID: <strong>{createdClaim.claim_id}</strong>
        </p>
        <p style={{ fontSize: '0.9rem', color: '#64748b', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          Your claim has been submitted to the backend database and automatically sent to the <strong>Service Center Queue</strong> for vehicle damage assessment.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => onNavigate(`/claims/${createdClaim.claim_id}`)} className="btn-primary">
            Track Claim Status
          </button>
          <button onClick={() => onNavigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* MULTI-STEP PROGRESS STEPPER */}
      <div className="glass-panel" style={{ padding: '1.25rem 2rem', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {[
          { num: 1, label: 'Vehicle' },
          { num: 2, label: 'Accident' },
          { num: 3, label: 'Insurance' },
          { num: 4, label: 'Evidence' },
          { num: 5, label: 'Documents' },
          { num: 6, label: 'Review' }
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: step === s.num ? '#0284c7' : step > s.num ? '#10b981' : '#f1f5f9',
                color: step === s.num || step > s.num ? 'white' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {step > s.num ? <CheckCircle2 size={15} /> : s.num}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? '#0f172a' : '#94a3b8' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: VEHICLE */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 1 — Select Vehicle</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select the registered vehicle involved in the claim.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderColor: selectedVehicleId === v.id ? '#0284c7' : 'var(--border-color)',
                  background: selectedVehicleId === v.id ? '#f0f9ff' : '#ffffff'
                }}
              >
                <Car size={24} style={{ color: '#0284c7', marginBottom: '0.5rem' }} />
                <h4 style={{ fontWeight: 700, color: '#0f172a' }}>{v.make} {v.model}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Reg #: {v.registration_number}</p>
                <span className="badge badge-success" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>COVERED</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => onNavigate('/vehicles/add')} className="btn-secondary">
              + Add New Vehicle
            </button>
            <button onClick={() => setStep(2)} className="btn-primary">
              Next: Accident Details <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ACCIDENT DETAILS */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 2 — Accident Details</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter details about how the accident occurred.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Accident Date *</label>
              <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Approximate Time *</label>
              <input type="time" value={accidentTime} onChange={(e) => setAccidentTime(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Accident Location *</label>
              <input value={accidentLocation} onChange={(e) => setAccidentLocation(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Accident Type *</label>
              <select value={accidentType} onChange={(e) => setAccidentType(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }}>
                <option value="Collision">Collision</option>
                <option value="Rear-end collision">Rear-end collision</option>
                <option value="Front collision">Front collision</option>
                <option value="Side collision">Side collision</option>
                <option value="Parking damage">Parking damage</option>
                <option value="Weather-related damage">Weather-related damage</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Accident Description *</label>
              <textarea rows={3} placeholder="Describe what happened and the visible damage..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Next: Insurance Info <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 3: INSURANCE INFO */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 3 — Insurance Information</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pre-filled from registered vehicle record. Edit if needed.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Insurer Name</label>
              <input value={insurerName} onChange={(e) => setInsurerName(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Policy Number</label>
              <input value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Policy Type</label>
              <input value={policyType} onChange={(e) => setPolicyType(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.35rem' }}>Policy Expiry Date</label>
              <input type="date" value={policyExpiry} onChange={(e) => setPolicyExpiry(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep(4)} className="btn-primary">Next: Evidence Upload <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 4: EVIDENCE UPLOAD */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 4 — Evidence Upload</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upload damage photos (Front, Rear, Left, Right, Close-up, Video).</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {['Front', 'Rear', 'Left Side', 'Right Side'].map((cat) => (
              <div key={cat} style={{ border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', background: '#f8fafc' }}>
                <UploadCloud size={28} style={{ color: '#0284c7', marginBottom: '0.35rem' }} />
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat} Damage Image</h5>
                <input
                  type="file"
                  onChange={(e) => e.target.files && handleEvidenceAdd(cat, e.target.files[0])}
                  id={`file-${cat}`}
                  style={{ display: 'none' }}
                />
                <label htmlFor={`file-${cat}`} className="btn-secondary" style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                  Choose Photo
                </label>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, marginBottom: '1.5rem' }}>
            Total Uploaded Evidence Files: {evidenceFiles.length}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep(5)} className="btn-primary">Next: Supporting Documents <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 5: SUPPORTING DOCUMENTS */}
      {step === 5 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 5 — Supporting Documents</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upload Insurance Policy, Driving License, or Police FIR documents.</p>

          <div style={{ border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: '#f8fafc', marginBottom: '1.5rem' }}>
            <FileText size={36} style={{ color: '#0284c7', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>Select Policy PDF, Registration Certificate, or DL</p>
            <input
              type="file"
              onChange={(e) => e.target.files && handleDocumentAdd(e.target.files[0])}
              id="doc-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="doc-input" className="btn-secondary" style={{ marginTop: '0.75rem', cursor: 'pointer' }}>
              Choose Document File
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(4)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep(6)} className="btn-primary">Review & Submit Claim <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 6: REVIEW & SUBMIT */}
      {step === 6 && (
        <div className="glass-panel" style={{ padding: '2rem', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Step 6 — Review & Confirm</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Verify all details before submitting claim to backend & Service Center queue.</p>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <p><strong>Vehicle:</strong> {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.registration_number})</p>
            <p><strong>Accident Details:</strong> {accidentType} on {accidentDate} @ {accidentLocation}</p>
            <p><strong>Description:</strong> {description}</p>
            <p><strong>Insurer & Policy #:</strong> {insurerName} ({policyNo})</p>
            <p><strong>Evidence Attached:</strong> {evidenceFiles.length} photos/videos</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input type="checkbox" id="confirm-check" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <label htmlFor="confirm-check" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
              I confirm that the information provided is accurate.
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(5)} className="btn-secondary"><ArrowLeft size={16} /> Edit Details</button>
            <button onClick={handleSubmitClaim} className="btn-primary" disabled={!confirmed || loading}>
              {loading ? 'Submitting to Backend...' : 'SUBMIT CLAIM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
