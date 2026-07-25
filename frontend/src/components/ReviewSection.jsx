import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { reviewAPI, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StarRating from "./StarRating";

export default function ReviewSection({ productId, onRatingUpdate }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    avg_rating: 0,
    total_reviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("recent");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewAPI.getReviews(productId, { page, per_page: 5, sort_by: sortBy });
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
        setStats({
          avg_rating: res.data.avg_rating || 0,
          total_reviews: res.data.total_reviews || 0,
          distribution: res.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
        setTotalPages(res.data.pagination?.total_pages || 1);
        if (onRatingUpdate) {
          onRatingUpdate(res.data.avg_rating, res.data.total_reviews);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, page, sortBy]);

  const handleOpenWriteModal = () => {
    if (!user) {
      toast.error("Please sign in to write a review.");
      return;
    }
    const myExisting = reviews.find((r) => r.user_id === user.id);
    if (myExisting) {
      setEditingReview(myExisting);
      setRatingInput(myExisting.rating);
      setCommentInput(myExisting.comment);
    } else {
      setEditingReview(null);
      setRatingInput(5);
      setCommentInput("");
    }
    setShowModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!ratingInput) {
      toast.error("Please select a star rating.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingReview) {
        const res = await reviewAPI.updateReview(editingReview.id, {
          rating: ratingInput,
          comment: commentInput,
        });
        if (res.success) {
          toast.success("Review updated successfully!");
        }
      } else {
        const res = await reviewAPI.createReview(productId, {
          rating: ratingInput,
          comment: commentInput,
        });
        if (res.success) {
          toast.success("Review submitted! Thank you for your feedback.");
        }
      }
      setShowModal(false);
      fetchReviews();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await reviewAPI.deleteReview(reviewId);
      if (res.success) {
        toast.success("Review deleted.");
        fetchReviews();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error("Please sign in to vote.");
      return;
    }
    try {
      const res = await reviewAPI.markHelpful(reviewId);
      if (res.success) {
        toast.success("Marked as helpful!");
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
          )
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Reviews & Ratings</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real feedback from verified purchasers
          </p>
        </div>
        <button
          onClick={handleOpenWriteModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition cursor-pointer"
        >
          Write a Review
        </button>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Rating Score */}
        <div className="flex flex-col items-center justify-center text-center lg:border-r border-slate-200 pr-0 lg:pr-6">
          <span className="text-5xl font-extrabold text-slate-900">
            {stats.avg_rating.toFixed(1)}
          </span>
          <div className="my-2">
            <StarRating rating={stats.avg_rating} size="md" />
          </div>
          <span className="text-sm font-medium text-slate-500">
            Based on {stats.total_reviews} {stats.total_reviews === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="lg:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs text-slate-600">
                <span className="w-12 font-medium flex items-center gap-1">
                  {star} <span className="text-amber-400">★</span>
                </span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">
          Reviews ({stats.total_reviews})
        </h3>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-reviews" className="text-xs text-slate-500 font-medium">Sort by:</label>
          <select
            id="sort-reviews"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse bg-slate-100 h-28 rounded-xl p-4" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No reviews yet for this product.</p>
          <p className="text-xs text-slate-400 mt-1">Be the first verified customer to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwner = user && user.id === review.user_id;
            const canDelete = isOwner || (user && (user.role === "admin" || user.role === "seller"));

            return (
              <div
                key={review.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {review.user_name ? review.user_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {review.user_name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-full">
                          ✓ Verified Purchase
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size="xs" />
                        <span className="text-xs text-slate-400">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-xs text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Delete review"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {review.comment && (
                  <p className="mt-3 text-slate-700 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
                  >
                    <span>👍 Helpful ({review.helpful_count})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Write / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingReview ? "Edit Your Review" : "Write a Review"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Rating
                </label>
                <StarRating
                  rating={ratingInput}
                  size="lg"
                  interactive={true}
                  onChange={(val) => setRatingInput(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Feedback (Optional)
                </label>
                <textarea
                  rows={4}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
