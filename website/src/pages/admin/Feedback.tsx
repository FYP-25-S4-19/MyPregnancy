import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../../lib/api';
import { Star, Loader, AlertCircle, X } from 'lucide-react';

interface Feedback {
  id: number;
  author_id: string;
  rating: number;
  content: string;
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await feedbackAPI.getAllFeedback();
      setFeedbacks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load feedback');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const filteredFeedbacks = selectedRating 
    ? feedbacks.filter(feedback => feedback.rating === selectedRating)
    : feedbacks;

  const getRatingStats = () => {
    const stats: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(feedback => {
      if (stats[feedback.rating] !== undefined) {
        stats[feedback.rating]++;
      }
    });
    return stats;
  };

  const ratingStats = getRatingStats();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-blue-500" />
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback</h1>
       <br></br>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Rating Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-700 mr-2">Filter by Rating:</span>
        <button
          onClick={() => setSelectedRating(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRating === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setSelectedRating(rating)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedRating === rating
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Star size={16} className={selectedRating === rating ? 'fill-current' : 'fill-current'} />
            {rating} ★ ({ratingStats[rating]})
          </button>
        ))}
      </div>
      <br></br>

      {feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No feedback available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No feedback with {selectedRating} star rating.</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(feedback.rating)}
                      <span className="text-sm text-gray-500">
                        User: {feedback.author_id.substring(0, 8)}...
                      </span>
                    </div>
                    <p className="text-gray-800 leading-relaxed">{feedback.content}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded">
                      Rating: {feedback.rating}/5
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <p className="text-sm text-gray-600 mt-6 pt-4 border-t">
            Showing {filteredFeedbacks.length} of {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
            {selectedRating && ` (${selectedRating} stars)`}
          </p>
        </div>
      )}
    </div>
  );
}
