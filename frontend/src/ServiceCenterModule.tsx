import React, { useState } from 'react';
import { MapPin, Phone, Mail, Star, Wrench, CheckCircle2 } from 'lucide-react';
import type { ServiceCenter, Vehicle, Claim } from './api';

interface ServiceCenterModuleProps {
  vehicles: Vehicle[];
  claims: Claim[];
  onNavigate: (route: string) => void;
}

export const ServiceCenterModule: React.FC<ServiceCenterModuleProps> = ({
  vehicles,
  onNavigate
}) => {
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form input states
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0]?.id || 0);
  const [prefDate, setPrefDate] = useState('2026-09-28');
  const [prefTime, setPrefTime] = useState('10:00 AM');
  const [pickupRequired, setPickupRequired] = useState(true);
  const [pickupAddr, setPickupAddr] = useState('742 Evergreen Terrace, Springfield');
  const [notes, setNotes] = useState('Please inspect front bumper dent & replace headlight housing.');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const mockCenters: ServiceCenter[] = [
    {
      id: 1,
      name: 'Metro Repairs & AutoCare',
      address: '104 Motorway Ave, Downtown',
      city: 'Springfield',
      phone: '+1 555-0199',
      email: 'service@metrorepairs.com',
      supported_brands: ['Toyota', 'Honda', 'Ford', 'BMW', 'Nissan'],
      insurance_providers: ['State Auto', 'Geico', 'Progressive', 'Allstate'],
      rating: 4.9,
      distance_km: 2.4,
      opening_hours: 'Mon-Sat 8:00 AM - 6:00 PM'
    },
    {
      id: 2,
      name: 'Apex Collision & Bodyworks',
      address: '58 Industrial Parkway, Eastside',
      city: 'Springfield',
      phone: '+1 555-0288',
      email: 'support@apexcollision.com',
      supported_brands: ['Toyota', 'Mercedes', 'Audi', 'Tesla', 'Hyundai'],
      insurance_providers: ['State Auto', 'Liberty Mutual', 'Nationwide'],
      rating: 4.8,
      distance_km: 4.1,
      opening_hours: 'Mon-Fri 7:30 AM - 7:00 PM'
    },
    {
      id: 3,
      name: 'Precision Motors Workshop',
      address: '912 Tech Blvd, Northville',
      city: 'Springfield',
      phone: '+1 555-0377',
      email: 'info@precisionmotors.com',
      supported_brands: ['Honda', 'Toyota', 'Mazda', 'Subaru'],
      insurance_providers: ['State Auto', 'Farmers Insurance', 'USAA'],
      rating: 4.7,
      distance_km: 6.8,
      opening_hours: 'Mon-Sat 8:00 AM - 5:00 PM'
    }
  ];

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSuccess(true);
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setSubmittedSuccess(false);
      onNavigate('/user/service-requests');
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Authorized Service Centers</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Discover certified repair workshops, inspect insurance coverage partnerships, and schedule repair appointments.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {mockCenters.map((center) => (
          <div key={center.id} className="glass-panel glass-panel-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={13} style={{ fill: '#fbbf24', color: '#fbbf24' }} /> {center.rating} ({center.distance_km} km away)
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>{center.name}</h3>
                </div>
                <span className="badge badge-success">VERIFIED</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} /> {center.address}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} /> {center.phone}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} style={{ color: 'var(--text-muted)' }} /> {center.email}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>SUPPORTED BRANDS:</strong>
                {center.supported_brands.join(', ')}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCenter(center);
                setIsRequestModalOpen(true);
              }}
              className="btn-primary"
              style={{ justifyContent: 'center', width: '100%' }}
            >
              <Wrench size={16} /> Request Service Appointment
            </button>
          </div>
        ))}
      </div>

      {isRequestModalOpen && selectedCenter && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.35rem' }}>SERVICE APPOINTMENT</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{selectedCenter.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedCenter.address}</p>
              </div>
              <button onClick={() => setIsRequestModalOpen(false)} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {submittedSuccess ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#34d399' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                <h3>Service Request Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Connecting with workshop desk for confirmation...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Select Vehicle</label>
                  <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id} style={{ background: '#111827' }}>{v.make} {v.model} ({v.registration_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Preferred Date & Time Slot</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input type="date" value={prefDate} onChange={e => setPrefDate(e.target.value)} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                    <input type="text" value={prefTime} onChange={e => setPrefTime(e.target.value)} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="pickup" checked={pickupRequired} onChange={e => setPickupRequired(e.target.checked)} />
                  <label htmlFor="pickup" style={{ fontSize: '0.85rem', color: 'white' }}>Vehicle Pickup Service Required</label>
                </div>

                {pickupRequired && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Pickup Address</label>
                    <input value={pickupAddr} onChange={e => setPickupAddr(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Customer Notes</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }} />
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '0.85rem' }}>
                  Submit Service Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
