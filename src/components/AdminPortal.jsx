import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';

export default function AdminPortal() {
  const { 
    providers, 
    bookings, 
    pricingLimits, 
    verifyProvider, 
    updatePriceLimits, 
    weather, 
    setWeatherState,
    mlWeights,
    updateMlWeights
  } = useAgri();
  
  // Pricing regulation form states
  const [selectedCategory, setSelectedCategory] = useState('tractor');
  const [newMaxCap, setNewMaxCap] = useState('');
  const [priceUpdateSuccess, setPriceUpdateSuccess] = useState(false);

  // Unverified providers
  const unverifiedProviders = providers.filter(p => !p.verified);

  // Handle pricing ceiling updates
  const handlePriceCapUpdate = (e) => {
    e.preventDefault();
    if (!newMaxCap) return;

    updatePriceLimits(selectedCategory, newMaxCap);
    setPriceUpdateSuccess(true);
    setNewMaxCap('');

    setTimeout(() => {
      setPriceUpdateSuccess(false);
    }, 3000);
  };

  // Math metrics for summary
  const totalBookingsCount = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalPlatformFees = completedBookings.reduce((sum, bk) => {
    const cost = bk.workTimer.totalCost || bk.rate;
    return sum + Math.round(cost * 0.1);
  }, 0);

  const activeTrackingSessions = bookings.filter(b => b.status === 'in_progress').length;

  return (
    <div className="flex-col gap-lg">
      
      {/* Platform Dashboard Analytics Row */}
      <div className="grid-cols-4" style={{ gap: '16px' }}>
        <div className="stat-pill" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <span className="stat-label">Active GPS Sessions</span>
          <span className="stat-value text-gradient">{activeTrackingSessions} Live</span>
        </div>
        <div className="stat-pill" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <span className="stat-label">Platform Fees (10%)</span>
          <span className="stat-value text-gradient-secondary">Rs. {totalPlatformFees}</span>
        </div>
        <div className="stat-pill" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{totalBookingsCount} Dispatched</span>
        </div>
        <div className="stat-pill" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
          <span className="stat-label">Provider Network</span>
          <span className="stat-value" style={{ color: 'var(--primary-light)' }}>
            {providers.length} Registered ({providers.filter(p => p.verified).length} Active)
          </span>
        </div>
      </div>

      {/* Main Grid: Left = Dynamic Pricing & verification queue, right = recent activities & policy control log */}
      <div className="grid-cols-2" style={{ gap: '24px' }}>
        
        {/* LEFT COLUMN: Pricing Caps, Weather & Approvals */}
        <div className="flex-col gap-md">
          
          {/* Climate Seasonal Surge Controller */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div>
              <span className="badge badge-secondary">Environmental surge algorithms</span>
              <h2 style={{ fontSize: '18px', marginTop: '6px' }}>Climate & Demand Simulator</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Simulate weather triggers showing how harvesting rushes or rainfall automatically adjust price ceilings.
              </p>
            </div>

            {/* Weather toggle options */}
            <div className="flex gap-sm" style={{ margin: '16px 0 10px 0' }}>
              {[
                { id: 'sunny', label: '☀️ Sunny Mode', color: 'var(--success)' },
                { id: 'rainy', label: '⛈️ Monsoon Rain', color: 'var(--secondary)' },
                { id: 'harvest', label: '🌾 Harvest Rush', color: 'var(--warning)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setWeatherState(opt.id)}
                  className="btn flex-1"
                  style={{
                    background: weather === opt.id ? opt.color : 'rgba(255,255,255,0.03)',
                    color: weather === opt.id ? '#0b1322' : 'white',
                    border: '1px solid ' + (weather === opt.id ? opt.color : 'rgba(255,255,255,0.05)'),
                    padding: '8px',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    boxShadow: weather === opt.id ? 'var(--shadow-md)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              lineHeight: '1.45'
            }}>
              {weather === 'sunny' && (
                <span>☀️ **Status Sunny**: Price boundaries are locked under the standard Kharif seasonal baseline. Farmers enjoy standard regulated pricing.</span>
              )}
              {weather === 'rainy' && (
                <span>⛈️ **Status Rainy**: Weeding & planting labour demand surged by 150%. Platform automatically **boosted all price ceilings by 30%** to attract online providers while guarding against merchant price-gouging.</span>
              )}
              {weather === 'harvest' && (
                <span>🌾 **Status Harvest**: Combine harvesting season active. Machine demand spiked by 250%. Platform **boosted machinery ceilings by 40%** to incentivize double-shifts while capping maximum surge exploitation.</span>
              )}
            </div>
          </div>

          {/* Machine Learning Smart Match Weight Tuning Deck */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div>
              <span className="badge badge-primary" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                🤖 ML Hyperparameter Deck
              </span>
              <h2 style={{ fontSize: '18px', marginTop: '6px' }}>Smart Match Ranking Weights</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Adjust matching priority weights. The model auto-normalizes weights in real-time, instantly updating Farmer App rankings!
              </p>
            </div>

            <div className="flex-col gap-sm" style={{ margin: '16px 0 10px 0' }}>
              
              {/* Sliders loop */}
              {[
                { key: 'distance', name: '📍 Location Proximity Weight', val: mlWeights.distance, icon: '📍' },
                { key: 'rating', name: '⭐ Reliability & Rating Weight', val: mlWeights.rating, icon: '⭐' },
                { key: 'compatibility', name: '🌱 Soil/Crop Compatibility Weight', val: mlWeights.compatibility, icon: '🌱' },
                { key: 'cost', name: '💰 Surge Pricing Cost Weight', val: mlWeights.cost, icon: '💰' }
              ].map(weight => (
                <div key={weight.key} className="flex-col" style={{ gap: '4px' }}>
                  <div className="flex justify-between" style={{ fontSize: '12px', fontWeight: 600 }}>
                    <span>{weight.name}</span>
                    <strong style={{ color: 'var(--secondary)' }}>{weight.val}%</strong>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={weight.val}
                    onChange={(e) => updateMlWeights(weight.key, e.target.value)}
                    style={{ accentColor: 'var(--secondary)', cursor: 'pointer', height: '4px' }}
                  />
                </div>
              ))}

            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>Engine: XGBoost Unified Match Ranking Classifier</span>
              <span>Model Accuracy: **94.2% (r2)**</span>
            </div>
          </div>

          {/* Dynamic Pricing Regulation Box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div>
              <span className="badge badge-warning">Price surge control regulations</span>
              <h2 style={{ fontSize: '18px', marginTop: '6px' }}>Surge Capping Manager</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Regulate and cap seasonal maximum rates per category to prevent village exploitation.
              </p>
            </div>

            {priceUpdateSuccess && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '1px solid var(--primary)', 
                color: 'var(--primary-light)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '12px',
                marginTop: '12px'
              }}>
                ✔️ Regulation ceiling changed! All provider listings exceeding this rate were auto-capped.
              </div>
            )}

            {/* Current Rates overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
              {Object.keys(pricingLimits).map(catKey => {
                const limit = pricingLimits[catKey];
                return (
                  <div key={catKey} className="flex justify-between align-center" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600 }}>{limit.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Range: Rs. {limit.min} - <strong style={{ color: 'white' }}>Rs. {limit.currentMax}</strong>/hr
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handlePriceCapUpdate} className="flex gap-sm">
              <div className="flex-col" style={{ flex: 1.2 }}>
                <select 
                  className="input-field"
                  style={{ background: '#0f172a' }}
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="tractor">Tractor Ploughing</option>
                  <option value="machinery">Combine Harvesting</option>
                  <option value="labour">Labour Group (Weed/Plant)</option>
                </select>
              </div>

              <div className="flex-col" style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder={`Max Limit (${pricingLimits[selectedCategory].min}-${pricingLimits[selectedCategory].max})`}
                  value={newMaxCap}
                  onChange={e => setNewMaxCap(e.target.value)}
                  min={pricingLimits[selectedCategory].min}
                  max={pricingLimits[selectedCategory].max}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Enforce Limit
              </button>
            </form>
          </div>

          {/* Provider Verification Requests Queue */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>
              Provider Credentials Review Inbox ({unverifiedProviders.length})
            </h3>

            <div className="flex-col gap-sm">
              {unverifiedProviders.map(prov => (
                <div 
                  key={prov.id} 
                  className="glass-card flex-col gap-sm"
                  style={{ borderLeft: '3px solid var(--secondary)', background: 'rgba(22, 30, 49, 0.4)' }}
                >
                  <div className="flex justify-between align-center">
                    <div>
                      <h4 style={{ fontSize: '14px', color: 'white' }}>{prov.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Category: {prov.type.toUpperCase()} • Machine: {prov.vehicleModel}
                      </p>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>PENDING DOCS</span>
                  </div>

                  {/* Documents visual check */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
                    <span>🪪 Identity Aadhar Card: **VERIFIED**</span>
                    <span>•</span>
                    <span>🚜 Tractor RC Book: **PENDING REVIEW**</span>
                  </div>

                  <div className="flex gap-sm" style={{ marginTop: '6px' }}>
                    <button 
                      onClick={() => verifyProvider(prov.id, true)} 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                    >
                      Approve & Activate Profile
                    </button>
                    <button 
                      onClick={() => verifyProvider(prov.id, false)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Decline File
                    </button>
                  </div>
                </div>
              ))}

              {unverifiedProviders.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px dashed rgba(255, 255, 255, 0.05)', 
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}>
                  📯 All provider credentials are up to date and verified. Queue is clean.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Disputes & Policy Logs */}
        <div className="flex-col gap-md">
          
          {/* Dispute Center & Booking History Logs */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>
              System Transaction Logs & Regulatory Audits
            </h3>

            <div className="flex-col gap-sm" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {bookings.length > 0 ? (
                bookings.map((bk, i) => (
                  <div key={bk.id} style={{ 
                    padding: '10px 14px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div className="flex justify-between align-center">
                      <strong style={{ color: 'white' }}>Ref: {bk.id.toUpperCase()}</strong>
                      <span className={`badge ${
                        bk.status === 'completed' ? 'badge-primary' : 
                        bk.status === 'cancelled' ? 'badge-danger' : 
                        bk.status === 'in_progress' ? 'badge-secondary' : 'badge-warning'
                      }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {bk.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-muted)' }}>
                      Farmer: {bk.farmerName} • Provider: {bk.providerName}
                    </div>

                    {bk.replacementAlert && (
                      <div style={{ color: 'var(--primary-light)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        🔄 **Auto Replacement Triggered**: Provider cancelled locked booking. Fined. Replacement dispatched automatically.
                      </div>
                    )}

                    {bk.gpsBoundaryBreaches > 0 && (
                      <div style={{ color: 'var(--danger)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ⚠️ **Boundary Breach Warning**: Provider exited field coordinate {bk.gpsBoundaryBreaches} times during tracking.
                      </div>
                    )}

                    <div className="flex justify-between align-center" style={{ fontSize: '10.5px', marginTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Method: **{bk.bookingMethod.toUpperCase()}**</span>
                      <span style={{ fontWeight: 'bold', color: 'white' }}>Cost: Rs. {bk.workTimer.totalCost || bk.rate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px', 
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}>
                  📜 No transactions executed yet. Live logs will stream here as you simulate booking actions.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
