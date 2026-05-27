import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';

export default function HelplinePortal() {
  const { providers, addBooking, triggerSms } = useAgri();
  
  // Phone State
  const [phoneState, setPhoneState] = useState('idle'); // 'idle', 'calling', 'ivr_root', 'ivr_tractors', 'ivr_labour', 'ivr_machinery', 'ivr_done'
  const [ivrTranscript, setIvrTranscript] = useState('');
  const [lastPressed, setLastPressed] = useState('');
  
  // Agent Form State
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Trigger Phone Call
  const startCall = () => {
    setPhoneState('calling');
    setIvrTranscript('Calling AgriMarket Voice Helpline...');
    
    setTimeout(() => {
      setPhoneState('ivr_root');
      setIvrTranscript('🔊 "Welcome to AgriMarket Helpline! For Tractor Ploughing, press 1. For Labour squads, press 2. For Agro Harvesting Machines, press 3."');
    }, 1500);
  };

  const endCall = () => {
    setPhoneState('idle');
    setIvrTranscript('');
    setLastPressed('');
  };

  // Dial Keypad logic
  const pressKey = (key) => {
    setLastPressed(key);
    
    if (phoneState === 'ivr_root') {
      if (key === '1') {
        setPhoneState('ivr_tractors');
        setIvrTranscript('🔊 "Tractor Services. For Deep Ploughing (Rs.1100/hr), press 1. For Rotavator Tilling (Rs.950/hr), press 2. Press * to return."');
      } else if (key === '2') {
        setPhoneState('ivr_labour');
        setIvrTranscript('🔊 "Labour Squads. For Paddy Transplanting (Rs.450/hr), press 1. For Manual Weeding (Rs.350/hr), press 2. Press * to return."');
      } else if (key === '3') {
        setPhoneState('ivr_machinery');
        setIvrTranscript('🔊 "Combine Harvester. Press 1 to book Kubota Harvester (Rs.1600/hr). Press * to return."');
      } else {
        setIvrTranscript('🔊 "Invalid option. Please press 1, 2, or 3."');
      }
    } 
    
    else if (phoneState === 'ivr_tractors') {
      if (key === '*') {
        setPhoneState('ivr_root');
        setIvrTranscript('🔊 "For Tractor Ploughing, press 1. For Labour squads, press 2. For Agro Harvesting Machines, press 3."');
      } else if (key === '1') {
        // Book Baldev Singh
        const prov = providers.find(p => p.id === 'prov-1');
        confirmIvrBooking(prov);
      } else if (key === '2') {
        // Book Ramesh Yadav
        const prov = providers.find(p => p.id === 'prov-4');
        confirmIvrBooking(prov);
      }
    } 
    
    else if (phoneState === 'ivr_labour') {
      if (key === '*') {
        setPhoneState('ivr_root');
        setIvrTranscript('🔊 "For Tractor Ploughing, press 1. For Labour squads, press 2. For Agro Harvesting Machines, press 3."');
      } else if (key === '1') {
        const prov = providers.find(p => p.id === 'prov-2');
        confirmIvrBooking(prov);
      } else if (key === '2') {
        const prov = providers.find(p => p.id === 'prov-5');
        confirmIvrBooking(prov);
      }
    }

    else if (phoneState === 'ivr_machinery') {
      if (key === '*') {
        setPhoneState('ivr_root');
        setIvrTranscript('🔊 "For Tractor Ploughing, press 1. For Labour squads, press 2. For Agro Harvesting Machines, press 3."');
      } else if (key === '1') {
        const prov = providers.find(p => p.id === 'prov-3');
        confirmIvrBooking(prov);
      }
    }
  };

  const confirmIvrBooking = (provider) => {
    setPhoneState('ivr_done');
    setIvrTranscript(`🔊 "Success! Booking request created for ${provider.name}. A confirmation SMS with details and OTP has been sent. Thank you for calling!"`);
    
    // Dispatch system booking
    addBooking({
      farmerName: 'Call-in Farmer (IVR Phone)',
      farmerPhone: '9000012345',
      providerId: provider.id,
      bookingMethod: 'IVR Call'
    });
    
    // Automatically hang up after 4 seconds
    setTimeout(() => {
      endCall();
    }, 4500);
  };

  // Agent Form Submission
  const handleAgentBooking = (e) => {
    e.preventDefault();
    if (!farmerName || !farmerPhone || !selectedProviderId) return;

    const provider = providers.find(p => p.id === selectedProviderId);
    
    addBooking({
      farmerName,
      farmerPhone,
      providerId: selectedProviderId,
      rate: provider.pricePerUnit,
      bookingMethod: 'Helpline Agent'
    });

    setBookingSuccess(true);
    setFarmerName('');
    setFarmerPhone('');
    setSelectedProviderId('');
    
    setTimeout(() => {
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <div className="grid-cols-2" style={{ gap: '24px' }}>
      
      {/* 1. IVR Phone Screen */}
      <div className="glass-panel flex flex-col gap-md" style={{ padding: '24px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="badge badge-secondary">Digital Inclusion Simulator</span>
          <h2 style={{ fontSize: '18px', marginTop: '6px' }}>Interactive IVR Phone</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Simulates a basic voice phone. Farmers dial to book machines without using apps.
          </p>
        </div>

        {/* Mock Phone Layout */}
        <div className="mock-phone">
          <div className="mock-phone-speaker"></div>
          
          <div className="mock-phone-screen">
            
            {/* Phone Screen Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '10px' }}>
              <span>AgriSim VoLTE</span>
              <span>10:50 AM</span>
            </div>

            {/* Screen State */}
            {phoneState === 'idle' ? (
              <div className="flex-col align-center justify-between" style={{ flex: 1, padding: '20px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', margin: '20px 0' }}>📞</div>
                  <h3 style={{ fontSize: '15px' }}>Helpline Available</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Toll Free: 1800-419-5555</p>
                </div>
                
                <button onClick={startCall} className="btn btn-primary" style={{ width: '80%', padding: '12px', borderRadius: '30px' }}>
                  🟢 Dial Helpline
                </button>
              </div>
            ) : (
              <div className="flex-col" style={{ flex: 1 }}>
                {/* Active Phone Call State */}
                <div className="flex align-center gap-sm" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>
                  <span className="pulse-dot" style={{ background: '#10b981' }}></span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-light)' }}>ACTIVE VOICE CALL</span>
                </div>

                <div style={{ 
                  margin: '15px 0', 
                  padding: '12px', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  minHeight: '100px',
                  color: 'white'
                }}>
                  {ivrTranscript}
                </div>

                {phoneState !== 'calling' && phoneState !== 'ivr_done' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifySelf: 'flex-end' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Press Keypad below to navigate:
                    </div>
                    
                    <div className="phone-keypad">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                        <button 
                          key={key} 
                          onClick={() => pressKey(key)}
                          className="phone-key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={endCall} className="phone-call-btn hangup">
                  🛑
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Helpline Operator Panel */}
      <div className="glass-panel flex flex-col gap-md" style={{ padding: '24px' }}>
        <div>
          <span className="badge badge-primary">Helpline Agent Terminal</span>
          <h2 style={{ fontSize: '18px', marginTop: '6px' }}>Operator Booking Desk</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Agents booking services on behalf of farmers who give missed calls or register requests over plain voice line.
          </p>
        </div>

        {bookingSuccess && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.15)', 
            border: '1px solid var(--primary)', 
            color: 'var(--primary-light)', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '13px' 
          }}>
            ✔️ Booking logged successfully! The customer has received their confirmation and OTP via SMS broadcast.
          </div>
        )}

        <form onSubmit={handleAgentBooking} className="flex-col gap-md">
          <div className="input-group">
            <label className="input-label">Caller (Farmer) Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Vikas Gowda" 
              value={farmerName}
              onChange={e => setFarmerName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Caller Mobile Phone Number</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="e.g. 9845012345" 
              value={farmerPhone}
              onChange={e => setFarmerPhone(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Assign Service Provider (Nearest Online & Verified)</label>
            <select 
              className="input-field" 
              style={{ background: '#0f172a' }}
              value={selectedProviderId}
              onChange={e => setSelectedProviderId(e.target.value)}
              required
            >
              <option value="">-- Choose verified machine/labor --</option>
              {providers
                .filter(p => p.verified && p.status === 'online')
                .map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name} - {prov.service} (Rs. {prov.pricePerUnit}/hr) [Score: {prov.performanceScore}%]
                  </option>
                ))
              }
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary flex-1">
              📞 Dispatch Voice Booking
            </button>
            <button 
              type="button" 
              onClick={() => {
                setFarmerName('Rajesh Patil');
                setFarmerPhone('9741002233');
                setSelectedProviderId(providers[0]?.id || '');
              }} 
              className="btn btn-secondary"
            >
              Mock Auto-Fill
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: 'auto', 
          padding: '12px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px', 
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          💡 **Call-based innovation benefits**: Non-smartphone users are fully protected against price surges. Operators guarantee their slot within platform limits, locked via phone OTP authentication.
        </div>
      </div>

    </div>
  );
}
