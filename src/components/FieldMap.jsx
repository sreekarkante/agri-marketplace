import React, { useState, useEffect, useRef } from 'react';
import { useAgri } from '../context/AgriContext';

const FIELD_COORDINATES = [
  { id: 'f-1', name: "K. Sree's Field (Rice)", x: 200, y: 150, radius: 45, type: 'Paddy' },
  { id: 'f-2', name: "Sharma's Field (Wheat)", x: 450, y: 220, radius: 55, type: 'Wheat' },
  { id: 'f-3', name: "Yadav's Field (Sugarcane)", x: 600, y: 100, radius: 50, type: 'Sugarcane' },
  { id: 'f-4', name: "Patel's Field (Cotton)", x: 180, y: 300, radius: 40, type: 'Cotton' },
];

export default function FieldMap({ selectedProviderId, onSelectProvider }) {
  const { 
    providers, 
    bookings, 
    simulateGpsBreach, 
    weather, 
    customFieldPolygon, 
    setCustomFieldPolygon 
  } = useAgri();
  
  const [vehiclePos, setVehiclePos] = useState({ x: 200, y: 150 });
  const [wiggle, setWiggle] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef(null);

  // Get active booking
  const activeBooking = bookings.find(b => b.status === 'in_progress');

  // Calculate polygon centroid if we have a custom boundary drawn
  const getCentroid = (points) => {
    if (!points || points.length === 0) return { x: 200, y: 150 };
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return {
      x: Math.round(sum.x / points.length),
      y: Math.round(sum.y / points.length)
    };
  };

  // Handle vehicle positioning & simulation based on active booking
  useEffect(() => {
    if (!activeBooking) return;

    // Use custom polygon centroid if drawn, otherwise use Sree's default field f-1 coordinates
    const centroid = customFieldPolygon.length >= 3 
      ? getCentroid(customFieldPolygon) 
      : { x: FIELD_COORDINATES[0].x, y: FIELD_COORDINATES[0].y };

    if (activeBooking.gpsStatus === 'in_field') {
      setVehiclePos(centroid);
    } else if (activeBooking.gpsStatus === 'breached') {
      // Position vehicle far outside Sree's field/polygon
      setVehiclePos({ x: centroid.x + 110, y: centroid.y - 70 });
    }
  }, [activeBooking?.gpsStatus, activeBooking, customFieldPolygon]);

  // Minor vibration effect to show tractor is active/working
  useEffect(() => {
    if (activeBooking && activeBooking.gpsStatus === 'in_field' && activeBooking.workTimer.isActive) {
      const interval = setInterval(() => {
        setWiggle({
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6
        });
      }, 150);
      return () => clearInterval(interval);
    } else {
      setWiggle({ x: 0, y: 0 });
    }
  }, [activeBooking]);

  const handleGpsToggle = (action) => {
    if (activeBooking) {
      simulateGpsBreach(activeBooking.id, action);
    }
  };

  // Click on SVG to draw polygon
  const handleSvgClick = (e) => {
    if (!isDrawing) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    // Convert screen coordinates to SVG viewbox (750x380)
    const x = Math.round((e.clientX - rect.left) * (750 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (380 / rect.height));

    // Limit to 8 coordinates for safety
    if (customFieldPolygon.length < 8) {
      setCustomFieldPolygon(prev => [...prev, { x, y }]);
    }
  };

  // Create SVG points string
  const getPointsString = (points) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex justify-between align-center flex-wrap gap-sm">
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot"></span> Live Village GPS Map 
            {weather === 'rainy' && <span className="badge badge-danger">⛈️ MONSOON STORM SURGE</span>}
            {weather === 'harvest' && <span className="badge badge-warning">🌾 PEAK HARVEST RUSH</span>}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {isDrawing 
              ? '📐 CLicking grid nodes to draw custom satellite boundaries...'
              : 'Interactive tracking grid showing fields, tractors & workers'
            }
          </p>
        </div>
        
        {/* Draw Custom boundary controller */}
        <div className="flex gap-sm">
          {!activeBooking && (
            <>
              {isDrawing ? (
                <>
                  <button 
                    onClick={() => setIsDrawing(false)} 
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    disabled={customFieldPolygon.length < 3}
                  >
                    🔒 Save Perimeter ({customFieldPolygon.length} Points)
                  </button>
                  <button 
                    onClick={() => setCustomFieldPolygon([])} 
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Clear Points
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsDrawing(true);
                    setCustomFieldPolygon([]);
                  }} 
                  className={`btn ${customFieldPolygon.length > 0 ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'var(--secondary)' }}
                >
                  📐 {customFieldPolygon.length > 0 ? 'Redraw Satellite Boundary' : 'Sketch Custom Boundary'}
                </button>
              )}
            </>
          )}

          {activeBooking && (
            <div className="flex gap-sm">
              {activeBooking.gpsStatus === 'in_field' ? (
                <button 
                  onClick={() => handleGpsToggle('exit')} 
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  ⚠️ Trigger GPS Field Exit
                </button>
              ) : (
                <button 
                  onClick={() => handleGpsToggle('return')} 
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  🚜 Return to Field Area
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`map-canvas-container ${weather === 'rainy' ? 'rainy' : ''}`} style={{
        position: 'relative',
        transition: 'all 0.5s ease',
        background: weather === 'rainy' ? '#0b0f1a' : '#0f1624'
      }}>
        <div className="grid-overlay" style={{
          opacity: weather === 'rainy' ? 0.3 : 1
        }}></div>
        
        {/* Sky rainy dark visual overlay */}
        {weather === 'rainy' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(rgba(8, 47, 73, 0.2), transparent)',
            pointerEvents: 'none',
            zIndex: 2
          }} />
        )}

        <svg 
          ref={svgRef}
          onClick={handleSvgClick}
          width="100%" 
          height="100%" 
          viewBox="0 0 750 380" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            cursor: isDrawing ? 'crosshair' : 'default',
            zIndex: 3
          }}
        >
          {/* Defs for gradients */}
          <defs>
            <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B4332" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#081c15" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="activeFieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="customPolygonGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.02" />
            </radialGradient>
            <radialGradient id="breachGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Rainy particle animation overlays */}
          {weather === 'rainy' && (
            <g opacity="0.35">
              {[120, 240, 360, 480, 600, 720, 80, 180, 280, 380, 490, 580, 680].map((dropX, i) => (
                <line 
                  key={i}
                  x1={dropX} 
                  y1={-30 + (i * 20) % 50} 
                  x2={dropX - 15} 
                  y2={420} 
                  stroke="var(--secondary)" 
                  strokeWidth="1.5"
                  strokeDasharray="20 180"
                  style={{
                    animation: 'pulse 1.2s infinite linear',
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              ))}
            </g>
          )}

          {/* Fields Layer */}
          {FIELD_COORDINATES.map(field => {
            const isActiveField = activeBooking && field.id === 'f-1'; // Sim Sree's Field
            
            // If custom field polygon exists, do NOT draw the circle for f-1, we will draw the polygon below!
            if (isActiveField && customFieldPolygon.length >= 3) return null;

            return (
              <g key={field.id}>
                {/* Field circle */}
                <circle 
                  cx={field.x} 
                  cy={field.y} 
                  r={field.radius} 
                  fill={isActiveField ? "url(#activeFieldGrad)" : "url(#fieldGrad)"}
                  stroke={isActiveField ? "var(--primary)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isActiveField ? "2" : "1"}
                  strokeDasharray={isActiveField ? "4 4" : "none"}
                />
                {/* Text identifier */}
                <text 
                  x={field.x} 
                  y={field.y} 
                  textAnchor="middle" 
                  fill="rgba(255,255,255,0.4)" 
                  fontSize="10" 
                  fontWeight="600"
                  dy="-4"
                >
                  {field.name.split("'")[0]}
                </text>
                <text 
                  x={field.x} 
                  y={field.y} 
                  textAnchor="middle" 
                  fill={isActiveField ? "var(--primary)" : "var(--text-muted)"} 
                  fontSize="8.5"
                  dy="8"
                >
                  ({field.type})
                </text>
              </g>
            );
          })}

          {/* DRAW CUSTOM POLYGON DRAWER BOUNDS */}
          {customFieldPolygon.length > 0 && (
            <g>
              {/* Drawn polygon face */}
              {customFieldPolygon.length >= 3 && (
                <polygon 
                  points={getPointsString(customFieldPolygon)}
                  fill="url(#customPolygonGrad)"
                  stroke={activeBooking ? "var(--primary)" : "var(--secondary)"}
                  strokeWidth="2.5"
                  strokeDasharray={activeBooking ? "4 4" : "none"}
                />
              )}

              {/* Draw dots at vertices */}
              {customFieldPolygon.map((p, i) => (
                <g key={i}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isDrawing ? "6" : "3.5"} 
                    fill={isDrawing ? "var(--secondary)" : "var(--primary-light)"} 
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {isDrawing && (
                    <text 
                      x={p.x} 
                      y={p.y - 10} 
                      fill="white" 
                      fontSize="9" 
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {i + 1}
                    </text>
                  )}
                </g>
              ))}

              {/* Centroid / Field label */}
              {customFieldPolygon.length >= 3 && (
                <g>
                  {/* Label */}
                  <text 
                    x={getCentroid(customFieldPolygon).x}
                    y={getCentroid(customFieldPolygon).y}
                    textAnchor="middle"
                    fill="var(--secondary)"
                    fontWeight="bold"
                    fontSize="9.5"
                  >
                    🛰️ SATELLITE PLOT
                  </text>
                </g>
              )}
            </g>
          )}

          {/* GPS Breach Area Highlight */}
          {activeBooking && activeBooking.gpsStatus === 'breached' && (
            <circle 
              cx={customFieldPolygon.length >= 3 ? getCentroid(customFieldPolygon).x + 110 : FIELD_COORDINATES[0].x + 90} 
              cy={customFieldPolygon.length >= 3 ? getCentroid(customFieldPolygon).y - 70 : FIELD_COORDINATES[0].y - 70} 
              r="30" 
              fill="url(#breachGrad)"
              stroke="var(--danger)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Static Fields Connecting Roads Representation */}
          <path 
            d="M 100,200 L 700,200 M 300,50 L 300,350 M 550,50 L 550,350" 
            stroke="rgba(255, 255, 255, 0.03)" 
            strokeWidth="8" 
            fill="none" 
          />

          {/* Providers Layer */}
          {providers.map(prov => {
            if (prov.status === 'offline') return null;
            
            // If this provider is currently in progress, we will render it at the dynamic vehicle position
            const isBookingActive = activeBooking && activeBooking.providerId === prov.id;
            const x = isBookingActive ? (vehiclePos.x + wiggle.x) : prov.x;
            const y = isBookingActive ? (vehiclePos.y + wiggle.y) : prov.y;
            
            const isSelected = selectedProviderId === prov.id;
            
            // Icon color based on type
            let color = 'var(--primary)';
            let iconText = '🚜';
            if (prov.type === 'labour') { color = 'var(--secondary)'; iconText = '👥'; }
            if (prov.type === 'machinery') { color = 'var(--warning)'; iconText = '🌾'; }
            
            return (
              <g 
                key={prov.id}
                onClick={() => !isDrawing && onSelectProvider && onSelectProvider(prov.id)}
                style={{ cursor: isDrawing ? 'default' : 'pointer' }}
              >
                {/* Highlight ring */}
                {(isSelected || isBookingActive) && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="22" 
                    fill="none" 
                    stroke={isBookingActive && activeBooking.gpsStatus === 'breached' ? 'var(--danger)' : color} 
                    strokeWidth="2"
                    style={{ animation: 'pulse 2s infinite ease-in-out' }}
                  />
                )}
                
                {/* Node circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="14" 
                  fill={isBookingActive && activeBooking.gpsStatus === 'breached' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.9)'}
                  stroke={isBookingActive && activeBooking.gpsStatus === 'breached' ? 'var(--danger)' : color}
                  strokeWidth="2"
                />
                
                {/* Mini Emblem */}
                <text 
                  x={x} 
                  y={y} 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fontSize="12"
                >
                  {iconText}
                </text>

                {/* Name Tag */}
                <rect 
                  x={x - 45} 
                  y={y + 18} 
                  width="90" 
                  height="14" 
                  rx="3" 
                  fill="rgba(11, 15, 25, 0.85)" 
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
                <text 
                  x={x} 
                  y={y + 28} 
                  textAnchor="middle" 
                  fill={isBookingActive && activeBooking.gpsStatus === 'breached' ? '#ef4444' : 'white'} 
                  fontSize="7.5"
                  fontWeight="600"
                >
                  {prov.name.split(" ")[0]} {isBookingActive ? "(ACTIVE)" : ""}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Map Legend */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(7, 11, 19, 0.85)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          pointerEvents: 'none',
          zIndex: 4
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span> Tractors
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }}></span> Labour Teams
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }}></span> Combine Harvesters
          </span>
        </div>
      </div>
    </div>
  );
}
