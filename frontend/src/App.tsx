import React, { useState, useEffect } from 'react';
import { AuthModal } from './AuthModal';
import { UserLayout } from './UserLayout';
import { UserDashboard } from './UserDashboard';
import { MyVehicles } from './MyVehicles';
import { AddVehicle } from './AddVehicle';
import { NewClaimWizard } from './NewClaimWizard';
import { ClaimsModule } from './ClaimsModule';
import { ClaimDetailsView } from './ClaimDetailsView';
import { DocumentsPage } from './DocumentsPage';
import { InsuranceAssistantPage } from './InsuranceAssistantPage';
import { UserProfileView } from './SecondaryUserViews';
import { api, type User, type Vehicle, type Claim } from './api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<string>('/dashboard');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
        fetchUserData();
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const fetchUserData = async () => {
    try {
      const vehRes = await api.get('/vehicles');
      setVehicles(vehRes.data);

      const claimsRes = await api.get('/claims');
      setClaims(claimsRes.data);
    } catch (err) {
      console.error('Failed to load user vehicles & claims', err);
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    fetchUserData();
    setCurrentRoute('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading AutoInsight Insurance Portal...
      </div>
    );
  }

  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <UserLayout
      user={user}
      currentRoute={currentRoute}
      onNavigate={setCurrentRoute}
      onLogout={handleLogout}
    >
      {currentRoute === '/dashboard' && (
        <UserDashboard user={user} vehicles={vehicles} claims={claims} onNavigate={setCurrentRoute} />
      )}

      {currentRoute === '/vehicles' && (
        <MyVehicles vehicles={vehicles} onNavigate={setCurrentRoute} />
      )}

      {currentRoute === '/vehicles/add' && (
        <AddVehicle onNavigate={setCurrentRoute} onVehicleAdded={fetchUserData} />
      )}

      {currentRoute === '/claims/new' && (
        <NewClaimWizard
          vehicles={vehicles}
          onNavigate={setCurrentRoute}
          onClaimSubmitted={() => {
            fetchUserData();
          }}
        />
      )}

      {currentRoute === '/claims' && (
        <ClaimsModule
          claims={claims}
          vehicles={vehicles}
          onNavigate={setCurrentRoute}
          onClaimCreated={fetchUserData}
        />
      )}

      {currentRoute.startsWith('/claims/') && currentRoute !== '/claims/new' && (
        <ClaimDetailsView
          claimId={currentRoute.replace('/claims/', '')}
          claims={claims}
          onNavigate={setCurrentRoute}
        />
      )}

      {currentRoute === '/documents' && <DocumentsPage />}
      {currentRoute === '/assistant' && <InsuranceAssistantPage />}
      {currentRoute === '/profile' && <UserProfileView user={user} />}
    </UserLayout>
  );
};

export default App;
