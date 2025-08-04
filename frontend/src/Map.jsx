// Fixed Map.jsx - Keeping original structure + adding recommendation feature
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, X, DollarSign, Clock, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, LogOut, User, Navigation, Settings, Target, Star, Info } from 'lucide-react';
import { useAuth } from './AuthContext';

// RecommendationButton component embedded within the Map component
const RecommendationButton = ({ 
  userLocation, 
  onRecommendationsReceived, 
  isAuthenticated, 
  className = "" 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  };

  const fetchRecommendations = async () => {
    // if (!isAuthenticated) {
    //   setError("Please log in to get personalized recommendations");
    //   return;
    // }

    if (!userLocation?.lat || !userLocation?.lng) {
      setError("Location access is required for recommendations");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwtToken'); // Using 'jwtToken' to match your AuthContext
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/api/recommendations?lat=${userLocation.lat}&lng=${userLocation.lng}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setShowModal(true);
        
        // Notify parent component about recommendations
        if (onRecommendationsReceived) {
          onRecommendationsReceived(data.recommendations);
        }
        
        console.log('Recommendations received:', data);
      } else {
        setError("No recommendations found for your current location and preferences");
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || "Failed to get recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const RecommendationCard = ({ recommendation, index }) => {
    const { atm_data, recommendation_score, distance_km, estimated_wait_people, reasons } = recommendation;
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 mb-3">
        {/* Header with rank and score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <h3 className="font-semibold text-gray-800">{atm_data.bankName}</h3>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${getScoreColor(recommendation_score)}`}>
              {getScoreLabel(recommendation_score)}
            </div>
            <div className="text-xs text-gray-500">
              Score: {(recommendation_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {/* Location and distance */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700">{atm_data.location}</p>
            <p className="text-xs text-gray-500">{atm_data.parish}</p>
          </div>
        </div>
        
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <Navigation className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-sm font-semibold">{formatDistance(distance_km)}</p>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Wait</p>
            <p className="text-sm font-semibold">
              {estimated_wait_people === 0 ? 'None' : `~${estimated_wait_people} people`}
            </p>
          </div>
          <div className="text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Fee</p>
            <p className="text-sm font-semibold">J${atm_data.withdrawalFee}</p>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 mb-3">
          {atm_data.functional && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              ✓ Working
            </span>
          )}
          {atm_data.deposit_available && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              💰 Deposits
            </span>
          )}
        </div>
        
        {/* Reasons */}
        {reasons && reasons.length > 0 && (
          <div className="border-t pt-2">
            <p className="text-xs text-gray-500 mb-1">Why recommended:</p>
            <ul className="text-xs text-gray-600">
              {reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Recommendation Button */}
      <button
        onClick={fetchRecommendations}
        // disabled={isLoading || !isAuthenticated || !userLocation?.lat}
        className={`
          ${className}
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg font-medium transition-all duration-200
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : !isAuthenticated || !userLocation?.lat
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95'
          }
          text-white text-sm
        `}
        title={
          !isAuthenticated 
            ? "Please log in to get recommendations" 
            : !userLocation?.lat 
            ? "Location access required"
            : "Get personalized ATM recommendations"
        }
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Getting...
          </>
        ) : (
          <>
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Recommend</span>
          </>
        )}
      </button>

      {/* Error display */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm z-50">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[10000] p-4">
          <div className="bg-white rounded-t-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-800">
                  Recommended ATMs
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {recommendations.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your preferences and location, here are the top {recommendations.length} ATMs for you:
                  </p>
                  
                  {recommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={recommendation.atm_id}
                      recommendation={recommendation}
                      index={index}
                    />
                  ))}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <Info className="w-3 h-3 inline mr-1" />
                      Recommendations are based on distance, your bank preferences, ATM functionality, and estimated wait times.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recommendations available</p>
                  <p className="text-sm text-gray-500">Try adjusting your preferences or location</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  const [activeFilter, setActiveFilter] = useState('USER_PREFERENCES');
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
  
  // NEW: Recommendation state
  const [recommendedATMs, setRecommendedATMs] = useState([]);
  const [showingRecommendations, setShowingRecommendations] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const leafletRef = useRef(null);
  const locationWatchRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Static bank configurations
  const BANKS = {
    'Any': { color: '#6B7280', name: 'Any Bank' },
    'BNS': { color: '#EF4444', name: 'Bank of Nova Scotia' },
    'NCB': { color: '#10B981', name: 'National Commercial Bank' },
    'JMMB': { color: '#3B82F6', name: 'JMMB Bank' },
    'CIBC': { color: '#8B5CF6', name: 'CIBC FirstCaribbean' },
    'JN': { color: '#F59E0B', name: 'JN Bank' },
    'FCIB': { color: '#06B6D4', name: 'FirstCaribbean International Bank' },
    'Sagicor': { color: '#00b5ef', name: 'Sagicor Bank' },
    'Scotia': { color: '#DC2626', name: 'Scotiabank' }
  };

  // Jamaica center coordinates
  const ST_ANDREW_CENTER = { lat: 18.0179, lng: -76.8099 };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwtToken');
      console.log('Checking authentication, token present:', !!token);
      
      if (token) {
        try {
          const isValid = await verifyToken();
          console.log('Token verification result:', isValid);
          setIsAuthenticated(isValid);
        } catch (error) {
          console.error('Token verification failed:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [verifyToken]);

  // NEW: Handle recommendation results
  const handleRecommendationsReceived = (recommendations) => {
    console.log('Received recommendations:', recommendations);
    
    // Extract ATM data from recommendations
    const recommendedATMData = recommendations.map(rec => ({
      ...rec.atm_data,
      isRecommended: true,
      recommendationScore: rec.recommendation_score,
      distanceKm: rec.distance_km,
      estimatedWait: rec.estimated_wait_people,
      reasons: rec.reasons
    }));
    
    setRecommendedATMs(recommendedATMData);
    setShowingRecommendations(true);
    
    // Optionally, center map on the best recommendation
    if (recommendedATMData.length > 0 && leafletMapRef.current) {
      const bestATM = recommendedATMData[0];
      leafletMapRef.current.setView([bestATM.lat, bestATM.lng], 14);
    }

    showSuccessToast('Recommendations Ready!', `Found ${recommendations.length} personalized ATM recommendations for you.`);
  };

  // NEW: Clear recommendations
  const clearRecommendations = () => {
    setRecommendedATMs([]);
    setShowingRecommendations(false);
    showSuccessToast('Recommendations Cleared', 'Showing all ATMs again.');
  };

  // Get API base URL
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    const options = {
      enableHighAccuracy: false, // Changed to false for better compatibility
      timeout: 15000, // Increased timeout to 15 seconds
      maximumAge: 300000 // Accept cached location up to 5 minutes old
    };

    const handleSuccess = (position) => {
      try {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Validate coordinates before setting
        if (!latitude || !longitude || 
            isNaN(latitude) || isNaN(longitude) ||
            !isFinite(latitude) || !isFinite(longitude) ||
            Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          console.error('Invalid coordinates from geolocation:', { latitude, longitude });
          setLocationError('Invalid location coordinates received');
          return;
        }

        console.log('Location received:', { latitude, longitude, accuracy });
        
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationAccuracy(accuracy && accuracy < 50000 ? accuracy : null); // Cap accuracy at 50km
        setLocationError(null);
        setLocationTracking(true);
      } catch (error) {
        console.error('Error processing location:', error);
        setLocationError('Error processing location data');
      }
    };

    const handleError = (error) => {
      console.error('Location error:', error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError('Location access denied by user');
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError('Location information unavailable');
          break;
        case error.TIMEOUT:
          setLocationError('Location request timed out');
          break;
        default:
          setLocationError('An unknown location error occurred');
          break;
      }
      setLocationTracking(false);

      // Fallback to Kingston, Jamaica for testing
      console.log('Using fallback location: Kingston, Jamaica');
      setUserLocation({ lat: 17.9970, lng: -76.7936 }); // Kingston, Jamaica
      setLocationAccuracy(null);
      setLocationError('Using approximate location (Kingston, JM)');
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position for updates
    locationWatchRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { ...options, maximumAge: 30000 }
    );
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    setLocationTracking(false);
  };

  // Fetch user preferences
  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.log('No token available for preferences fetch');
        return;
      }

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const preferences = await response.json();
        setUserPreferences(preferences);
        console.log('User preferences loaded:', preferences);
      } else {
        console.warn('Failed to fetch preferences:', response.status, response.statusText);
      }
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
    }
  };

  // Fetch ATM data
  const fetchATMs = async (usePreferences = false) => {
    try {
      setLoading(filteredATMs.length === 0);
      
      const apiBaseUrl = getApiBaseUrl();
      let url = `${apiBaseUrl}/api/atms`;
      const headers = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('jwtToken');

      // Use filtered endpoint if preferences are available and requested
      if (usePreferences && token && userLocation) {
        url = `${apiBaseUrl}/api/atms/filtered?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        headers['Authorization'] = `Bearer ${token}`;
      } else if (usePreferences && token) {
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

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchATMs(activeFilter === 'USER_PREFERENCES');
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Filter ATMs based on active filter - UPDATED to handle recommendations
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

    // NEW: Handle recommendation display
    if (showingRecommendations && recommendedATMs.length > 0) {
      // Show only recommended ATMs when in recommendation mode
      const recommendedIds = new Set(recommendedATMs.map(atm => atm.id));
      filtered = filtered.filter(atm => recommendedIds.has(atm.id));
      
      // Merge recommendation data
      filtered = filtered.map(atm => {
        const recommendedData = recommendedATMs.find(rec => rec.id === atm.id);
        return recommendedData ? { ...atm, ...recommendedData } : atm;
      });
    } else {
      // Your existing filter logic
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
    }

    setFilteredATMs(filtered);
  }, [atms, userLocation, activeFilter, recommendedATMs, showingRecommendations]);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const L = await loadLeaflet();
        leafletRef.current = L;
        
        if (!mapRef.current || leafletMapRef.current) {
          console.log('Map ref not available or map already initialized');
          return;
        }

        console.log('Initializing Leaflet map...');
        
        const map = L.map(mapRef.current, {
          center: [ST_ANDREW_CENTER.lat, ST_ANDREW_CENTER.lng],
          zoom: 10,
          zoomControl: false,
          preferCanvas: true,
          worldCopyJump: true,
          maxBounds: [
            [17.0, -79.0],  // Southwest corner of Jamaica bounds
            [19.0, -75.0]   // Northeast corner of Jamaica bounds
          ],
          maxBoundsViscosity: 0.5
        });
        
        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        });
        
        tileLayer.addTo(map);
        
        // Store map reference
        leafletMapRef.current = map;
        
        // Wait for map to be ready
        map.whenReady(() => {
          console.log('Map is ready and loaded');
          setMapLoaded(true);
        });

        // Add event listeners
        map.on('load', () => {
          console.log('Map load event fired');
        });

        map.on('viewreset', () => {
          console.log('Map view reset');
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        
        // Retry after delay
        setTimeout(() => {
          if (!leafletMapRef.current && mapRef.current) {
            console.log('Retrying map initialization...');
            initializeMap();
          }
        }, 2000);
      }
    };

    initializeMap();

    return () => {
      if (leafletMapRef.current) {
        try {
          console.log('Cleaning up map...');
          leafletMapRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        leafletMapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []); // Empty dependency array - only run once

  // Start location tracking and fetch preferences when component mounts
  useEffect(() => {
    const initializeData = async () => {
      console.log('Initializing location tracking and preferences...');
      
      // Start location tracking
      startLocationTracking();
      
      // Wait a bit for auth to be established, then fetch preferences
      setTimeout(async () => {
        await fetchUserPreferences();
      }, 1000);
    };

    initializeData();
    
    return () => {
      console.log('Cleaning up location tracking...');
      stopLocationTracking();
    };
  }, []);

  // Fetch ATM data on component mount
  useEffect(() => {
    const fetchData = async () => {
      console.log('Location changed, fetching ATM data...', userLocation);
      
      if (userLocation) {
        await fetchATMs(true);
      }
      
      // Always fetch base ATM data
      await fetchATMs(activeFilter === 'USER_PREFERENCES');
    };
    
    fetchData();
    
    const interval = setInterval(() => {
      fetchATMs(activeFilter === 'USER_PREFERENCES');
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userLocation, activeFilter]);

  // Update user location marker
  useEffect(() => {
    // Only proceed if we have all required dependencies
    if (!leafletMapRef.current || !leafletRef.current || !userLocation || !mapLoaded) {
      console.log('Skipping user marker update - missing dependencies:', {
        map: !!leafletMapRef.current,
        leaflet: !!leafletRef.current, 
        location: !!userLocation,
        mapLoaded
      });
      return;
    }

    const L = leafletRef.current;
    const map = leafletMapRef.current;

    // Wait for map to be fully loaded
    if (!map._loaded || !map._container) {
      console.log('Map not ready, waiting...');
      const checkMapReady = () => {
        if (map._loaded && map._container) {
          updateUserLocationMarker();
        } else {
          setTimeout(checkMapReady, 100);
        }
      };
      checkMapReady();
      return;
    }

    // Map is ready, update marker
    updateUserLocationMarker();

    function updateUserLocationMarker() {
      try {
        // Ensure map is fully loaded and ready
        if (!map._loaded || !map._container) {
          console.warn('Map not ready for marker update');
          return;
        }

        // Remove existing user marker and accuracy circle safely
        try {
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
            userMarkerRef.current = null;
          }
        } catch (e) {
          console.warn('Error removing user marker:', e);
        }

        try {
          if (accuracyCircleRef.current) {
            map.removeLayer(accuracyCircleRef.current);
            accuracyCircleRef.current = null;
          }
        } catch (e) {
          console.warn('Error removing accuracy circle:', e);
        }

        // Enhanced coordinate validation
        const lat = parseFloat(userLocation.lat);
        const lng = parseFloat(userLocation.lng);
        
        if (!lat || !lng || 
            isNaN(lat) || isNaN(lng) ||
            !isFinite(lat) || !isFinite(lng) ||
            Math.abs(lat) > 90 || Math.abs(lng) > 180 ||
            lat === 0 || lng === 0) {
          console.warn('Invalid user location coordinates:', { lat, lng, original: userLocation });
          return;
        }

        console.log('Creating user marker at:', { lat, lng });

        // Create user icon
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              width: 20px; 
              height: 20px; 
              background: #3B82F6; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ${locationTracking ? 'animation: pulse 2s infinite;' : ''}
            "></div>
            <style>
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        // Create and add user marker first
        try {
          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon });
          
          // Create popup content
          const popupContent = `
            <div style="text-align: center; font-family: system-ui, -apple-system, sans-serif;">
              <strong style="color: #1F2937;">Your Location</strong><br>
              ${locationTracking ? '📍 Live tracking active' : '📍 Static location'}<br>
              ${locationAccuracy ? `Accuracy: ±${Math.round(locationAccuracy)}m` : ''}
            </div>
          `;
          
          userMarkerRef.current.bindPopup(popupContent);
          userMarkerRef.current.addTo(map);
          
          console.log('User marker added successfully');
        } catch (markerError) {
          console.error('Error creating user marker:', markerError);
          return;
        }

        // Add accuracy circle if available - with extra validation
        if (locationAccuracy && 
            typeof locationAccuracy === 'number' && 
            locationAccuracy > 0 && 
            locationAccuracy < 10000 && // Max 10km accuracy
            isFinite(locationAccuracy)) {
          
          try {
            console.log('Creating accuracy circle with radius:', locationAccuracy);
            
            accuracyCircleRef.current = L.circle([lat, lng], {
              radius: locationAccuracy,
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              color: '#3B82F6',
              opacity: 0.3,
              weight: 1
            });
            
            // Add to map only after creation succeeds
            accuracyCircleRef.current.addTo(map);
            console.log('Accuracy circle added successfully');
            
          } catch (circleError) {
            console.error('Error creating accuracy circle:', circleError);
            // Continue without accuracy circle
            accuracyCircleRef.current = null;
          }
        }

        // Center map on location with better error handling
        try {
          const mapCenter = map.getCenter();
          if (mapCenter && mapCenter.lat && mapCenter.lng) {
            const distanceFromCenter = calculateDistance(
              mapCenter.lat, mapCenter.lng, 
              lat, lng
            );
            
            // Only move map if user is far from current view
            if (distanceFromCenter > 5) {
              map.setView([lat, lng], 13);
            }
          } else {
            // First time or invalid map center
            map.setView([lat, lng], 13);
          }
        } catch (viewError) {
          console.warn('Error setting map view:', viewError);
          // Try simpler setView without distance calculation
          try {
            map.setView([lat, lng], 13);
          } catch (simpleViewError) {
            console.error('Failed to set map view:', simpleViewError);
          }
        }

      } catch (error) {
        console.error('Error updating user location marker:', error);
      }
    }
  }, [userLocation, mapLoaded, locationTracking, locationAccuracy]);

  // Update ATM markers on map - MODIFIED to highlight recommendations
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRef.current || !mapLoaded) return;

    const L = leafletRef.current;
    const map = leafletMapRef.current;

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
            // NEW: Different styling for recommended ATMs
            const isRecommended = atm.isRecommended;
            const color = !atm.functional ? '#EF4444' : atm.lowOnCash ? '#F59E0B' : BANKS[atm.bank]?.color || '#6B7280';
            
            const iconHtml = isRecommended 
              ? `<div style="
                   width: 32px; 
                   height: 32px; 
                   background: linear-gradient(135deg, #fbbf24, #f59e0b); 
                   border: 3px solid white; 
                   border-radius: 50%; 
                   display: flex; 
                   align-items: center; 
                   justify-content: center;
                   box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                   cursor: pointer;
                   font-size: 14px;
                   animation: pulse 2s infinite;
                 ">⭐</div>
                 <style>
                   @keyframes pulse {
                     0%, 100% { transform: scale(1); }
                     50% { transform: scale(1.1); }
                   }
                 </style>`
              : `<div style="
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
                   font-size: 14px;
                   ${atm.geocodingFailed ? 'opacity: 0.5;' : ''}
                 ">💳</div>`;
            
            const atmIcon = L.divIcon({
              className: 'custom-div-icon',
              html: iconHtml,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            const marker = L.marker([atm.lat, atm.lng], { icon: atmIcon })
              .addTo(map);

            marker.on('click', () => {
              setSelectedATM(atm);
            });

            markersRef.current.push(marker);

          } catch (error) {
            console.error('Error creating ATM marker:', error);
          }
        });
      } catch (error) {
        console.error('Error updating ATM markers:', error);
      }
    }
  }, [filteredATMs, mapLoaded]);

  // Filter button component
  const FilterButton = ({ filter, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-800 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  // ATM Details Modal
  const ATMDetails = ({ atm, onClose }) => {
    if (!atm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[10000] p-4">
        <div className="bg-white rounded-t-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: BANKS[atm.bank]?.color || '#6B7280' }}
              />
              <h2 className="text-lg font-bold text-gray-800">
                {atm.bankName || `${atm.bank} Bank`}
              </h2>
              {atm.isRecommended && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  ⭐ Recommended
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto">
            {/* Location */}
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">{atm.address}</p>
                <p className="text-sm text-gray-600">{atm.parish}</p>
              </div>
            </div>

            {/* Status and metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {atm.distance && (
                    <>
                      <Navigation className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Distance</span>
                    </>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {atm.distance ? `${atm.distance.toFixed(1)} km` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Withdrawal Fee</span>
                </div>
                <p className="text-lg font-bold text-gray-800">J${atm.withdrawalFee}</p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                {atm.functional ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${atm.functional ? 'text-green-700' : 'text-red-700'}`}>
                  {atm.functional ? 'ATM is functional' : 'ATM may not be working'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {atm.lowOnCash ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <span className={`font-medium ${atm.lowOnCash ? 'text-yellow-700' : 'text-green-700'}`}>
                  {atm.lowOnCash ? 'Low on cash' : 'Cash available'}
                </span>
              </div>
            </div>

            {/* NEW: Recommendation details */}
            {atm.isRecommended && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Why this ATM was recommended:
                </h3>
                {atm.reasons && atm.reasons.length > 0 && (
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {atm.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
                {atm.recommendationScore && (
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <span className="text-xs text-yellow-600">
                      Recommendation Score: {(atm.recommendationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Additional info */}
            <div className="text-xs text-gray-500 border-t pt-3">
              <p>Type: {atm.type || 'ATM'}</p>
              <p>Currency: {atm.supportsCurrency || 'JMD'}</p>
              {atm.lastUpdated && (
                <p>Last updated: {new Date(atm.lastUpdated).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Preference Summary Component
  const PreferenceSummary = () => {
    if (!userPreferences || !showPreferenceSummary) return null;

    const { preferred_banks, transaction_types, max_radius_km, preferred_currency } = userPreferences;

    return (
      <div className="absolute top-16 left-4 z-[1000] max-w-sm">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800 text-sm">Your Preferences</h3>
            <button
              onClick={() => setShowPreferenceSummary(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Banks:</strong> {Array.isArray(preferred_banks) ? preferred_banks.join(', ') : preferred_banks}</p>
            <p><strong>Transactions:</strong> {Array.isArray(transaction_types) ? transaction_types.join(', ') : transaction_types}</p>
            <p><strong>Max Distance:</strong> {max_radius_km}km</p>
            <p><strong>Currency:</strong> {preferred_currency}</p>
          </div>
        </div>
      </div>
    );
  };

  // Loading screen for location
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Neighbourhood</h1>
            <p className="text-sm text-gray-600">Find ATMs near you</p>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW: Recommendation Button */}
            <RecommendationButton
              userLocation={userLocation}
              onRecommendationsReceived={handleRecommendationsReceived}
              isAuthenticated={isAuthenticated}
            />
            
            {/* NEW: Clear Recommendations Button */}
            {showingRecommendations && (
              <button
                onClick={clearRecommendations}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
            
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user?.FirstName || userEmail?.split('@')[0] || 'User'}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48 py-2 z-[1001]">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.FirstName && user?.LastName 
                        ? `${user.FirstName} ${user.LastName}` 
                        : userEmail?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{userEmail || user?.Email}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">Last updated: {lastUpdated}</p>
        )}
        {error && atms.length > 0 && (
          <p className="text-xs text-yellow-600 mt-1">Warning: Using cached data - {error}</p>
        )}
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
                    setFilterOpen(false);
                  }}
                />
                
                <FilterButton
                  filter="ALL"
                  label="All ATMs"
                  isActive={activeFilter === 'ALL'}
                  onClick={() => {
                    setActiveFilter('ALL');
                    fetchATMs(false);
                    setFilterOpen(false);
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
                        setFilterOpen(false);
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
                    onClick={() => {
                      setActiveFilter('LOWEST_FEES');
                      setFilterOpen(false);
                    }}
                  />
                  <FilterButton
                    filter="SHORTEST_DISTANCE"
                    label="Closest to Me"
                    isActive={activeFilter === 'SHORTEST_DISTANCE'}
                    onClick={() => {
                      setActiveFilter('SHORTEST_DISTANCE');
                      setFilterOpen(false);
                    }}
                  />
                  <FilterButton
                    filter="ABM_ONLY"
                    label="ABM Only"
                    isActive={activeFilter === 'ABM_ONLY'}
                    onClick={() => {
                      setActiveFilter('ABM_ONLY');
                      setFilterOpen(false);
                    }}
                  />
                  <FilterButton
                    filter="USD_ONLY"
                    label="US Currency Only"
                    isActive={activeFilter === 'USD_ONLY'}
                    onClick={() => {
                      setActiveFilter('USD_ONLY');
                      setFilterOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count - positioned at bottom left */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200 z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            {filteredATMs.length} ATMs {
              showingRecommendations 
                ? 'recommended' 
                : activeFilter === 'USER_PREFERENCES' 
                ? 'matched' 
                : 'found'
            }
          </span>
          {showingRecommendations && (
            <div className="text-xs text-blue-600 mt-1">
              ⭐ Showing recommendations
            </div>
          )}
        </div>

        {/* User Preference Summary */}
        <PreferenceSummary />

        {/* Leaflet Map */}
        <div 
          ref={mapRef}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>

      {/* ATM Details Modal */}
      {selectedATM && (
        <ATMDetails
          atm={selectedATM}
          onClose={() => setSelectedATM(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-[10000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ATMs...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg z-[1000]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading ATM data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;