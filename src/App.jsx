import React, { useState } from 'react';
import { AgriProvider, useAgri } from './context/AgriContext';
import FieldMap from './components/FieldMap';
import FarmerPortal from './components/FarmerPortal';
import ProviderPortal from './components/ProviderPortal';
import HelplinePortal from './components/HelplinePortal';
import AdminPortal from './components/AdminPortal';
import './App.css';

function MainAppLayout() {
  const { userRole, setUserRole, smsLogs, providers } = useAgri();
  const [selectedMapProviderId, setSelectedMapProviderId] = useState(null);
  const [showTour, setShowTour] = useState(true); // COLLAPSIBLE TOUR BANNER STATE!

  // Active Map Provider details
  const selectedProvider = providers.find(p => p.id === selectedMapProviderId);

  return (
    <div className="flex-col min-h-screen">
      
      {/* 1. Header Simulation bar & Switchboard */}
      <header className="simulation-bar flex justify-between align-center flex-wrap gap-md">
        
        {/* Title Logo Area */}
        <div className="flex align-center gap-sm">
          <span style={{ fontSize: '28px' }}>🌾</span>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AgriMarket <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>FINAL YEAR SHOWCASE</span>
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Digital + IVR Agricultural Services Marketplace
            </p>
          </div>
        </div>

        {/* Dynamic Role Switcher Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'farmer', label: '🌾 Farmer App' },
            { id: 'provider', label: '🚜 Provider App' },
            { id: 'helpline', label: '📞 Voice Helpline & IVR' },
            { id: 'admin', label: '⚙️ Admin Console' }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setUserRole(role.id)}
              className="btn"
              style={{
                background: userRole === role.id ? 'var(--primary)' : 'transparent',
                color: userRole === role.id ? 'white' : 'var(--text-muted)',
                padding: '6px 14px',
                fontSize: '12.5px',
                borderRadius: '8px',
                boxShadow: userRole === role.id ? 'var(--shadow-glow)' : 'none'
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Global indicator */}
        <div className="status-indicator">
          <span className="pulse-dot" style={{ background: '#10b981' }}></span>
          <span style={{ fontWeight: 600, color: 'white' }}>SIMULATION ONLINE</span>
        </div>

      </header>

      {/* NEW PREMIUM FEATURE: Collapsible Onboarding Showcase Tour & Companion Guide */}
      {showTour && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.04)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '16px 24px',
          transition: 'all 0.3s ease'
        }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '12px' }}>
            <h4 style={{ color: 'var(--primary-light)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 QUICK PRESENTATION CHEATSHEET (Follow these steps to demonstrate the platform innovations)
            </h4>
            <button 
              onClick={() => setShowTour(false)}
              className="btn btn-secondary"
              style={{ padding: '3px 8px', fontSize: '10px', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              ✕ Hide Showcase Guide
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--primary)', fontSize: '12px' }}>
              <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>Step 1: 🌾 Sketch plot & Book Machine</strong>
              In the **Farmer App**, click the **Live Map** to sketch a custom satellite boundary perimeter, filter tractors by radius, and tap **⚡ Instant Book** on Baldev Singh's card. (Check the bottom-right SMS logs!)
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)', fontSize: '12px' }}>
              <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>Step 2: 🚜 Verify OTP & GPS Breaches</strong>
              Switch to **Provider App** (select Baldev), accept the booking, copy the OTP, and start the timer. Click **⚠️ Trigger GPS Field Exit** on the map to watch the timer pause instantly!
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--warning)', fontSize: '12px' }}>
              <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>Step 3: ⛈️ Climate Surge & ML Tuning</strong>
              Go to **Admin Console**. Click **⛈️ Monsoon Rain** to see rainfall animations and dynamic price surge ceiling boosts, or slide **ML weights** to re-rank Farmer App providers live!
            </div>
          </div>
        </div>
      )}

      {/* Button to bring back showcase tour if hidden */}
      {!showTour && (
        <div style={{ padding: '4px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowTour(true)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10.5px', cursor: 'pointer' }}
          >
            💡 Show Evaluator presentation Guide
          </button>
        </div>
      )}

      {/* 2. Main Portal Grid Layout */}
      <main className="container flex-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '28px', padding: '20px 0' }}>
        
        {/* Left Side: Active Role Dashboards */}
        <section className="flex-col gap-lg" style={{ minWidth: 0 }}>
          
          {/* Active view title banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-10px' }}>
            <div>
              <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                Active Session
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'white' }}>
                {userRole === 'farmer' && 'Farmer App Portal'}
                {userRole === 'provider' && 'Provider Operations Deck'}
                {userRole === 'helpline' && 'Call-Based Booking Simulator'}
                {userRole === 'admin' && 'Central Regulatory Command'}
              </h2>
            </div>
            
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {userRole === 'farmer' && 'Book verified nearby machinery & squads with locked prices'}
              {userRole === 'provider' && 'Accept village orders, track GPS work verify timers & view earnings'}
              {userRole === 'helpline' && 'Dial toll-free IVR or operate booking agent logs'}
              {userRole === 'admin' && 'Cap seasonal prices, review profiles & audit coordinate compliance'}
            </p>
          </div>

          <div style={{ minWidth: 0 }}>
            {userRole === 'farmer' && (
              <FarmerPortal 
                selectedProviderId={selectedMapProviderId} 
                onSelectProvider={setSelectedMapProviderId} 
              />
            )}
            {userRole === 'provider' && <ProviderPortal />}
            {userRole === 'helpline' && <HelplinePortal />}
            {userRole === 'admin' && <AdminPortal />}
          </div>

        </section>

        {/* Right Side: Map & Map details panel */}
        <section className="flex-col gap-lg" style={{ minWidth: 0 }}>
          
          {/* Dynamic map visual */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <FieldMap 
              selectedProviderId={selectedMapProviderId} 
              onSelectProvider={setSelectedMapProviderId} 
            />
          </div>

          {/* Interactive node inspector details */}
          <div className="glass-panel flex-col gap-sm" style={{ padding: '20px', minHeight: '180px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ℹ️ Node Inspector
            </h3>
            
            {selectedProvider ? (
              <div className="flex-col gap-sm" style={{ marginTop: '4px' }}>
                <div className="flex justify-between align-center">
                  <h4 style={{ fontSize: '16px', color: 'white' }}>{selectedProvider.name}</h4>
                  <span className={`badge ${
                    selectedProvider.type === 'tractor' ? 'badge-primary' : 
                    selectedProvider.type === 'labour' ? 'badge-secondary' : 'badge-warning'
                  }`}>
                    {selectedProvider.type.toUpperCase()}
                  </span>
                </div>

                <div className="grid-cols-2" style={{ gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Machine Model: </span>
                    <strong style={{ color: 'white' }}>{selectedProvider.vehicleModel}</strong>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pricing Limit: </span>
                    <strong style={{ color: 'var(--primary-light)' }}>Rs. {selectedProvider.pricePerUnit}/hr</strong>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Performance Rank: </span>
                    <strong style={{ color: 'var(--warning)' }}>⭐ {selectedProvider.rating} ({selectedProvider.performanceScore}%)</strong>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Operational Status: </span>
                    <strong style={{ color: selectedProvider.status === 'online' ? 'var(--primary-light)' : 'var(--danger)' }}>
                      ● {selectedProvider.status.toUpperCase()}
                    </strong>
                  </div>
                </div>

                <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                  💡 **Verification Note**: This provider holds platform compliance certifications. Selecting them triggers the automatic secure work timers and GPS verification perimeters.
                </div>
              </div>
            ) : (
              <div className="flex-col justify-center align-center" style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</span>
                <p style={{ fontSize: '12px' }}>Click any vehicle or worker dot on the **Village GPS Map** above to inspect active credentials and coordinate nodes live.</p>
              </div>
            )}
          </div>

        </section>

      </main>

      {/* 3. Floating Scrolling SMS log drawers */}
      <div className="sms-log-container">
        
        {/* Render top 3 SMS messages visually */}
        {smsLogs.slice(0, 3).map((log) => (
          <div key={log.id} className="sms-toast">
            <div className="sms-header">
              <span>💬 SMS Broadcast</span>
              <span className="sms-time">{log.time}</span>
            </div>
            <div className="sms-body">
              <strong style={{ color: 'var(--primary-light)' }}>To {log.to}:</strong> {log.message}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AgriProvider>
      <MainAppLayout />
    </AgriProvider>
  );
}
