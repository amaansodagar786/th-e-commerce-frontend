// UserReviews.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    MdStar,
    MdStarBorder,
    MdEdit,
    MdDelete,
    MdShoppingBag,
    MdRefresh,
    MdArrowBack,
    MdVerified,
    MdPending,
    MdThumbUp,
    MdClose,
    MdRateReview,
} from 'react-icons/md';
import './UserReviews.scss';

const UserReviews = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [reviewData, setReviewData] = useState({
        rating: 0,
        reviewText: '',
        hoverRating: 0
    });
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // Fetch user reviews
    const fetchUserReviews = async () => {
        if (!token || !userId) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/reviews/user/${userId}?${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setReviews(response.data.reviews || []);
                setPagination(response.data.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 1
                });
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('❌ Error fetching reviews:', error);
            setError('Failed to load your reviews. Please try again.');
            toast.error('Failed to load your reviews');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserReviews();
    }, [pagination.page]);

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Open edit modal
    const handleOpenEditModal = (review) => {
        console.log('Opening edit modal for review:', review);
        setSelectedReview(review);
        setReviewData({
            rating: review.rating,
            reviewText: review.reviewText || '',
            hoverRating: review.rating
        });
        setShowEditModal(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    // Close edit modal
    const handleCloseEditModal = () => {
        if (submitting) return;
        setShowEditModal(false);
        setSelectedReview(null);
        setReviewData({ rating: 0, reviewText: '', hoverRating: 0 });
        // Restore body scroll
        document.body.style.overflow = 'auto';
    };

    // Handle star hover
    const handleStarHover = (rating) => {
        setReviewData(prev => ({ ...prev, hoverRating: rating }));
    };

    // Handle star click
    const handleStarClick = (rating) => {
        setReviewData(prev => ({ ...prev, rating }));
    };

    // Update review
    const handleUpdateReview = async () => {
        if (!reviewData.rating || !selectedReview) {
            toast.warning('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/reviews/update/${selectedReview.reviewId}`,
                {
                    userId,
                    rating: reviewData.rating,
                    reviewText: reviewData.reviewText.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('✅ Review updated successfully!');
                handleCloseEditModal();

                // Update the reviews list
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review.reviewId === selectedReview.reviewId
                            ? {
                                ...review,
                                rating: reviewData.rating,
                                reviewText: reviewData.reviewText.trim(),
                                updatedAt: new Date()
                            }
                            : review
                    )
                );
            }
        } catch (error) {
            console.error('❌ Error updating review:', error);
            toast.error(error.response?.data?.message || 'Failed to update review');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete review
    const handleDeleteReview = async (reviewId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this review?');
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/reviews/${reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { userId }
                }
            );

            if (response.data.success) {
                toast.success('✅ Review deleted successfully!');

                // Remove from reviews list
                setReviews(prevReviews =>
                    prevReviews.filter(review => review.reviewId !== reviewId)
                );

                // Update pagination total
                setPagination(prev => ({
                    ...prev,
                    total: prev.total - 1
                }));
            }
        } catch (error) {
            console.error('❌ Error deleting review:', error);
            toast.error(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // View product page
    const handleViewProduct = (productId) => {
        navigate(`/product/${productId}`);
    };

    // Render stars for rating display
    const renderRatingStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
                    {i <= rating ? <MdStar /> : <MdStarBorder />}
                </span>
            );
        }
        return stars;
    };

    // Render stars for editing
    const renderEditStars = () => {
        const stars = [];
        const displayRating = reviewData.hoverRating || reviewData.rating;

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    className={`star-btn ${i <= displayRating ? 'active' : ''}`}
                    onClick={() => handleStarClick(i)}
                    onMouseEnter={() => handleStarHover(i)}
                    onMouseLeave={() => handleStarHover(0)}
                    disabled={submitting}
                >
                    {i <= displayRating ? <MdStar /> : <MdStarBorder />}
                </button>
            );
        }
        return stars;
    };

    // Render review card
    const renderReviewCard = (review) => (
        <div key={review._id || review.reviewId} className="review-card">
            <div className="review-card__header">
                <div className="product-info">
                    <h3
                        className="product-name"
                        onClick={() => handleViewProduct(review.productId)}
                    >
                        {review.productName}
                    </h3>
                    <div className="product-variants">
                        {review.modelName !== "Default" && (
                            <span className="variant-chip">{review.modelName}</span>
                        )}
                        <span className="variant-chip">{review.colorName}</span>
                        {review.size && (
                            <span className="variant-chip">Size: {review.size}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="review-card__body">
                <div className="review-rating">
                    {renderRatingStars(review.rating)}
                    <span className="rating-value">{review.rating}/5</span>
                </div>

                <div className="review-date">
                    Reviewed on {formatDate(review.createdAt)}
                    {review.updatedAt && review.updatedAt !== review.createdAt && (
                        <span className="updated-date">
                            (Updated on {formatDate(review.updatedAt)})
                        </span>
                    )}
                </div>

                <div className="review-content">
                    {review.reviewText ? (
                        <p className="review-text">"{review.reviewText}"</p>
                    ) : (
                        <p className="no-text-review">No review text provided</p>
                    )}
                </div>
            </div>

            <div className="review-card__footer">
                <div className="review-status">
                    <span className={`status-badge ${review.isVerifiedPurchase ? 'verified' : 'unverified'}`}>
                        {review.isVerifiedPurchase ? <MdVerified /> : '❌'} Verified Purchase
                    </span>
                    <span className={`status-badge ${review.isApproved ? 'approved' : 'pending'}`}>
                        {review.isApproved ? <MdVerified /> : <MdPending />}
                        {review.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                    {review.helpfulCount > 0 && (
                        <span className="helpful-count">
                            <MdThumbUp /> {review.helpfulCount} people found this helpful
                        </span>
                    )}
                </div>

                <div className="review-actions">
                    <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEditModal(review)}
                    >
                        <MdEdit /> Edit Review
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteReview(review.reviewId)}
                    >
                        <MdDelete /> Delete Review
                    </button>
                    <button
                        className="action-btn view-order-btn"
                        onClick={() => navigate(`/orders`)}
                    >
                        <MdShoppingBag /> View Order
                    </button>
                </div>
            </div>
        </div>
    );

    // Render edit modal - FIXED VERSION
    const renderEditModal = () => {
        if (!showEditModal || !selectedReview) return null;

        return (
            <div className="edit-review-modal" onClick={(e) => {
                // Close modal when clicking the backdrop
                if (e.target === e.currentTarget && !submitting) {
                    handleCloseEditModal();
                }
            }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>Edit Your Review</h2>
                        <button
                            className="close-btn"
                            onClick={handleCloseEditModal}
                            disabled={submitting}
                        >
                            <MdClose />
                        </button>
                    </div>

                    <div className="review-product-info">
                        <h3>{selectedReview?.productName}</h3>
                        <div className="product-variants">
                            {selectedReview?.modelName !== "Default" && (
                                <span className="variant-chip">{selectedReview?.modelName}</span>
                            )}
                            <span className="variant-chip">{selectedReview?.colorName}</span>
                            {selectedReview?.size && (
                                <span className="variant-chip">Size: {selectedReview?.size}</span>
                            )}
                        </div>
                        <p className="order-info">Order #{selectedReview?.orderId}</p>
                    </div>

                    <div className="edit-review-form">
                        <div className="rating-section">
                            <label>Your Rating *</label>
                            <div className="star-rating">
                                {renderEditStars()}
                                <span className="rating-text">
                                    {reviewData.rating > 0 ? `${reviewData.rating} star${reviewData.rating > 1 ? 's' : ''}` : 'Select rating'}
                                </span>
                            </div>
                        </div>

                        <div className="review-text-section">
                            <label>Your Review (Optional)</label>
                            <textarea
                                className="review-textarea"
                                placeholder="Share your experience with this product..."
                                value={reviewData.reviewText}
                                onChange={(e) => setReviewData(prev => ({ ...prev, reviewText: e.target.value }))}
                                rows={5}
                                maxLength={1000}
                                disabled={submitting}
                            />
                            <div className="char-count">
                                {reviewData.reviewText.length}/1000 characters
                            </div>
                        </div>

                        <div className="edit-note">
                            <p>✏️ Editing your review will update it for all users to see</p>
                            <p>✅ This review is from a verified purchase</p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn-cancel"
                            onClick={handleCloseEditModal}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-submit"
                            onClick={handleUpdateReview}
                            disabled={submitting || reviewData.rating === 0}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-small"></span> Updating...
                                </>
                            ) : (
                                'Update Review'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render empty state
    const renderEmptyState = () => (
        <div className="empty-reviews">
            <div className="empty-icon">
                <MdRateReview />
            </div>
            <h2>No reviews yet</h2>
            <p>You haven't written any reviews yet. Reviews you write will appear here.</p>
            <div className="empty-actions">
                <button
                    className="btn-primary"
                    onClick={() => navigate('/orders')}
                >
                    View My Orders
                </button>
                <button
                    className="btn-secondary"
                    onClick={() => navigate('/products')}
                >
                    Browse Products
                </button>
            </div>
        </div>
    );

    // Render loading state
    const renderLoading = () => (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your reviews...</p>
        </div>
    );

    // Render error state
    const renderError = () => (
        <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Unable to load reviews</h2>
            <p>{error}</p>
            <button
                className="retry-btn"
                onClick={fetchUserReviews}
            >
                Retry
            </button>
        </div>
    );

    if (!token || !userId) {
        return (
            <div className="login-required">
                <h2>Login Required</h2>
                <p>Please login to view your reviews.</p>
                <button onClick={() => navigate('/login')} className="auth-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    if (loading) return renderLoading();
    if (error) return renderError();

    return (
        <div className="user-reviews-container">
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="light"
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
            />

            {/* Header */}
            <div className="reviews-header">
                <h1>My Reviews</h1>
                <div className="reviews-summary">
                    <div className="summary-card">
                        <span className="summary-value">{pagination.total}</span>
                        <span className="summary-label">Total Reviews</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-value">
                            {reviews.filter(r => r.isVerifiedPurchase).length}
                        </span>
                        <span className="summary-label">Verified</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-value">
                            {reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : '0.0'
                            }
                        </span>
                        <span className="summary-label">Avg Rating</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="reviews-nav">
                <Link to="/orders" className="nav-link">
                    <MdArrowBack /> Back to My Orders
                </Link>
                <div className="nav-actions">
                    <button
                        className="refresh-btn"
                        onClick={fetchUserReviews}
                        disabled={loading}
                    >
                        <MdRefresh /> Refresh
                    </button>
                </div>
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        {reviews.map(renderReviewCard)}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    className="page-btn"
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal - Fixed */}
            {renderEditModal()}
        </div>
    );
};

export default UserReviews;