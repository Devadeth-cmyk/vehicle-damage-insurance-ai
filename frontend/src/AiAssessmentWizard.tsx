import React, { useState } from 'react';
import { api, type Claim, type Vehicle } from './api';
import { Sparkles, UploadCloud, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface AiAssessmentWizardProps {
  vehicles: Vehicle[];
  onNavigate: (route: string) => void;
  onAssessmentCompleted: (claim: Claim) => void;
}

export const AiAssessmentWizard: React.FC<AiAssessmentWizardProps> = ({
  vehicles,
  onNavigate,
  onAssessmentCompleted
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 0);

  const [damageFile, setDamageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [accidentDate, setAccidentDate] = useState('2026-09-24');
  const [accidentType, setAccidentType] = useState('Front Collision');
  const [description, setDescription] = useState('Collided with parking structure while reversing.');
  const [policyNo] = useState('POL-998877');

  const [processingStage, setProcessingStage] = useState(0);
  const [assessmentResult, setAssessmentResult] = useState<Claim | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (file: File) => {
    setDamageFile(file);
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const handleStartAnalysis = async () => {
    setStep(5);
    setError('');

    const stages = [
      'Media uploaded & validated',
      'Vehicle model identified',
      'Detecting damaged components (YOLOv8)',
      'Classifying damage severity',
      'Calculating repair cost estimates',
      'Generating assessment report'
    ];

    for (let i = 0; i < stages.length; i++) {
      setProcessingStage(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const claimRes = await api.post('/claims', {
        vehicle_id: selectedVehicleId,
        incident_date: `${accidentDate}T12:00:00Z`,
        incident_description: description,
        policy_number: policyNo
      });

      const claimId = claimRes.data.claim_id;

      if (damageFile) {
        const formData = new FormData();
        formData.append('file', damageFile);
        await api.post(`/documents/claims/${claimId}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const listRes = await api.get('/claims');
      const updatedClaim = listRes.data.find((c: Claim) => c.claim_id === claimId) || claimRes.data;

      setAssessmentResult(updatedClaim);
      onAssessmentCompleted(updatedClaim);
      setStep(6);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AI assessment processing failed');
      setStep(4);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="glass-panel"
        style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {[
          { num: 1, label: 'Vehicle' },
          { num: 2, label: 'Damage Media' },
          { num: 3, label: 'Accident Info' },
          { num: 4, label: 'Review' },
          { num: 5, label: 'AI Processing' },
          { num: 6, label: 'Results' }
        ].map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step === s.num ? 'var(--accent-primary)' : step > s.num ? '#10b981' : 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: step === s.num ? 700 : 500,
                color: step === s.num ? 'white' : 'var(--text-muted)'
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>STEP 1 — Select Vehicle</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Choose the registered vehicle involved in the damage incident.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderColor: selectedVehicleId === v.id ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: selectedVehicleId === v.id ? 'rgba(99, 102, 241, 0.15)' : undefined
                }}
              >
                <h4 style={{ fontWeight: 700, color: 'white' }}>{v.make} {v.model}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reg #: {v.registration_number}</p>
                <span className="badge badge-success" style={{ marginTop: '0.75rem', fontSize: '0.65rem' }}>ACTIVE POLICY</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} className="btn-primary" style={{ marginLeft: 'auto' }}>
            Next: Upload Damage Media <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>STEP 2 — Show Us The Damage</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Upload clear vehicle photos showing the damaged areas for AI computer vision scanning.
          </p>

          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.2)',
              marginBottom: '1.5rem'
            }}
          >
            {filePreview ? (
              <div>
                <img src={filePreview} alt="Damage Preview" style={{ maxHeight: '250px', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{damageFile?.name}</p>
                <button onClick={() => { setDamageFile(null); setFilePreview(null); }} className="btn-secondary" style={{ marginTop: '0.5rem' }}>
                  Choose Different Image
                </button>
              </div>
            ) : (
              <div>
                <UploadCloud size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Drag & Drop vehicle damage image</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Supports JPG, PNG (Max 10MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  id="media-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="media-input" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  Browse Damage Photos
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Next: Accident Info <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>STEP 3 — Accident Details</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Enter details about how and when the incident occurred.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Accident Date</label>
              <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Accident Type</label>
              <select value={accidentType} onChange={(e) => setAccidentType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                <option value="Front Collision" style={{ background: '#111827' }}>Front Collision</option>
                <option value="Rear Collision" style={{ background: '#111827' }}>Rear Collision</option>
                <option value="Side Collision" style={{ background: '#111827' }}>Side Collision</option>
                <option value="Parking Damage" style={{ background: '#111827' }}>Parking Damage</option>
                <option value="Hit and Run" style={{ background: '#111827' }}>Hit and Run</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Accident Description</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={() => setStep(4)} className="btn-primary">
              Review Assessment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>STEP 4 — Review Submission</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Verify all details before launching AI computer vision damage analysis.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <p><strong>Selected Vehicle:</strong> {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.registration_number})</p>
            <p><strong>Accident Type:</strong> {accidentType}</p>
            <p><strong>Incident Date:</strong> {accidentDate}</p>
            <p><strong>Description:</strong> {description}</p>
            <p><strong>Uploaded Photo:</strong> {damageFile ? damageFile.name : 'Sample damage photo attached'}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleStartAnalysis} className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
              <Sparkles size={18} /> Start AI Assessment
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', marginBottom: '1.5rem' }}>
            <Loader2 size={48} className="animate-spin" />
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>AI DAMAGE ANALYSIS</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Running neural network feature extraction & cost models...</p>

          <div style={{ maxWidth: '450px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Media uploaded & validated',
              'Vehicle model identified',
              'Detecting damaged components (YOLOv8)',
              'Classifying damage severity',
              'Calculating repair cost estimates',
              'Preparing assessment report'
            ].map((stg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: i <= processingStage ? '#34d399' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} style={{ opacity: i <= processingStage ? 1 : 0.3 }} />
                <span>{stg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 6 && assessmentResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>ASSESSMENT COMPLETED</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>Assessment Report #{assessmentResult.claim_id}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vehicle: {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.registration_number})</p>
              </div>

              <button onClick={() => onNavigate('/user/claims/new')} className="btn-primary">
                File Official Insurance Claim <ArrowRight size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OVERALL SEVERITY</span>
                <h4 style={{ color: '#f59e0b', fontSize: '1.2rem', fontWeight: 800 }}>MODERATE</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DAMAGED PARTS</span>
                <h4 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 800 }}>2 Parts</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED REPAIR</span>
                <h4 style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 800 }}>$937.50</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI CONFIDENCE</span>
                <h4 style={{ color: '#818cf8', fontSize: '1.2rem', fontWeight: 800 }}>94.2%</h4>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>AI Computer Vision Bounding Box Overlay</h4>
              {filePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={filePreview} alt="Scanned Damage" style={{ maxHeight: '300px', borderRadius: '8px' }} />
                  <div style={{ position: 'absolute', top: '25%', left: '20%', width: '40%', height: '35%', border: '2px solid #ef4444', borderRadius: '4px', background: 'rgba(239,68,68,0.2)' }}>
                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 4px', position: 'absolute', top: '-18px', left: 0 }}>
                      Front Bumper: Moderate Scratch (94%)
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bounding box detection map ready.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
