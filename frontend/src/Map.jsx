// works...kinda sorta ish some way when you clear cache. still loads blank sometimes.

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, X, DollarSign, Clock, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, LogOut, User, Navigation, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';

// Leaflet imports - loaded via CDN
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

const Map = ({ userEmail }) => {
  const { logout, user, verifyToken, showSuccessToast, showErrorToast } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [selectedATM, setSelectedATM] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('USER_PREFERENCES'); // Default to user preferences
  const [filteredATMs, setFilteredATMs] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [atms, setAtms] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreferenceSummary, setShowPreferenceSummary] = useState(true);
  
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const leafletRef = useRef(null);
  const locationWatchRef = useRef(null);
  const accuracyCircleRef = useRef(null);

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
    'Scotia': { name: 'Bank of Nova Scotia', color: '#059669' },
    'Sagicor': { name: 'Sagicor Bank', color: '#00b5ef' },
    'Any': { name: 'Any Bank', color: '#6B7280' }
  };

  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        logout();
        return;
      }

      const isValid = await verifyToken(token);
      if (!isValid) {
        logout();
      }
    };

    checkAuth();
  }, []);

  // Get API base URL based on environment
  const getApiBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:5000';
    }
    return '';
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch user preferences
  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return null;

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/user-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const preferences = await response.json();
        setUserPreferences(preferences);
        console.log('User preferences loaded:', preferences);
        return preferences;
      } else if (response.status === 404) {
        console.log('No user preferences found - user may not have completed questionnaire');
        return null;
      } else {
        throw new Error('Failed to fetch user preferences');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  };

  // Start real-time location tracking
  const startLocationTracking = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation not supported');
      setUserLocation(ST_ANDREW_CENTER);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 10000, // 10 seconds
      timeout: 15000 // 15 seconds
    };

    setLocationTracking(true);

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(newLocation);
        setLocationAccuracy(position.coords.accuracy);
        setLocationError(null);
        
        console.log('Location updated:', newLocation, 'Accuracy:', position.coords.accuracy, 'm');
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError(error.message);
        
        // If we don't have a location yet, use fallback
        if (!userLocation) {
          setUserLocation(ST_ANDREW_CENTER);
        }
      },
      options
    );
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
      setLocationTracking(false);
      console.log('Location tracking stopped');
    }
  };

  // Toggle location tracking
  const toggleLocationTracking = () => {
    if (locationTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  // Fetch ATMs from backend API (updated to support preferences)
  const fetchATMs = async (usePreferences = true) => {
    try {
      setRefreshing(true);
      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('jwtToken');
      
      let url = `${apiBaseUrl}/api/atms`;
      let headers = {
        'Content-Type': 'application/json',
      };

      // If using preferences and we have user location, use filtered endpoint
      if (usePreferences && token && userLocation) {
        url = `${apiBaseUrl}/api/atms/filtered?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        headers['Authorization'] = `Bearer ${token}`;
      } else if (usePreferences && token) {
        // Use filtered endpoint without location
        url = `${apiBaseUrl}/api/atms/filtered`;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ATM data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAtms(data || []);
      setError(null);
      
      const now = new Date();
      setLastUpdated(now.toLocaleString());
      
      console.log(`Fetched ${data.length} ATMs${usePreferences ? ' (filtered by preferences)' : ''}`);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ATMs:', err);
      
      // Fallback to regular ATMs if filtered request fails
      if (usePreferences) {
        console.log('Falling back to unfiltered ATMs');
        await fetchATMs(false);
        return;
      }
      
      if (atms.length === 0) {
        setError(`Unable to load ATM data: ${err.message}`);
      } else {
        console.warn('Failed to refresh ATM data, using cached data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh (updated to support preferences)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchATMs(activeFilter === 'USER_PREFERENCES');
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      stopLocationTracking();
      logout();
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    loadLeaflet().then((L) => {
      leafletRef.current = L;
      if (mapRef.current && !leafletMapRef.current) {
        try {
          leafletMapRef.current = L.map(mapRef.current, {
            zoomControl: false,
            preferCanvas: true, // Better performance
            worldCopyJump: true
          }).setView([ST_ANDREW_CENTER.lat, ST_ANDREW_CENTER.lng], 12);        
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(leafletMapRef.current);
          
          // Wait for map to be fully loaded before setting mapLoaded to true
          leafletMapRef.current.whenReady(() => {
            console.log('Map is ready');
            setMapLoaded(true);
          });

          // Add additional event listeners for debugging
          leafletMapRef.current.on('load', () => {
            console.log('Map load event fired');
          });

          leafletMapRef.current.on('viewreset', () => {
            console.log('Map view reset');
          });

        } catch (error) {
          console.error('Error initializing map:', error);
          // Retry initialization after a short delay
          setTimeout(() => {
            if (!leafletMapRef.current && mapRef.current) {
              console.log('Retrying map initialization...');
              // Don't retry recursively, just log the issue
            }
          }, 1000);
        }
      }
    }).catch(error => {
      console.error('Error loading Leaflet:', error);
    });

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        leafletMapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Start location tracking and fetch preferences when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Start location tracking
      startLocationTracking();
      
      // Fetch user preferences
      await fetchUserPreferences();
    };

    initializeData();
    
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Fetch ATM statistics
  const fetchATMStats = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/atms/stats`);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('ATM Stats:', stats);
        return stats;
      }
    } catch (err) {
      console.warn('Failed to fetch ATM stats:', err);
    }
    return null;
  };

  // Fetch ATM data on component mount (updated to use preferences)
  useEffect(() => {
    if (userLocation) {
      // Fetch ATMs with preferences when location is available
      fetchATMs(true);
    }
    
    // Fetch stats on load
    fetchATMStats();
    
    const interval = setInterval(() => {
      fetchATMs(activeFilter === 'USER_PREFERENCES');
      fetchATMStats();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userLocation]);

  // Update user location marker with real-time updates
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRef.current || !userLocation || !mapLoaded) return;

    const L = leafletRef.current;
    const map = leafletMapRef.current;

    // Wait for map to be fully initialized
    if (!map._loaded) {
      map.whenReady(() => {
        // Retry this effect after map is ready
        setTimeout(() => {
          if (leafletMapRef.current && leafletMapRef.current._loaded) {
            updateUserLocationMarker();
          }
        }, 100);
      });
      return;
    }

    updateUserLocationMarker();

    function updateUserLocationMarker() {
      try {
        // Remove existing user marker and accuracy circle safely
        if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
          map.removeLayer(userMarkerRef.current);
        }
        if (accuracyCircleRef.current && map.hasLayer(accuracyCircleRef.current)) {
          map.removeLayer(accuracyCircleRef.current);
        }

        // Validate coordinates
        if (!userLocation.lat || !userLocation.lng || 
            isNaN(userLocation.lat) || isNaN(userLocation.lng) ||
            Math.abs(userLocation.lat) > 90 || Math.abs(userLocation.lng) > 180) {
          console.warn('Invalid user location coordinates:', userLocation);
          return;
        }

        // Create accuracy circle if we have accuracy data and map has proper bounds
        if (locationAccuracy && locationAccuracy < 1000 && locationAccuracy > 0) {
          try {
            // Check if the location is within reasonable bounds before creating circle
            const bounds = map.getBounds();
            if (bounds && bounds.isValid()) {
              accuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
                radius: locationAccuracy,
                fillColor: '#3B82F6',
                color: '#3B82F6',
                weight: 1,
                opacity: 0.3,
                fillOpacity: 0.1
              });
              
              // Only add to map if circle was created successfully
              if (accuracyCircleRef.current) {
                accuracyCircleRef.current.addTo(map);
              }
            }
          } catch (circleError) {
            console.warn('Error creating accuracy circle:', circleError);
            accuracyCircleRef.current = null;
          }
        }

        // Create user location marker with different style based on tracking status
        const userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="
              width: 24px; 
              height: 24px; 
              background: ${locationTracking ? '#10B981' : '#3B82F6'}; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ${locationTracking ? 'animation: pulse 2s infinite;' : ''}
            "></div>
            <style>
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              }
            </style>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
          <div>
            <strong>You are here</strong><br>
            ${locationTracking ? '📍 Live tracking active' : '📍 Static location'}<br>
            ${locationAccuracy ? `Accuracy: ±${Math.round(locationAccuracy)}m` : ''}
          </div>
        `;

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(popupContent);

        // Only center map on first location or if user is far from current view
        try {
          const mapCenter = map.getCenter();
          if (mapCenter) {
            const distanceFromCenter = calculateDistance(
              mapCenter.lat, mapCenter.lng, 
              userLocation.lat, userLocation.lng
            );
            
            // Center map if it's the first location update or user moved significantly
            if (distanceFromCenter > 5) { // 5km threshold
              map.setView([userLocation.lat, userLocation.lng], 13);
            }
          } else {
            // First time setting location
            map.setView([userLocation.lat, userLocation.lng], 13);
          }
        } catch (viewError) {
          console.warn('Error setting map view:', viewError);
        }

      } catch (error) {
        console.error('Error updating user location marker:', error);
      }
    }
  }, [userLocation, mapLoaded, locationTracking, locationAccuracy]);

  // Filter ATMs based on active filter (updated to support preferences)
  useEffect(() => {
    if (!userLocation && activeFilter !== 'USER_PREFERENCES') {
      setFilteredATMs(atms);
      return;
    }

    let filtered = [...atms];

    filtered = filtered.filter(atm => atm.lat && atm.lng);

    filtered = filtered.map(atm => ({
      ...atm,
      distance: calculateDistance(userLocation.lat, userLocation.lng, atm.lat, atm.lng)
    }));

    switch (activeFilter) {
      case 'USER_PREFERENCES':
        // ATMs are already filtered by backend when using preferences
        break;
      case 'ALL':
        break;
      case 'BNS':
      case 'NCB':
      case 'JMMB':
      case 'CIBC':
      case 'JN':
      case 'FCIB':
      case 'Sagicor':
      case 'Scotia':
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
    const map = leafletMapRef.current;

    // Ensure map is fully loaded
    if (!map._loaded) {
      map.whenReady(() => {
        setTimeout(() => {
          if (leafletMapRef.current && leafletMapRef.current._loaded) {
            updateATMMarkers();
          }
        }, 100);
      });
      return;
    }

    updateATMMarkers();

    function updateATMMarkers() {
      try {
        // Clean up existing markers
        markersRef.current.forEach(marker => {
          try {
            if (map.hasLayer(marker)) {
              map.removeLayer(marker);
            }
          } catch (error) {
            console.warn('Error removing marker:', error);
          }
        });
        markersRef.current = [];

        filteredATMs.forEach(atm => {
          if (!atm.lat || !atm.lng || isNaN(atm.lat) || isNaN(atm.lng)) {
            console.warn('Invalid ATM coordinates:', atm);
            return;
          }

          try {
            const color = !atm.functional ? '#EF4444' : atm.lowOnCash ? '#F59E0B' : BANKS[atm.bank]?.color || '#6B7280';
            
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
                  ${atm.geocodingFailed ? 'opacity: 0.7; border-style: dashed;' : ''}
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
              .addTo(map)
              .on('click', () => {
                setSelectedATM(atm);
              });

            markersRef.current.push(marker);
          } catch (error) {
            console.error('Error creating ATM marker:', error, atm);
          }
        });
      } catch (error) {
        console.error('Error updating ATM markers:', error);
      }
    }
  }, [filteredATMs, mapLoaded]);

  // Preference Summary Component
  const PreferenceSummary = () => {
    if (!userPreferences || !showPreferenceSummary) return null;

    return (
      <div className="absolute top-20 left-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-sm">Your Preferences</h3>
          <button
            onClick={() => setShowPreferenceSummary(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Banks:</span> {userPreferences.preferred_banks.join(', ')}
          </div>
          <div>
            <span className="font-medium">Transactions:</span> {userPreferences.transaction_types.join(', ')}
          </div>
          <div>
            <span className="font-medium">Max Distance:</span> {userPreferences.max_radius_km} km
          </div>
          <div>
            <span className="font-medium">Currency:</span> {userPreferences.preferred_currency}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-blue-600">
            Showing {filteredATMs.length} ATMs matching your preferences
          </p>
        </div>
      </div>
    );
  };

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
              {atm.geocodingFailed && (
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Approximate location
                </p>
              )}
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

  if (loading && atms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {userPreferences ? 'Loading your personalized ATM map...' : 'Loading ATM data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error && atms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load ATM data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchATMs(activeFilter === 'USER_PREFERENCES')}
            disabled={refreshing}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Getting your location...</h3>
          <p className="text-gray-600">
            {userPreferences ? 
              'We need your location to show personalized ATM recommendations' : 
              'Please allow location access to find nearby ATMs'
            }
          </p>
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Neighbourhood</h1>
              <p className="text-sm text-gray-600">
                {userPreferences ? 'Personalized ATM recommendations' : 'Find ATMs near you'}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 ml-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden md:inline">
                Updated: {lastUpdated}
              </span>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{user?.email || userEmail}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b sm:hidden">
                      {user?.email || userEmail}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {error && atms.length > 0 && (
          <p className="text-xs text-yellow-600 mt-1">Warning: Using cached data - {error}</p>
        )}
        {locationError && (
          <p className="text-xs text-yellow-600 mt-1">Location: {locationError}</p>
        )}
      </div>

      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden" style={{ width: '100%' }}>
        {/* Location Tracking Toggle Button */}
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={toggleLocationTracking}
            className={`p-3 rounded-lg shadow-lg border border-gray-200 transition-all ${
              locationTracking 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={locationTracking ? 'Stop live tracking' : 'Start live tracking'}
          >
            <Navigation className={`w-5 h-5 ${locationTracking ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="bg-white rounded-lg p-3 shadow-lg border border-gray-200 flex items-center gap-2"
          >
            <Filter className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {activeFilter === 'USER_PREFERENCES' ? 'Your Preferences' : 'Filter'}
            </span>
          </button>

          {filterOpen && (
            <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-h-80 overflow-y-auto" style={{ width: '16rem' }}>
              <div className="space-y-1">
                <FilterButton
                  filter="USER_PREFERENCES"
                  label="✨ Your Preferences"
                  isActive={activeFilter === 'USER_PREFERENCES'}
                  onClick={() => {
                    setActiveFilter('USER_PREFERENCES');
                    fetchATMs(true);
                  }}
                />
                
                <FilterButton
                  filter="ALL"
                  label="All ATMs"
                  isActive={activeFilter === 'ALL'}
                  onClick={() => {
                    setActiveFilter('ALL');
                    fetchATMs(false);
                  }}
                />
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">BANKS</p>
                  {Object.keys(BANKS).filter(bank => bank !== 'Any').map(bank => (
                    <FilterButton
                      key={bank}
                      filter={bank}
                      label={bank}
                      isActive={activeFilter === bank}
                      onClick={() => {
                        setActiveFilter(bank);
                        fetchATMs(false);
                      }}
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

        {/* User Preference Summary */}
        <PreferenceSummary />

        {/* Location Status and Results count */}
        <div className="absolute bottom-4 left-4 z-[1000] space-y-2">
          {/* Location Status */}
          <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                locationTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-xs font-medium text-gray-700">
                {locationTracking ? 'Live tracking' : 'Static location'}
              </span>
              {locationAccuracy && locationAccuracy < 100 && (
                <span className="text-xs text-gray-500">
                  (±{Math.round(locationAccuracy)}m)
                </span>
              )}
            </div>
          </div>
          
          {/* Results count */}
          <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {filteredATMs.length} ATMs {activeFilter === 'USER_PREFERENCES' ? 'recommended' : 'found'}
            </span>
          </div>

          {/* Show preferences button if summary is hidden */}
          {userPreferences && !showPreferenceSummary && (
            <button
              onClick={() => setShowPreferenceSummary(true)}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-xs font-medium flex items-center gap-2"
            >
              <Settings className="w-3 h-3" />
              Show Preferences
            </button>
          )}
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

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Map;