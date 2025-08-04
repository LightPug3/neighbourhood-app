// RecommendationButton.jsx - React component for ATM recommendations
import React, { useState } from 'react';
import { Target, Star, MapPin, Clock, DollarSign, Navigation, X, Info } from 'lucide-react';

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
    if (!isAuthenticated) {
      setError("Please log in to get personalized recommendations");
      return;
    }

    if (!userLocation?.lat || !userLocation?.lng) {
      setError("Location access is required for recommendations");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
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
    const { atm_data, recommendation_score, distance_km, estimated_wait_people, reasons, score_breakdown } = recommendation;
    
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
        disabled={isLoading || !isAuthenticated || !userLocation?.lat}
        className={`
          ${className}
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-medium transition-all duration-200
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
            Getting recommendations...
          </>
        ) : (
          <>
            <Target className="w-4 h-4" />
            Recommend ATMs
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

export default RecommendationButton;