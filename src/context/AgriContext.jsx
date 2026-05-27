import React, { createContext, useState, useEffect, useContext } from 'react';

const AgriContext = createContext();

// Seed initial providers
const INITIAL_PROVIDERS = [
  {
    id: 'prov-1',
    name: 'Baldev Singh (Tractor owner)',
    phone: '9876543210',
    type: 'tractor',
    service: 'Deep Ploughing',
    pricePerUnit: 1100, // hourly
    rating: 4.8,
    speedRate: 1.2, // hours per acre
    x: 120, // coordinate on village map
    y: 150,
    status: 'online',
    verified: true,
    performanceScore: 96,
    cancellationsCount: 0,
    vehicleModel: 'John Deere 5050D'
  },
  {
    id: 'prov-2',
    name: 'Hari Ram & Labour Group',
    phone: '9822334455',
    type: 'labour',
    service: 'Paddy Planting',
    pricePerUnit: 450, // hourly per group
    rating: 4.6,
    speedRate: 2.5,
    x: 420,
    y: 280,
    status: 'online',
    verified: true,
    performanceScore: 92,
    cancellationsCount: 1,
    vehicleModel: '12 Person Squad'
  },
  {
    id: 'prov-3',
    name: 'Satnam Agro Machinery',
    phone: '9766554433',
    type: 'machinery',
    service: 'Harvester Machine',
    pricePerUnit: 1600,
    rating: 4.9,
    speedRate: 0.8,
    x: 250,
    y: 90,
    status: 'online',
    verified: true,
    performanceScore: 98,
    cancellationsCount: 0,
    vehicleModel: 'Kubota Harvester DC-68G'
  },
  {
    id: 'prov-4',
    name: 'Ramesh Yadav (Rotavator)',
    phone: '9988776655',
    type: 'tractor',
    service: 'Rotavator Tilling',
    pricePerUnit: 950,
    rating: 4.2,
    speedRate: 1.5,
    x: 610,
    y: 180,
    status: 'online',
    verified: false, // Needs admin approval!
    performanceScore: 84,
    cancellationsCount: 3, // Suspicious cancellations
    vehicleModel: 'Mahindra Arjun 555'
  },
  {
    id: 'prov-5',
    name: 'Chandan Kumar Squad',
    phone: '9511223344',
    type: 'labour',
    service: 'Manual Weeding',
    pricePerUnit: 350,
    rating: 4.5,
    speedRate: 3.0,
    x: 180,
    y: 320,
    status: 'offline',
    verified: true,
    performanceScore: 90,
    cancellationsCount: 0,
    vehicleModel: '8 Person Squad'
  }
];

const INITIAL_PRICING_LIMITS = {
  tractor: { min: 800, max: 1500, currentMax: 1300, name: 'Tractor Ploughing / Tilling' },
  machinery: { min: 1000, max: 2200, currentMax: 1800, name: 'Combine Harvesting' },
  labour: { min: 300, max: 600, currentMax: 500, name: 'Labour Groups (Seed/Weed)' }
};

export const AgriProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('farmer'); // 'farmer', 'provider', 'admin', 'helpline'
  const [providers, setProviders] = useState(() => {
    const saved = localStorage.getItem('agri_providers');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
  });
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('agri_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [pricingLimits, setPricingLimits] = useState(() => {
    const saved = localStorage.getItem('agri_pricing');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_LIMITS;
  });
  const [smsLogs, setSmsLogs] = useState(() => {
    const saved = localStorage.getItem('agri_sms');
    return saved ? JSON.parse(saved) : [
      {
        id: 'init-1',
        to: 'Farmer K. Sree',
        message: 'Welcome to AgriMarket! Dial 1800-419-5555 to book services directly via voice call.',
        time: '10:50 AM',
        type: 'sms'
      }
    ];
  });
  
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [weather, setWeather] = useState('sunny'); // 'sunny', 'rainy', 'harvest'
  const [customFieldPolygon, setCustomFieldPolygon] = useState([]);
  const [mlWeights, setMlWeights] = useState({
    distance: 30,
    rating: 25,
    compatibility: 25,
    cost: 20
  });

  const updateMlWeights = (key, val) => {
    setMlWeights(prev => {
      const updated = { ...prev, [key]: Number(val) };
      
      // Auto-normalize other weights so the sum always equals 100%!
      const totalOther = Object.keys(updated)
        .filter(k => k !== key)
        .reduce((sum, k) => sum + updated[k], 0);

      const scale = (100 - Number(val)) / (totalOther || 1);
      
      const normalized = { [key]: Number(val) };
      Object.keys(prev).forEach(k => {
        if (k !== key) {
          normalized[k] = Math.max(0, Math.round(prev[k] * scale));
        }
      });

      return normalized;
    });
  };

  const setWeatherState = (newWeather) => {
    setWeather(newWeather);
    if (newWeather === 'rainy') {
      triggerSms('System Broadcast', '⛈️ monsoon rain surge alert! Manual weeding & seed sowing demand increased by 150%. Platform ceiling caps adjusted up 30%.');
      
      // Auto adjust caps
      setPricingLimits(prev => ({
        tractor: { ...prev.tractor, currentMax: Math.round(INITIAL_PRICING_LIMITS.tractor.currentMax * 1.3) },
        machinery: { ...prev.machinery, currentMax: Math.round(INITIAL_PRICING_LIMITS.machinery.currentMax * 1.3) },
        labour: { ...prev.labour, currentMax: Math.round(INITIAL_PRICING_LIMITS.labour.currentMax * 1.3) }
      }));
    } else if (newWeather === 'harvest') {
      triggerSms('System Broadcast', '🌾 peak harvesting demand active! Combine harvester machinery demand skyrocketed. Ceiling limits boosted by 40%.');
      
      setPricingLimits(prev => ({
        tractor: { ...prev.tractor, currentMax: INITIAL_PRICING_LIMITS.tractor.currentMax },
        machinery: { ...prev.machinery, currentMax: Math.round(INITIAL_PRICING_LIMITS.machinery.currentMax * 1.4) },
        labour: { ...prev.labour, currentMax: INITIAL_PRICING_LIMITS.labour.currentMax }
      }));
    } else {
      triggerSms('System Broadcast', '☀️ weather normalized to Dry Sunny. Seasonal price bounds returned to standard Kharif baseline ceilings.');
      setPricingLimits(INITIAL_PRICING_LIMITS);
    }
  };

  // Persist State
  useEffect(() => {
    localStorage.setItem('agri_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem('agri_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('agri_pricing', JSON.stringify(pricingLimits));
  }, [pricingLimits]);

  useEffect(() => {
    localStorage.setItem('agri_sms', JSON.stringify(smsLogs));
  }, [smsLogs]);

  // Helper: Get human time
  const getFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper: Trigger SMS Log
  const triggerSms = (toName, text) => {
    const newLog = {
      id: 'sms-' + Math.random().toString(36).substr(2, 9),
      to: toName,
      message: text,
      time: getFormattedTime(),
      type: 'sms'
    };
    setSmsLogs(prev => [newLog, ...prev]);
  };

  // Booking Actions
  const addBooking = (bookingData) => {
    const bookingId = 'bk-' + Math.random().toString(36).substr(2, 9);
    const otp = Math.floor(1000 + Math.random() * 9000);
    const provider = providers.find(p => p.id === bookingData.providerId);
    
    const newBooking = {
      id: bookingId,
      farmerName: bookingData.farmerName || 'Farmer K. Sree',
      farmerPhone: bookingData.farmerPhone || '9898989898',
      serviceName: bookingData.serviceName || provider.service,
      providerId: bookingData.providerId,
      providerName: provider.name,
      rate: bookingData.rate || provider.pricePerUnit,
      status: 'pending',
      date: bookingData.date || new Date().toISOString().split('T')[0],
      timeSlot: bookingData.timeSlot || '09:00 AM - 12:00 PM',
      otpCode: otp,
      gpsBoundaryBreaches: 0,
      gpsStatus: 'idle', // 'idle', 'in_field', 'breached'
      workTimer: {
        secondsElapsed: 0,
        isActive: false,
        totalCost: 0
      },
      paymentStatus: 'unpaid',
      cancelledBy: null,
      cancelReason: null,
      bookingMethod: bookingData.bookingMethod || 'app' // 'app', 'helpline'
    };

    setBookings(prev => [newBooking, ...prev]);
    
    // Notification to provider
    triggerSms(provider.name, `New Booking Request! Farmer ${newBooking.farmerName} wants to book you for ${newBooking.serviceName} on ${newBooking.date}. Respond in your app.`);
    
    // Notification to farmer
    triggerSms(newBooking.farmerName, `AgriMarket: Booking request sent to ${provider.name}. OTP for session validation is ${otp}. Price: Rs. ${newBooking.rate}/hr.`);
    
    return newBooking;
  };

  const acceptBooking = (bookingId) => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        // Mark as accepted and lock
        triggerSms(bk.farmerName, `AgriMarket: Great news! ${bk.providerName} has ACCEPTED your booking for ${bk.serviceName}. Your booking is now guaranteed and locked under platform policy.`);
        triggerSms(bk.providerName, `Booking locked! Cancel policies apply. Provide OTP ${bk.otpCode} when you reach the farmer's field to initiate tracking.`);
        return { ...bk, status: 'accepted' };
      }
      return bk;
    }));
  };

  const rejectBooking = (bookingId) => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        triggerSms(bk.farmerName, `AgriMarket Alert: We apologize, ${bk.providerName} declined the booking due to scheduling conflicts. Our algorithm is auto-suggesting nearby replacements...`);
        return { ...bk, status: 'rejected' };
      }
      return bk;
    }));
    
    // Auto trigger replacement search simulation!
    setTimeout(() => {
      findReplacement(bookingId);
    }, 2500);
  };

  // Platform innovation: Automatic replacement lookup!
  const findReplacement = (originalBookingId) => {
    setBookings(prevBookings => {
      const original = prevBookings.find(b => b.id === originalBookingId);
      if (!original) return prevBookings;

      // Find another online provider of the same type/service
      const currentProvider = providers.find(p => p.id === original.providerId);
      const replacement = providers.find(p => 
        p.id !== original.providerId && 
        p.type === currentProvider.type && 
        p.status === 'online' && 
        p.verified
      );

      if (replacement) {
        const newOtp = Math.floor(1000 + Math.random() * 9000);
        triggerSms(original.farmerName, `AgriMarket Success: We found an automated replacement! ${replacement.name} has been assigned to your booking. Rate: Rs. ${replacement.pricePerUnit}/hr. Verification OTP: ${newOtp}`);
        triggerSms(replacement.name, `AgriMarket Dispatch: Emergency replacement request! You have been booked for Farmer ${original.farmerName} on ${original.date}.`);
        
        return prevBookings.map(bk => {
          if (bk.id === originalBookingId) {
            return {
              ...bk,
              providerId: replacement.id,
              providerName: replacement.name,
              rate: replacement.pricePerUnit,
              otpCode: newOtp,
              status: 'accepted',
              replacementAlert: true
            };
          }
          return bk;
        });
      } else {
        triggerSms(original.farmerName, `AgriMarket System Alert: No direct providers are available within 10km radius. An agent is reviewing your request now.`);
        return prevBookings;
      }
    });
  };

  // GPS Work Verification Timers
  const startWork = (bookingId, userEnteredOtp) => {
    let success = false;
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        if (Number(userEnteredOtp) === bk.otpCode) {
          success = true;
          triggerSms(bk.farmerName, `AgriMarket: Work session started at your field by ${bk.providerName}. The GPS timer is active. Real-time work billing has begun!`);
          triggerSms(bk.providerName, `Timer started. Ensure you stay within the marked field coordinate map. Leaving the field area will auto-pause the billing.`);
          
          return {
            ...bk,
            status: 'in_progress',
            gpsStatus: 'in_field',
            workTimer: {
              ...bk.workTimer,
              isActive: true
            }
          };
        } else {
          triggerSms(bk.providerName, `ALERT: OTP mismatch! Cannot start GPS work timer. Verify OTP code with farmer.`);
        }
      }
      return bk;
    }));
    return success;
  };

  const simulateGpsBreach = (bookingId, action) => {
    // action: 'exit' or 'return'
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        if (action === 'exit') {
          triggerSms(bk.farmerName, `ALERT: ${bk.providerName} has stepped outside the verified work area. The GPS timer has paused. You are NOT being billed during this time.`);
          triggerSms(bk.providerName, `ALERT: Boundary breach detected! You are outside the field perimeter. GPS work timer is PAUSED. Return to the field boundary to resume.`);
          
          return {
            ...bk,
            gpsStatus: 'breached',
            gpsBoundaryBreaches: bk.gpsBoundaryBreaches + 1,
            workTimer: {
              ...bk.workTimer,
              isActive: false
            }
          };
        } else {
          triggerSms(bk.farmerName, `AgriMarket Update: ${bk.providerName} has returned to the work area. GPS timer is now resumed.`);
          triggerSms(bk.providerName, `GPS Status normalized. You are back in the field boundary. Work timer is RESUMED.`);
          
          return {
            ...bk,
            gpsStatus: 'in_field',
            workTimer: {
              ...bk.workTimer,
              isActive: true
            }
          };
        }
      }
      return bk;
    }));
  };

  const finishWork = (bookingId) => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        const finalCost = bk.workTimer.totalCost > 0 
          ? bk.workTimer.totalCost 
          : Math.max(50, Math.round((bk.workTimer.secondsElapsed / 3600) * bk.rate));
          
        triggerSms(bk.farmerName, `AgriMarket Invoice: Work completed! Total duration: ${Math.ceil(bk.workTimer.secondsElapsed / 60)} minutes. Total due: Rs. ${finalCost}. Proceed to secure checkout.`);
        triggerSms(bk.providerName, `Work session completed. Invoice generated: Rs. ${finalCost}. Awaiting farmer payment.`);
        
        return {
          ...bk,
          status: 'completed',
          gpsStatus: 'idle',
          workTimer: {
            ...bk.workTimer,
            isActive: false,
            totalCost: finalCost
          }
        };
      }
      return bk;
    }));
  };

  // Booking guarantees and cancellations
  const cancelBooking = (bookingId, initiator, reason) => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        // If provider cancels a LOCKED (accepted) booking, apply penalties!
        if (initiator === 'provider' && bk.status === 'accepted') {
          setProviders(oldProv => oldProv.map(p => {
            if (p.id === bk.providerId) {
              const newCancellations = p.cancellationsCount + 1;
              const newPerformance = Math.max(50, p.performanceScore - 8); // Deduct performance!
              
              triggerSms(p.name, `PENALTY APPLIED: You cancelled a locked booking. Penalty points deducted. Performance score dropped to ${newPerformance}%. Continued cancellations will lead to suspension.`);
              return { 
                ...p, 
                cancellationsCount: newCancellations,
                performanceScore: newPerformance
              };
            }
            return p;
          }));
        }

        triggerSms(bk.farmerName, `AgriMarket: Booking ${bk.id} has been cancelled by ${initiator}. Reason: "${reason}".`);
        if (initiator === 'farmer') {
          triggerSms(bk.providerName, `Booking Cancelled: Farmer cancelled booking ${bk.id}. Reason: "${reason}".`);
        }

        return {
          ...bk,
          status: 'cancelled',
          cancelledBy: initiator,
          cancelReason: reason,
          gpsStatus: 'idle',
          workTimer: {
            ...bk.workTimer,
            isActive: false
          }
        };
      }
      return bk;
    }));

    // Trigger auto replacement if provider cancelled!
    if (initiator === 'provider') {
      setTimeout(() => {
        findReplacement(bookingId);
      }, 2500);
    }
  };

  // Provider Registration & Admin Verifications
  const registerProvider = (newProv) => {
    const id = 'prov-' + Math.random().toString(36).substr(2, 9);
    const item = {
      ...newProv,
      id,
      rating: 5.0,
      x: Math.floor(100 + Math.random() * 500),
      y: Math.floor(80 + Math.random() * 300),
      status: 'online',
      verified: false, // Needs admin approval!
      performanceScore: 100,
      cancellationsCount: 0
    };
    
    setProviders(prev => [...prev, item]);
    triggerSms(item.name, `Welcome to AgriMarket! Your registration is complete. Our administrators are reviewing your documents. You will receive an SMS once verified.`);
    return item;
  };

  const verifyProvider = (id, status) => {
    setProviders(prev => prev.map(p => {
      if (p.id === id) {
        if (status) {
          triggerSms(p.name, `AgriMarket Congratulations! Your profile has been VERIFIED. You can now accept booking requests and start earning.`);
        } else {
          triggerSms(p.name, `AgriMarket Alert: Your application has been declined. Please re-upload clear government ID and tractor records.`);
        }
        return { ...p, verified: status };
      }
      return p;
    }));
  };

  // Price Control Limit
  const updatePriceLimits = (category, currentMax) => {
    setPricingLimits(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          currentMax: Number(currentMax)
        }
      };
      
      // Auto adjust provider rates if they exceed new limit caps
      setProviders(oldProv => oldProv.map(p => {
        if (p.type === category && p.pricePerUnit > currentMax) {
          triggerSms(p.name, `AgriMarket Regulation Alert: Platform maximum rate for ${category} changed. Your listing price auto-adjusted to Rs. ${currentMax}/hr.`);
          return { ...p, pricePerUnit: currentMax };
        }
        return p;
      }));

      return updated;
    });
  };

  // Process payment simulation
  const completePayment = (bookingId) => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        triggerSms(bk.farmerName, `Payment Successful! Rs. ${bk.workTimer.totalCost || bk.rate} received via UPI (Razorpay). Thank you for using AgriMarket!`);
        triggerSms(bk.providerName, `Payment cleared! Rs. ${bk.workTimer.totalCost || bk.rate} added to your wallet. You can withdraw your earnings instantly.`);
        return { ...bk, paymentStatus: 'paid' };
      }
      return bk;
    }));
  };

  // Background clock ticker to increment active work timers
  useEffect(() => {
    const timer = setInterval(() => {
      setBookings(prevBookings => {
        let hasChanges = false;
        const updated = prevBookings.map(bk => {
          if (bk.status === 'in_progress' && bk.workTimer.isActive) {
            hasChanges = true;
            const newSeconds = bk.workTimer.secondsElapsed + 20; // Fast time simulation (20s per tick!)
            const totalHours = newSeconds / 3600;
            const calculatedCost = Math.round(totalHours * bk.rate);
            
            return {
              ...bk,
              workTimer: {
                ...bk.workTimer,
                secondsElapsed: newSeconds,
                totalCost: Math.max(50, calculatedCost)
              }
            };
          }
          return bk;
        });
        return hasChanges ? updated : prevBookings;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AgriContext.Provider value={{
      userRole,
      setUserRole,
      providers,
      bookings,
      pricingLimits,
      smsLogs,
      activeBookingId,
      setActiveBookingId,
      addBooking,
      acceptBooking,
      rejectBooking,
      startWork,
      simulateGpsBreach,
      finishWork,
      cancelBooking,
      registerProvider,
      verifyProvider,
      updatePriceLimits,
      completePayment,
      triggerSms,
      setProviders,
      setBookings,
      weather,
      setWeatherState,
      customFieldPolygon,
      setCustomFieldPolygon,
      mlWeights,
      updateMlWeights
    }}>
      {children}
    </AgriContext.Provider>
  );
};

export const useAgri = () => useContext(AgriContext);
