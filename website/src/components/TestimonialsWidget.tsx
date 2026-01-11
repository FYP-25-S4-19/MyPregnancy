import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../lib/api';
import { Star, ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';

interface Feedback {
  id: number;
  author_id: string;
  rating: number;
  content: string;
}

interface TestimonialsWidgetProps {
  minRating?: number;
  maxRating?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  showStats?: boolean;
  autoRotate?: boolean;
  rotateInterval?: number;
}

interface FeedbackStats {
  total_count: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
}

export const TestimonialsWidget: React.FC<TestimonialsWidgetProps> = ({
  minRating = 4,
  maxRating = 5,
  limit = 10,
  sortBy = 'highest',
  showStats = true,
  autoRotate = true,
  rotateInterval = 5000,
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, [minRating, maxRating, limit, sortBy]);

  useEffect(() => {
    if (!autoRotate || feedbacks.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, feedbacks.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [feedbackRes, statsRes] = await Promise.all([
        feedbackAPI.getAllFeedback({
          min_rating: minRating,
          max_rating: maxRating,
          sort_by: sortBy,
          limit,
        }),
        feedbackAPI.getStats(),
      ]);

      setFeedbacks(feedbackRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load testimonials');
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? feedbacks.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-8 flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-pink-500" />
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-8">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-8 text-center">
        <p className="text-gray-600">No testimonials available yet.</p>
      </div>
    );
  }

  const currentFeedback = feedbacks[currentIndex];

  return (
    <div className="space-y-8 max-w-5xl mx-auto min-h-[60vh] flex flex-col justify-center">
      {/* Statistics Section */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-pink-600">{stats.total_count}</p>
            <p className="text-gray-600 text-sm">Total Reviews</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-3xl font-bold text-yellow-500">{stats.average_rating}</p>
              <Star size={24} className="fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-gray-600 text-sm">Average Rating</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats.rating_distribution[5] || 0}
            </p>
            <p className="text-gray-600 text-sm">5-Star Reviews</p>
          </div>
        </div>
      )}

      {/* Carousel Section */}
      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-8 md:p-12">
        <div className="relative max-w-3xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 min-h-80 flex flex-col justify-between">
            {/* Stars and Rating */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">{renderStars(currentFeedback.rating)}</div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                {currentFeedback.rating}.0/5.0
              </span>
            </div>

            {/* Feedback Content */}
            <p className="text-lg text-gray-700 leading-relaxed flex-1 mb-6 italic">
              "{currentFeedback.content}"
            </p>

            {/* User Info */}
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900">
                User ID: {currentFeedback.author_id.substring(0, 12)}...
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-12 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {feedbacks.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-pink-500 w-8'
                  : 'bg-gray-300 w-2 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="text-center text-sm text-gray-600">
        Showing {currentIndex + 1} of {feedbacks.length} testimonials
      </div>
    </div>
  );
};

export default TestimonialsWidget;
