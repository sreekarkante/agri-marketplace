import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';

export default function ProviderPortal() {
  const { providers, bookings, acceptBooking, rejectBooking, startWork, finishWork, cancelBooking } = useAgri();
  
  const [selectedProviderId, setSelectedProviderId] = useState('prov-1'); // Default to Baldev Singh
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  // Active provider context
  const currentProvider = providers.find(p => p.id === selectedProviderId);

  // Filter bookings for this provider
  const providerBookings = bookings.filter(bk => bk.providerId === selectedProviderId);
  const pendingBooking = providerBookings.find(bk => bk.status === 'pending');
  const lockedBooking = providerBookings.find(bk => bk.status === 'accepted' || bk.status === 'in_progress');

  // Handle starting work session
  const handleStartTimer = (e) => {
    e.preventDefault();
    if (!lockedBooking || !otpInput) return;

    const success = startWork(lockedBooking.id, otpInput);
    if (success) {
      setOtpInput('');
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  // Mock Earnings Data for Graph
  const WEEKLY_EARNINGS = [
    { day: 'Mon', amount: 2200 },
    { day: 'Tue', amount: 3100 },
    { day: 'Wed', amount: 1500 },
    { day: 'Thu', amount: 4800 },
    { day: 'Fri', amount: 2900 },
    { day: 'Sat', amount: 5600 },
    { day: 'Sun', amount: 4100 }
  ];

  const totalWeekly = WEEKLY_EARNINGS.reduce((sum, item) => sum + item.amount, 0);

  // Dynamic ML ranking mock data based on rating & score
  const getMlVisibilityRank = (p) => {
    if (p.performanceScore >= 96) return { rank: 'Top 3%', visibility: '2.4x visibility boost', status: 'optimal' };
    if (p.performanceScore >= 90) return { rank: 'Top 12%', visibility: '1.5x visibility boost', status: 'healthy' };
    return { rank: 'Bottom 40%', visibility: '0.8x visibility penalty', status: 'warning' };
  };

  const mlVis = getMlVisibilityRank(currentProvider);

  return (
    <div className="flex-col gap-lg">
      
      {/* Provider Selector for simulation convenience */}
      <div className="glass-panel flex justify-between align-center" style={{ padding: '16px 20px' }}>
        <div>
          <span className="badge badge-secondary">Simulation Switchboard</span>
          <span style={{ fontSize: '13px', marginLeft: '10px', color: 'var(--text-muted)' }}>
            Switch between registered operators to test booking states and ML visibility visages:
          </span>
        </div>
        <select 
          className="input-field" 
          style={{ width: '260px', background: '#0f172a' }}
          value={selectedProviderId}
          onChange={e => {
            setSelectedProviderId(e.target.value);
            setOtpInput('');
            setOtpError(false);
          }}
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.service})
            </option>
          ))}
        </select>
      </div>

      {/* Main Grid: left = earnings/stats, right = operations/bookings */}
      <div className="grid-cols-2" style={{ gap: '24px' }}>
        
        {/* LEFT COLUMN: Profile & Analytics */}
        <div className="flex-col gap-md">
          
          {/* Operator Profile Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex justify-between align-center">
              <div>
                <span className="badge badge-primary">
                  {currentProvider.verified ? '✔️ VERIFIED PROVIDER' : '⏳ AWAITING VERIFICATION'}
                </span>
                <h2 style={{ fontSize: '20px', marginTop: '6px', color: 'white' }}>{currentProvider.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  🔧 {currentProvider.vehicleModel} • 📞 +91 {currentProvider.phone}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Listing Price</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-light)' }}>
                  Rs. {currentProvider.pricePerUnit}/hr
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

            {/* Performance Indicators */}
            <div className="grid-cols-3" style={{ gap: '12px' }}>
              <div className="stat-pill">
                <span className="stat-label">Performance Score</span>
                <span className="stat-value" style={{ 
                  color: currentProvider.performanceScore >= 90 ? 'var(--primary-light)' : 'var(--warning)'
                }}>
                  {currentProvider.performanceScore}%
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">User Rating</span>
                <span className="stat-value" style={{ color: 'var(--warning)' }}>
                  ⭐ {currentProvider.rating.toFixed(1)}
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Cancellations</span>
                <span className="stat-value" style={{ 
                  color: currentProvider.cancellationsCount > 1 ? 'var(--danger)' : 'white'
                }}>
                  {currentProvider.cancellationsCount}
                </span>
              </div>
            </div>

            {!currentProvider.verified && (
              <div style={{ 
                marginTop: '16px', 
                background: 'rgba(245, 158, 11, 0.12)', 
                border: '1px solid rgba(245, 158, 11, 0.2)', 
                padding: '10px', 
                borderRadius: '8px', 
                fontSize: '12px',
                color: 'var(--warning)'
              }}>
                ⚠️ **Pending Verification**: Your documents are being verified by Admin operators. You can book simulated jobs, but you won't show up in public farmer app searches until approved.
              </div>
            )}
          </div>

          {/* Machine Learning Search Visibility Index Box */}
          <div className="glass-panel" style={{ padding: '24px', background: 'rgba(6, 182, 212, 0.05)' }}>
            <div>
              <span className="badge badge-secondary" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                🤖 ML Engine Search Insights
              </span>
              <h3 style={{ fontSize: '16px', marginTop: '6px', color: 'white' }}>Matching Search Visibility</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Platform rankings dispatched dynamically per search query based on algorithmic scoring weight normalizers.
              </p>
            </div>

            <div className="grid-cols-2" style={{ gap: '10px', margin: '14px 0' }}>
              <div className="stat-pill" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="stat-label">Village Match Rank</span>
                <span className="stat-value" style={{ 
                  color: mlVis.status === 'optimal' ? 'var(--primary-light)' : mlVis.status === 'healthy' ? 'var(--secondary)' : 'var(--danger)'
                }}>
                  {mlVis.rank}
                </span>
              </div>
              <div className="stat-pill" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="stat-label">Visibility Index</span>
                <span className="stat-value" style={{ color: 'white' }}>
                  {mlVis.visibility}
                </span>
              </div>
            </div>

            <div style={{ 
              fontSize: '11px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              color: 'var(--text-muted)',
              lineHeight: '1.45'
            }}>
              💡 **Ranking Boost Tip**: Avoid post-acceptance cancellation flags (currently **{currentProvider.cancellationsCount}** recorded) and ensure 100% boundary coordinates compliance during timer active phases. High coordinates breach frequency reduces your matching ranking algorithm priority.
            </div>
          </div>

          {/* Earnings Analytics Visual Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px' }}>Weekly Earnings Log</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revenue aggregated over the last 7 calendar days</p>
              </div>
              <div style={{ textTransform: 'uppercase', textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Earnings</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>Rs. {totalWeekly}</div>
              </div>
            </div>

            {/* Custom SVG Bar Graph */}
            <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {WEEKLY_EARNINGS.map((item, index) => {
                const maxAmount = Math.max(...WEEKLY_EARNINGS.map(w => w.amount));
                const barHeightPercent = (item.amount / maxAmount) * 100;
                
                return (
                  <div key={index} className="flex-col align-center" style={{ flex: 1, gap: '8px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--primary-light)', fontWeight: 'bold' }}>
                      ₹{item.amount}
                    </span>
                    <div style={{ 
                      width: '24px', 
                      height: `${Math.max(10, barHeightPercent * 0.8)}px`, 
                      background: 'linear-gradient(to top, var(--primary-dark), var(--primary))',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: 'var(--shadow-glow)',
                      transition: 'height 0.5s ease'
                    }}></div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.day}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Platform Comm. (10%): Rs. {Math.round(totalWeekly * 0.1)}</span>
              <span>Net Payout Dispatched: Rs. {Math.round(totalWeekly * 0.9)}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active Bookings & Live Operations */}
        <div className="flex-col gap-md">
          
          {/* Active Job GPS Timer Portal */}
          {lockedBooking && (
            <div className="glass-panel" style={{ 
              padding: '24px', 
              border: lockedBooking.status === 'in_progress' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: lockedBooking.status === 'in_progress' ? 'var(--shadow-glow)' : 'none'
            }}>
              <span className="badge badge-warning">
                {lockedBooking.status === 'accepted' ? '🔒 LOCKED BOOKING' : '⚡ LIVE GPS TIMER RUNNING'}
              </span>

              <h2 style={{ fontSize: '18px', marginTop: '10px', color: 'white' }}>
                Job for {lockedBooking.farmerName}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Service Area: 📍 Village coordinates grid • Service: {lockedBooking.serviceName}
              </p>

              {/* Step 1: Verification required (OTP input) */}
              {lockedBooking.status === 'accepted' && (
                <form onSubmit={handleStartTimer} className="flex-col gap-md" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', color: 'white' }}>GPS Work Verification</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ask farmer for their OTP once you reach their field coordinate to verify and unlock work timer.</p>
                  </div>

                  {otpError && (
                    <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold' }}>
                      ❌ Incorrect OTP. Please verify matching digits from the farmer's screen.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="Enter 4-Digit OTP"
                      style={{ fontSize: '16px', letterSpacing: '4px', textAlign: 'center' }}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                      required 
                    />
                    <button type="submit" className="btn btn-primary">
                      Verify & Start Work
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Timer active */}
              {lockedBooking.status === 'in_progress' && (
                <div className="flex-col gap-md" style={{ alignItems: 'center', textAlign: 'center' }}>
                  
                  {/* Clock Ring */}
                  <div className="timer-ring-container" style={{
                    border: '4px solid ' + (lockedBooking.gpsStatus === 'breached' ? 'var(--danger)' : 'var(--primary)'),
                    borderRadius: '50%',
                    boxShadow: lockedBooking.gpsStatus === 'breached' ? '0 0 15px rgba(239,68,68,0.2)' : 'var(--shadow-glow)'
                  }}>
                    <span className="timer-value">
                      {Math.floor(lockedBooking.workTimer.secondsElapsed / 60)}m {lockedBooking.workTimer.secondsElapsed % 60}s
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                      ELAPSED
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '18px', color: 'white' }}>Current Accrued: Rs. {lockedBooking.workTimer.totalCost}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Per Hour Rate: Rs. {lockedBooking.rate} • Billing Mode: GPS Coordinate Locked
                    </p>
                  </div>

                  {lockedBooking.gpsStatus === 'breached' && (
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      border: '1px solid var(--danger)', 
                      color: '#f87171',
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      fontSize: '11.5px',
                      textAlign: 'left'
                    }}>
                      ⚠️ **TIMER AUTO-PAUSED**: You have exited the farmer's verified perimeter. Return to the field grid boundaries (shown in the live map context) to resume work billing.
                    </div>
                  )}

                  <div className="flex gap-sm" style={{ width: '100%', marginTop: '10px' }}>
                    <button 
                      onClick={() => finishWork(lockedBooking.id)} 
                      className="btn btn-primary flex-1"
                      disabled={lockedBooking.gpsStatus === 'breached'} // Cannot finish if breached!
                    >
                      🚜 Job Completed - Send Invoice
                    </button>
                  </div>
                </div>
              )}

              {/* Cancellation policy caution */}
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignCenter: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  🔒 locked booking guarantee policy applies
                </span>
                
                {lockedBooking.status === 'accepted' && (
                  <button 
                    onClick={() => {
                      const reason = prompt("Locked cancellation warning: Dedicts 8% score points. Enter cancellation reason:");
                      if (reason) cancelBooking(lockedBooking.id, 'provider', reason);
                    }} 
                    className="btn btn-danger" 
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                  >
                    Emergency Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pending Job Requests Queue */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>
              Pending Bookings Inbox ({pendingBooking ? '1' : '0'})
            </h3>

            {pendingBooking ? (
              <div className="glass-card flex-col gap-md" style={{ borderLeft: '3px solid var(--warning)' }}>
                <div className="flex justify-between align-center">
                  <div>
                    <span className="badge badge-warning">NEW REQUEST</span>
                    <h4 style={{ fontSize: '15px', color: 'white', marginTop: '6px' }}>{pendingBooking.farmerName}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Requested: {pendingBooking.serviceName}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Slot Date</span>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{pendingBooking.date}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pendingBooking.timeSlot.split(" ")[0]}..</div>
                  </div>
                </div>

                <div className="flex gap-sm">
                  <button 
                    onClick={() => acceptBooking(pendingBooking.id)} 
                    className="btn btn-primary flex-1"
                    disabled={!!lockedBooking}
                  >
                    Accept Request
                  </button>
                  <button 
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) rejectBooking(pendingBooking.id);
                    }} 
                    className="btn btn-secondary"
                  >
                    Decline
                  </button>
                </div>
                
                {lockedBooking && (
                  <p style={{ fontSize: '10.5px', color: 'var(--danger)' }}>
                    ⚠️ You are already committed to an active job session. Complete or cancel it first before accepting new orders.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px', 
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.06)', 
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                📭 No active pending booking requests. You are in optimal standby mode.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
