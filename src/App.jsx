import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, X, DollarSign, Clock, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

// Leaflet imports - these would normally be imported but we'll load them via CDN
const loadLeaflet = () => {
  return new Promise((resolve) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    
    // Load Leaflet CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(cssLink);
    
    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
};

const App = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedATM, setSelectedATM] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [filteredATMs, setFilteredATMs] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const leafletRef = useRef(null);

  // St. Andrew center coordinates
  const ST_ANDREW_CENTER = { lat: 18.0391, lng: -76.7567 };

  // Banks and their colors for pins
  const BANKS = {
    'BNS': { name: 'Bank of Nova Scotia', color: '#E31837' },
    'NCB': { name: 'National Commercial Bank', color: '#1E3A8A' },
    'JMMB': { name: 'Jamaica Money Market Brokers', color: '#059669' },
    'CIBC': { name: 'CIBC FirstCaribbean', color: '#DC2626' },
    'JN': { name: 'Jamaica National', color: '#7C3AED' },
    'FCIB': { name: 'First Caribbean International Bank', color: '#0891B2' },
    'Sagicor': { name: 'Sagicor Bank', color: '#EA580C' }
  };

  // Generate random ATM data around St. Andrew
  const generateATMData = () => {
    const atmTypes = ['ATM', 'ABM'];
    const bankKeys = Object.keys(BANKS);
    const atms = [];

    for (let i = 0; i < 20; i++) {
      const bank = bankKeys[Math.floor(Math.random() * bankKeys.length)];
      // Generate coordinates within ~10km radius of St. Andrew center
      const lat = ST_ANDREW_CENTER.lat + (Math.random() - 0.5) * 0.1;
      const lng = ST_ANDREW_CENTER.lng + (Math.random() - 0.5) * 0.1;
      
      atms.push({
        id: i + 1,
        bank,
        bankName: BANKS[bank].name,
        type: atmTypes[Math.floor(Math.random() * atmTypes.length)],
        lat,
        lng,
        withdrawalFee: Math.floor(Math.random() * 300) + 100,
        depositFee: Math.floor(Math.random() * 200) + 50,
        lowOnCash: Math.random() < 0.2,
        functional: Math.random() < 0.9,
        supportsCurrency: Math.random() < 0.3 ? 'USD' : 'JMD',
        address: `${Math.floor(Math.random() * 999) + 1} ${['Hope Road', 'Half Way Tree Road', 'Constant Spring Road', 'Old Hope Road', 'Trafalgar Road'][Math.floor(Math.random() * 5)]}`
      });
    }
    return atms;
  };

  const [atms] = useState(generateATMData());

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize Leaflet map
  useEffect(() => {
    loadLeaflet().then((L) => {
      leafletRef.current = L;
      if (mapRef.current && !leafletMapRef.current) {
        // Initialize the map
        leafletMapRef.current = L.map(mapRef.current, {
          zoomControl: false  // This removes the zoom buttons
        }).setView([ST_ANDREW_CENTER.lat, ST_ANDREW_CENTER.lng], 12);        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMapRef.current);
        
        setMapLoaded(true);
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          setUserLocation(ST_ANDREW_CENTER);
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      setUserLocation(ST_ANDREW_CENTER);
    }
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRef.current || !userLocation) return;

    const L = leafletRef.current;

    // Remove existing user marker
    if (userMarkerRef.current) {
      leafletMapRef.current.removeLayer(userMarkerRef.current);
    }

    // Create user location marker
    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="width: 24px; height: 24px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(leafletMapRef.current)
      .bindPopup('You are here')
      .openPopup();

    // Center map on user location
    leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, mapLoaded]);

  // Filter ATMs based on active filter
  useEffect(() => {
    if (!userLocation) return;

    let filtered = [...atms];

    // Add distance to each ATM
    filtered = filtered.map(atm => ({
      ...atm,
      distance: calculateDistance(userLocation.lat, userLocation.lng, atm.lat, atm.lng)
    }));

    switch (activeFilter) {
      case 'ALL':
        break;
      case 'BNS':
      case 'NCB':
      case 'JMMB':
      case 'CIBC':
      case 'JN':
      case 'FCIB':
      case 'Sagicor':
        filtered = filtered.filter(atm => atm.bank === activeFilter);
        break;
      case 'LOWEST_FEES':
        filtered = filtered.sort((a, b) => a.withdrawalFee - b.withdrawalFee).slice(0, 10);
        break;
      case 'SHORTEST_DISTANCE':
        filtered = filtered.sort((a, b) => a.distance - b.distance).slice(0, 10);
        break;
      case 'ABM_ONLY':
        filtered = filtered.filter(atm => atm.type === 'ABM');
        break;
      case 'USD_ONLY':
        filtered = filtered.filter(atm => atm.supportsCurrency === 'USD');
        break;
    }

    setFilteredATMs(filtered);
  }, [atms, userLocation, activeFilter]);

  // Update ATM markers on map
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRef.current || !mapLoaded) return;

    const L = leafletRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers for filtered ATMs
    filteredATMs.forEach(atm => {
      const color = !atm.functional ? '#EF4444' : atm.lowOnCash ? '#F59E0B' : BANKS[atm.bank].color;
      
      const atmIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: ${color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: 36px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
            white-space: nowrap;
            pointer-events: none;
          ">${atm.bank}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([atm.lat, atm.lng], { icon: atmIcon })
        .addTo(leafletMapRef.current)
        .on('click', () => {
          setSelectedATM(atm);
        });

      markersRef.current.push(marker);
    });
  }, [filteredATMs, mapLoaded]);

  const FilterButton = ({ filter, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all mb-2 text-left ${
        isActive 
          ? 'bg-blue-500 text-white shadow-md' 
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
      style={{ width: '100%' }}
    >
      {label}
    </button>
  );

  const ATMDetails = ({ atm, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl shadow-xl border border-gray-200 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s ease-out',
          width: '100%',
          maxWidth: '28rem'
        }}
      >
        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}</style>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">{atm.bankName}</h3>
              <p className="text-xs text-gray-600 mt-1">{atm.address}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Type</span>
              <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-full text-xs">{atm.type}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Distance</span>
              <span className="font-semibold text-gray-900 text-xs">{atm.distance?.toFixed(2)} km away</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Withdrawal Fee</span>
              <span className="font-semibold text-green-600 text-xs">J${atm.withdrawalFee}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Deposit Fee</span>
              <span className="font-semibold text-green-600 text-xs">J${atm.depositFee}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Currency</span>
              <span className="font-semibold text-gray-900 text-xs">{atm.supportsCurrency}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <div className="flex items-center gap-1">
                {atm.functional ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${
                  atm.functional ? 'text-green-600' : 'text-red-600'
                }`}>
                  {atm.functional ? 'Functional' : 'Out of Order'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-gray-600">Cash Level</span>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${
                  atm.lowOnCash ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className={`text-xs font-semibold ${
                  atm.lowOnCash ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {atm.lowOnCash ? 'Low on Cash' : 'Cash Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!userLocation) {
    return (
      <div style={{ height: '100vh', width: '100vw' }} className="bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Getting your location...</h3>
          <p className="text-gray-600">Please allow location access to find nearby ATMs</p>
          {locationError && (
            <p className="text-red-600 text-sm mt-2">Error: {locationError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }} className="bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0" style={{ width: '100%' }}>
        <h1 className="text-xl font-semibold text-gray-900">Neighbourhood</h1>
        <p className="text-sm text-gray-600">Find ATMs near you</p>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden" style={{ width: '100%' }}>
        {/* Filter Panel */}
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="bg-white rounded-lg p-3 shadow-lg border border-gray-200 flex items-center gap-2"
          >
            <Filter className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Filter</span>
          </button>

          {filterOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-h-80 overflow-y-auto" style={{ width: '16rem' }}>
              <div className="space-y-1">
                <FilterButton
                  filter="ALL"
                  label="All ATMs"
                  isActive={activeFilter === 'ALL'}
                  onClick={() => setActiveFilter('ALL')}
                />
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">BANKS</p>
                  {Object.keys(BANKS).map(bank => (
                    <FilterButton
                      key={bank}
                      filter={bank}
                      label={bank}
                      isActive={activeFilter === bank}
                      onClick={() => setActiveFilter(bank)}
                    />
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">OPTIONS</p>
                  <FilterButton
                    filter="LOWEST_FEES"
                    label="Lowest Fees"
                    isActive={activeFilter === 'LOWEST_FEES'}
                    onClick={() => setActiveFilter('LOWEST_FEES')}
                  />
                  <FilterButton
                    filter="SHORTEST_DISTANCE"
                    label="Closest to Me"
                    isActive={activeFilter === 'SHORTEST_DISTANCE'}
                    onClick={() => setActiveFilter('SHORTEST_DISTANCE')}
                  />
                  <FilterButton
                    filter="ABM_ONLY"
                    label="ABM Only"
                    isActive={activeFilter === 'ABM_ONLY'}
                    onClick={() => setActiveFilter('ABM_ONLY')}
                  />
                  <FilterButton
                    filter="USD_ONLY"
                    label="US Currency Only"
                    isActive={activeFilter === 'USD_ONLY'}
                    onClick={() => setActiveFilter('USD_ONLY')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200 z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            {filteredATMs.length} ATMs found
          </span>
        </div>

        {/* Leaflet Map */}
        <div 
          ref={mapRef}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />
      </div>

      {/* ATM Details Modal */}
      {selectedATM && (
        <ATMDetails
          atm={selectedATM}
          onClose={() => setSelectedATM(null)}
        />
      )}
    </div>
  );
};

export default App;