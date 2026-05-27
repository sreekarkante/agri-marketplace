import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';

export default function FarmerPortal({ selectedProviderId, onSelectProvider }) {
  const { 
    providers, 
    bookings, 
    addBooking, 
    completePayment, 
    cancelBooking, 
    customFieldPolygon, 
    setCustomFieldPolygon,
    mlWeights 
  } = useAgri();
  
  // Filtering states
  const [radius, setRadius] = useState(6); // km
  const [filterType, setFilterType] = useState('all'); // 'all', 'tractor', 'labour', 'machinery'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingTime, setBookingTime] = useState('09:00 AM - 12:00 PM');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Razorpay simulator modal states
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [checkoutBookingId, setCheckoutBookingId] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState('qr'); // 'qr', 'processing', 'success'
  const [activeTab, setActiveTab] = useState('upi'); // 'upi', 'card'

  // Find current active booking for Sree (the demo farmer)
  const activeBooking = bookings.find(bk => 
    bk.farmerName === 'Farmer K. Sree' && 
    bk.status !== 'rejected' && 
    (bk.status !== 'completed' || bk.paymentStatus !== 'paid') &&
    bk.status !== 'cancelled'
  );

  // Helper: ML Matching calculation
  const calculateMlMatchScore = (prov) => {
    // Distance Factor
    const distScore = Math.max(10, 100 - Math.round(prov.distance * 8));
    // Rating Factor
    const ratingScore = Math.round((prov.rating / 5.0) * 100);
    // Cost Factor (cheaper is better)
    const costScore = Math.max(10, 100 - Math.round(((prov.pricePerUnit - 300) / 1900) * 100));
    
    // Crop/Soil Compatibility Factor (Sree's Rice field = Paddy)
    let compatibilityScore = 90;
    if (prov.service === 'Paddy Planting') compatibilityScore = 100;
    else if (prov.service === 'Harvester Machine') compatibilityScore = 98;
    else if (prov.service === 'Deep Ploughing') compatibilityScore = 94;
    else if (prov.service === 'Rotavator Tilling') compatibilityScore = 88;
    else if (prov.service === 'Manual Weeding') compatibilityScore = 92;

    const weightedScore = Math.round(
      (distScore * mlWeights.distance +
       ratingScore * mlWeights.rating +
       compatibilityScore * mlWeights.compatibility +
       costScore * mlWeights.cost) / 100
    );

    return {
      total: Math.min(100, Math.max(10, weightedScore)),
      distance: distScore,
      rating: ratingScore,
      compatibility: compatibilityScore,
      cost: costScore
    };
  };

  // Filter providers
  const filteredProviders = providers.filter(prov => {
    // Distance simulation based on ID to keep it deterministic
    const distanceMap = { 'prov-1': 1.8, 'prov-2': 4.2, 'prov-3': 8.5, 'prov-4': 2.3, 'prov-5': 5.7 };
    const dist = distanceMap[prov.id] || 3.0;
    prov.distance = dist;

    const matchesRadius = dist <= radius;
    const matchesType = filterType === 'all' || prov.type === filterType;
    const isOnline = prov.status === 'online';
    const isVerified = prov.verified; // Show verified listings to farmer

    return matchesRadius && matchesType && isOnline && isVerified;
  });

  // Calculate ML scores and Sort dynamically by Match Score!
  const rankedProviders = filteredProviders.map(prov => {
    const ml = calculateMlMatchScore(prov);
    return {
      ...prov,
      mlScore: ml.total,
      mlDetails: ml
    };
  }).sort((a, b) => b.mlScore - a.mlScore);

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!selectedProvider) return;

    addBooking({
      farmerName: 'Farmer K. Sree',
      farmerPhone: '9898989898',
      providerId: selectedProvider.id,
      rate: selectedProvider.pricePerUnit,
      date: bookingDate,
      timeSlot: bookingTime,
      bookingMethod: 'app'
    });

    setSelectedProvider(null);
  };

  // Launch custom Razorpay Secure Checkout Overlay
  const startCheckout = (bookingId) => {
    setCheckoutBookingId(bookingId);
    setCheckoutStatus('qr');
    setShowRazorpay(true);
  };

  // Simulate payment processing loader
  const triggerSimulatePayment = () => {
    setCheckoutStatus('processing');
    
    setTimeout(() => {
      setCheckoutStatus('success');
      
      setTimeout(() => {
        completePayment(checkoutBookingId);
        setShowRazorpay(false);
      }, 2000);

    }, 2500);
  };

  return (
    <div className="flex-col gap-lg">
      
      {/* Active Tracking Bar if booking is ongoing */}
      {activeBooking && (
        <div className="glass-panel" style={{ 
          padding: '20px', 
          borderLeft: '4px solid ' + (
            activeBooking.status === 'in_progress' ? 'var(--primary)' : 
            activeBooking.status === 'pending' ? 'var(--warning)' : 'var(--secondary)'
          ),
          background: 'rgba(30, 41, 59, 0.8)'
        }}>
          <div className="flex justify-between align-center flex-wrap gap-sm">
            <div>
              <span className="badge badge-primary">
                {activeBooking.status === 'pending' && '⏳ Awaiting Provider Acceptance'}
                {activeBooking.status === 'accepted' && '🔒 Confirmed & Locked'}
                {activeBooking.status === 'in_progress' && '🚜 Active Field Operation'}
                {activeBooking.status === 'completed' && '✔️ Job Finished'}
              </span>
              <h3 style={{ fontSize: '18px', marginTop: '6px' }}>
                Booking Reference: {activeBooking.id.toUpperCase()}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Provider: {activeBooking.providerName} • {activeBooking.serviceName}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Secured Security OTP</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--warning)', letterSpacing: '2px' }}>
                {activeBooking.otpCode}
              </div>
            </div>
          </div>

          {/* SATELLITE POLYGON PLOT NOTIFIER */}
          <div style={{
            marginTop: '12px',
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>
              🛰️ **Satellite Plotting boundary**: {customFieldPolygon.length >= 3 
                ? `Active. Drawn Perimeter locked with ${customFieldPolygon.length} GPS coordinate points.` 
                : 'Using village default circle plot boundary. You can sketch a custom boundary on the live map.'
              }
            </span>
            {!activeBooking.workTimer.isActive && activeBooking.status !== 'completed' && (
              <button 
                onClick={() => {
                  alert("To draw: Look at the live map on the right. Click 'Sketch Custom Boundary' and click the grid nodes!");
                }}
                className="btn btn-secondary" 
                style={{ padding: '3px 8px', fontSize: '9.5px', borderColor: 'rgba(6, 182, 212, 0.3)' }}
              >
                Learn How to Draw
              </button>
            )}
          </div>

          <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

          {/* Dynamic tracking panel */}
          {activeBooking.status === 'pending' && (
            <div style={{ fontSize: '13px' }}>
              ℹ️ Under our **Booking Guarantee**, once accepted, the provider cannot cancel without high penalties. If they decline or delay, the platform will automatically route a replacement vehicle to your field.
            </div>
          )}

          {activeBooking.status === 'accepted' && (
            <div style={{ fontSize: '13px' }}>
              📍 **Ready to Start**: The provider is en route to your field. Share the OTP **{activeBooking.otpCode}** only when the machine reaches your field boundary to verify and trigger the work timer.
            </div>
          )}

          {activeBooking.status === 'in_progress' && (
            <div className="grid-cols-3" style={{ gap: '16px' }}>
              <div className="stat-pill">
                <span className="stat-label">Elapsed Work Time</span>
                <span className="stat-value" style={{ fontFamily: 'monospace' }}>
                  {Math.floor(activeBooking.workTimer.secondsElapsed / 60)}m {activeBooking.workTimer.secondsElapsed % 60}s
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Real-Time Cost</span>
                <span className="stat-value text-gradient">Rs. {activeBooking.workTimer.totalCost}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">GPS Perimeter Status</span>
                <span className="stat-value" style={{ 
                  color: activeBooking.gpsStatus === 'breached' ? 'var(--danger)' : 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {activeBooking.gpsStatus === 'breached' ? '🛑 PAUSED (Outside Field)' : '🟢 Working Inside Field'}
                </span>
              </div>
            </div>
          )}

          {activeBooking.status === 'completed' && (
            <div className="flex justify-between align-center flex-wrap gap-sm">
              <div style={{ fontSize: '14px' }}>
                Invoice Total: <strong style={{ color: 'white', fontSize: '16px' }}>Rs. {activeBooking.workTimer.totalCost}</strong> for {Math.ceil(activeBooking.workTimer.secondsElapsed / 60)} minutes.
              </div>
              
              {activeBooking.paymentStatus === 'unpaid' ? (
                <button 
                  onClick={() => startCheckout(activeBooking.id)} 
                  className="btn btn-primary"
                >
                  💳 Secure UPI Checkout (Razorpay)
                </button>
              ) : (
                <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  ✔️ PAID SUCCESSFUL
                </span>
              )}
            </div>
          )}

          {/* Cancellation options */}
          {activeBooking.status !== 'completed' && (
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  const reason = prompt("Enter cancellation reason:");
                  if (reason) cancelBooking(activeBooking.id, 'farmer', reason);
                }} 
                className="btn btn-danger" 
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      )}

      {/* RAZORPAY UPI CHECKOUT MODAL OVERLAY */}
      {showRazorpay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(7, 11, 19, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel flex-col" style={{ 
            width: '100%', 
            maxWidth: '420px', 
            background: '#0d1322', 
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), var(--shadow-glow-secondary)'
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: '#0a0f1c',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div className="flex align-center gap-sm">
                <span style={{ color: '#1780e3', fontSize: '18px', fontWeight: 'bold' }}>💳 Razorpay</span>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>SECURE GATEWAY</span>
              </div>
              <button 
                onClick={() => setShowRazorpay(false)} 
                className="btn btn-secondary" 
                style={{ padding: '3px 8px', fontSize: '12px' }}
                disabled={checkoutStatus === 'processing'}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {checkoutStatus === 'qr' && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Requested by AgriMarket</span>
                    <h3 style={{ fontSize: '26px', color: 'white', marginTop: '4px' }}>
                      ₹{activeBooking?.workTimer.totalCost || activeBooking?.rate}
                    </h3>
                  </div>

                  {/* Checkout Tabs selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', fontSize: '12px' }}>
                    <button 
                      onClick={() => setActiveTab('upi')}
                      style={{
                        padding: '6px',
                        background: activeTab === 'upi' ? '#1780e3' : 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📲 UPI QR Code
                    </button>
                    <button 
                      onClick={() => setActiveTab('card')}
                      style={{
                        padding: '6px',
                        background: activeTab === 'card' ? '#1780e3' : 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      💳 Card / NetBanking
                    </button>
                  </div>

                  {activeTab === 'upi' ? (
                    <div className="flex-col align-center gap-md" style={{ textAlign: 'center' }}>
                      
                      {/* Premium Mock QR Code */}
                      <div style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}>
                        <svg width="150" height="150" viewBox="0 0 100 100">
                          <rect x="0" y="0" width="25" height="25" fill="#0b1322" />
                          <rect x="3" y="3" width="19" height="19" fill="white" />
                          <rect x="7" y="7" width="11" height="11" fill="#0b1322" />

                          <rect x="75" y="0" width="25" height="25" fill="#0b1322" />
                          <rect x="78" y="3" width="19" height="19" fill="white" />
                          <rect x="82" y="7" width="11" height="11" fill="#0b1322" />

                          <rect x="0" y="75" width="25" height="25" fill="#0b1322" />
                          <rect x="3" y="73" width="19" height="19" fill="white" />
                          <rect x="7" y="77" width="11" height="11" fill="#0b1322" />

                          <rect x="38" y="38" width="24" height="24" rx="4" fill="#10b981" />
                          <text x="50" y="52" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">🌾</text>

                          <rect x="32" y="5" width="6" height="10" fill="#0b1322" />
                          <rect x="42" y="12" width="12" height="6" fill="#0b1322" />
                          <rect x="62" y="4" width="8" height="12" fill="#0b1322" />

                          <rect x="5" y="32" width="10" height="6" fill="#0b1322" />
                          <rect x="12" y="42" width="6" height="12" fill="#0b1322" />
                          <rect x="4" y="62" width="12" height="8" fill="#0b1322" />

                          <rect x="42" y="72" width="18" height="6" fill="#0b1322" />
                          <rect x="68" y="65" width="6" height="18" fill="#0b1322" />
                          
                          <rect x="72" y="35" width="12" height="8" fill="#0b1322" />
                          <rect x="35" y="60" width="8" height="10" fill="#0b1322" />
                        </svg>
                      </div>

                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        Scan using any preferred UPI Application:<br />
                        <strong>Google Pay • Paytm • PhonePe • BHIM</strong>
                      </p>

                      <button 
                        onClick={triggerSimulatePayment} 
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', background: '#1780e3', borderColor: '#1780e3', boxShadow: '0 0 15px rgba(23,128,227,0.3)' }}
                      >
                        ⚡ Simulate UPI App Scan & Pay
                      </button>
                    </div>
                  ) : (
                    <div className="flex-col gap-sm" style={{ fontSize: '13px' }}>
                      <div className="input-group">
                        <label className="input-label">Card Holder Name</label>
                        <input type="text" className="input-field" placeholder="e.g. Farmer Sree" defaultValue="K. Sree" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Card Number</label>
                        <input type="text" className="input-field" placeholder="4111 2222 3333 4444" defaultValue="4111 2222 3333 4444" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="input-group">
                          <label className="input-label">Expiry</label>
                          <input type="text" className="input-field" placeholder="MM/YY" defaultValue="12/29" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">CVV</label>
                          <input type="password" className="input-field" placeholder="123" defaultValue="***" />
                        </div>
                      </div>

                      <button 
                        onClick={triggerSimulatePayment} 
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', marginTop: '10px', background: '#1780e3' }}
                      >
                        💳 Pay with Simulated Card
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Payment Processing Loader State */}
              {checkoutStatus === 'processing' && (
                <div className="flex-col align-center gap-md" style={{ padding: '30px 0', textAlign: 'center' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(23, 128, 227, 0.1)',
                    borderTop: '4px solid #1780e3',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite linear'
                  }}></div>

                  <div>
                    <h4 style={{ fontSize: '16px', color: 'white' }}>Securing Banking Tunnel...</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Awaiting UPI client mobile authorization. Do not refresh.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Success state */}
              {checkoutStatus === 'success' && (
                <div className="flex-col align-center gap-md" style={{ padding: '30px 0', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '3px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'var(--primary-light)',
                    animation: 'pulse 1s ease-in-out'
                  }}>
                    ✔️
                  </div>

                  <div>
                    <h4 style={{ fontSize: '18px', color: 'var(--primary-light)' }}>Transaction Authorized!</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      UPI authorization succeeded. Wallet ledgers sync finalized.
                    </p>
                  </div>
                </div>
              )}

            </div>
            
            {/* Modal Footer */}
            <div style={{
              background: '#0a0f1c',
              padding: '12px',
              textAlign: 'center',
              fontSize: '10px',
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              🔒 PCI-DSS Compliant • 256-Bit SSL Secured Encryption
            </div>

          </div>
        </div>
      )}

      {/* Standard Marketplace Screen */}
      <div className="flex-col gap-md">
        
        {/* Marketplace Filter Strip */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div className="flex justify-between align-center flex-wrap gap-md">
            
            {/* Search Radius Slider */}
            <div className="flex-col flex-1" style={{ minWidth: '220px' }}>
              <div className="flex justify-between" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Search Radius</span>
                <span className="text-gradient" style={{ fontWeight: 800 }}>{radius} km</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="15" 
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-sm">
              {[
                { id: 'all', label: '🌾 All Services' },
                { id: 'tractor', label: '🚜 Tractors' },
                { id: 'machinery', label: '⚙️ Machines' },
                { id: 'labour', label: '👥 Labour Groups' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`btn ${filterType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Providers Listing Grid */}
        <div>
          <div className="flex justify-between align-center" style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              Available Services Nearby ({rankedProviders.length})
            </h2>
            <span className="badge badge-secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              🤖 ML Recommendation Engine Active
            </span>
          </div>
          
          <div className="grid-cols-3">
            {rankedProviders.map((prov, index) => {
              const isMapSelected = selectedProviderId === prov.id;
              const isMlBest = index === 0 && prov.mlScore >= 90; // High Match Highlight!
              
              return (
                <div 
                  key={prov.id} 
                  className="glass-card flex-col justify-between"
                  style={{ 
                    border: isMlBest 
                      ? '2px solid var(--warning)' 
                      : isMapSelected 
                        ? '2px solid var(--primary)' 
                        : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isMlBest 
                      ? '0 0 25px rgba(245, 158, 11, 0.15)' 
                      : isMapSelected 
                        ? 'var(--shadow-glow)' 
                        : 'none',
                    minHeight: '270px'
                  }}
                  onClick={() => onSelectProvider && onSelectProvider(prov.id)}
                >
                  <div className="flex-col gap-sm">
                    <div className="flex justify-between align-center">
                      <span className={`badge ${
                        prov.type === 'tractor' ? 'badge-primary' : 
                        prov.type === 'labour' ? 'badge-secondary' : 'badge-warning'
                      }`}>
                        {prov.type.toUpperCase()}
                      </span>
                      
                      {/* Glowing ML MATCH BADGE */}
                      <span className="badge" style={{
                        background: isMlBest ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: isMlBest ? 'var(--warning)' : 'var(--primary-light)',
                        border: '1px solid ' + (isMlBest ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.2)'),
                        fontSize: '10.5px',
                        fontWeight: 'bold'
                      }}>
                        🤖 {prov.mlScore}% MATCH
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', color: 'white', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {prov.name} {isMlBest && <span style={{ fontSize: '12px' }}>👑</span>}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      🚜 {prov.vehicleModel} • 🌾 {prov.service}
                    </p>

                    {/* ML Diagnostics parameters */}
                    <div className="flex-col gap-sm" style={{ 
                      background: 'rgba(0,0,0,0.18)', 
                      padding: '8px 10px', 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      marginTop: '6px',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Crop Compatibility:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{prov.mlDetails.compatibility}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Location Distance Factor:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{prov.mlDetails.distance}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Cost surges index:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{prov.mlDetails.cost}%</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div className="flex justify-between align-center" style={{ marginBottom: '10px' }}>
                      <div className="flex-col">
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hourly Rate</span>
                        <strong style={{ fontSize: '16px', color: 'white' }}>Rs. {prov.pricePerUnit}</strong>
                      </div>
                      <div className="flex-col" style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reliability Score</span>
                        <strong style={{ fontSize: '13px', color: 'var(--primary-light)' }}>{prov.performanceScore}%</strong>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProvider(prov);
                      }} 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        padding: '8px',
                        background: isMlBest ? 'linear-gradient(to right, var(--warning-dark), var(--warning))' : 'var(--primary)',
                        borderColor: isMlBest ? 'var(--warning-dark)' : 'var(--primary-dark)'
                      }}
                      disabled={!!activeBooking}
                    >
                      {activeBooking ? 'Lock Booking Active' : '⚡ Instant Book'}
                    </button>
                  </div>
                </div>
              );
            })}

            {rankedProviders.length === 0 && (
              <div style={{ 
                gridColumn: 'span 3', 
                textAlign: 'center', 
                padding: '40px', 
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.06)', 
                borderRadius: '12px',
                color: 'var(--text-muted)'
              }}>
                🔍 No active verified providers found matching the selected radius and filter. Try expanding the search radius slider!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
