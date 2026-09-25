import React from 'react';
import { Car, ArrowRight, Eye } from 'lucide-react';
import type { Vehicle } from './api';

interface MyVehiclesProps {
  vehicles: Vehicle[];
  onNavigate: (route: string) => void;
}

export const MyVehicles: React.FC<MyVehiclesProps> = ({ vehicles, onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>My Vehicles</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your registered vehicles, insurance policy coverage and damage assessments.
          </p>
        </div>
        <button onClick={() => onNavigate('/user/vehicles/add')} className="btn-primary">
          + Register Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <Car size={56} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>No Vehicles Registered</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Add your vehicle to start automated AI damage assessments and manage insurance claim filings.
          </p>
          <button onClick={() => onNavigate('/user/vehicles/add')} className="btn-primary">
            + Add Vehicle Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {vehicles.map((v) => (
            <div key={v.id} className="glass-panel glass-panel-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        borderRadius: '12px'
                      }}
                    >
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                        {v.make} {v.model}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {v.registration_number}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success">INSURED</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>YEAR</span>
                    <strong>{v.year}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>FUEL TYPE</span>
                    <strong>{v.fuel_type || 'Petrol'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>POLICY #</span>
                    <strong>{v.policy_number || 'POL-998877'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>STATUS</span>
                    <strong style={{ color: '#34d399' }}>Active</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  onClick={() => onNavigate(`/user/vehicles/${v.id}`)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  <Eye size={15} /> Details
                </button>
                <button
                  onClick={() => onNavigate('/user/assessment/new')}
                  className="btn-primary"
                  style={{ flex: 1.2, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  Start Assessment <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
