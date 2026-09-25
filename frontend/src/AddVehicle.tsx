import React, { useState } from 'react';
import { api } from './api';
import { Car, Shield, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AddVehicleProps {
  onNavigate: (route: string) => void;
  onVehicleAdded: () => void;
}

export const AddVehicle: React.FC<AddVehicleProps> = ({ onNavigate, onVehicleAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [regNo, setRegNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [variant] = useState('VXi / Executive');
  const [year, setYear] = useState<number>(2023);
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission] = useState('Automatic');
  const [color] = useState('Pearl White');

  const [vin, setVin] = useState('');
  const [engineNo, setEngineNo] = useState('');

  const [regDate] = useState('2023-05-10');
  const [regState, setRegState] = useState('California');
  const [rto, setRto] = useState('CA-01 West');

  const [insuranceProvider, setInsuranceProvider] = useState('State Auto Insurance');
  const [policyNo, setPolicyNo] = useState('POL-887766');
  const [policyType, setPolicyType] = useState('Comprehensive Bumper-to-Bumper');
  const [policyStart] = useState('2026-01-01');
  const [policyExpiry, setPolicyExpiry] = useState('2027-01-01');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/vehicles', {
        registration_number: regNo,
        make,
        model,
        year: Number(year),
        fuel_type: fuelType,
        vehicle_type: vehicleType,
        variant,
        transmission,
        color,
        vin,
        engine_number: engineNo,
        registration_date: regDate,
        registration_state: regState,
        rto,
        insurance_provider: insuranceProvider,
        policy_number: policyNo,
        policy_type: policyType,
        policy_start_date: policyStart,
        policy_expiry_date: policyExpiry
      });

      setSuccess(true);
      onVehicleAdded();
      setTimeout(() => {
        onNavigate('/user/vehicles');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register vehicle. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => onNavigate('/user/vehicles')} className="btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Register New Vehicle</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Complete vehicle registration & insurance policy linking.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={20} /> Vehicle registered successfully! Redirecting to list...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={20} style={{ color: 'var(--accent-primary)' }} /> SECTION 1 — VEHICLE SPECIFICATIONS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Registration Number *</label>
              <input required placeholder="e.g. ABC-1234" value={regNo} onChange={e => setRegNo(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Vehicle Type</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                <option value="Sedan" style={{ background: '#111827' }}>Sedan</option>
                <option value="SUV" style={{ background: '#111827' }}>SUV</option>
                <option value="Hatchback" style={{ background: '#111827' }}>Hatchback</option>
                <option value="Coupe" style={{ background: '#111827' }}>Coupe</option>
                <option value="Truck" style={{ background: '#111827' }}>Truck</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Make / Manufacturer *</label>
              <input required placeholder="e.g. Toyota" value={make} onChange={e => setMake(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Model *</label>
              <input required placeholder="e.g. Camry" value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Manufacturing Year *</label>
              <input type="number" required value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Fuel Type</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                <option value="Petrol" style={{ background: '#111827' }}>Petrol</option>
                <option value="Diesel" style={{ background: '#111827' }}>Diesel</option>
                <option value="EV" style={{ background: '#111827' }}>Electric (EV)</option>
                <option value="Hybrid" style={{ background: '#111827' }}>Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: '#38bdf8' }} /> SECTION 2 — IDENTIFICATION & REGISTRATION
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>VIN / Chassis Number</label>
              <input placeholder="17-digit VIN number" value={vin} onChange={e => setVin(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Engine Number</label>
              <input placeholder="Engine serial no." value={engineNo} onChange={e => setEngineNo(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Registration State</label>
              <input value={regState} onChange={e => setRegState(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>RTO Office</label>
              <input value={rto} onChange={e => setRto(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} style={{ color: '#34d399' }} /> SECTION 3 — INSURANCE POLICY DETAILS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Insurance Provider</label>
              <input value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Policy Number</label>
              <input value={policyNo} onChange={e => setPolicyNo(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Policy Type</label>
              <input value={policyType} onChange={e => setPolicyType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Expiry Date</label>
              <input type="date" value={policyExpiry} onChange={e => setPolicyExpiry(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '1rem' }}>
          {loading ? 'Submitting Registration...' : 'Complete Vehicle Registration'}
        </button>
      </form>
    </div>
  );
};
