import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserOrders.scss';

// ─── Helpers ─────────────────────────────────────────────────────────────
const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

const formatCurrency = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const getDeliveryDate = (orderDate) => {
    if (!orderDate) return 'N/A';
    const d = new Date(orderDate);
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

// ─── Status config ──────────────────────────────────────────────────────
const STATUS_CFG = {
    pending: { label: 'Pending', emoji: '⏳', cls: 'pending' },
    processing: { label: 'Processing', emoji: '🔄', cls: 'processing' },
    shipped: { label: 'Shipped', emoji: '🚚', cls: 'shipped' },
    delivered: { label: 'Delivered', emoji: '✅', cls: 'delivered' },
    cancelled: { label: 'Cancelled', emoji: '❌', cls: 'cancelled' },
    returned: { label: 'Returned', emoji: '↩️', cls: 'returned' },
};

// ─── Star Rating component ──────────────────────────────────────────────
const StarRating = ({ rating, hoverRating, onHover, onClick, disabled }) => (
    <div className="uo-stars">
        {[1, 2, 3, 4, 5].map((i) => (
            <button
                key={i}
                type="button"
                className={`uo-star ${i <= (hoverRating || rating) ? 'on' : ''}`}
                onClick={() => onClick(i)}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(0)}
                disabled={disabled}
            >
                {i <= (hoverRating || rating) ? '★' : '☆'}
            </button>
        ))}
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────
const UserOrders = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'User';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0, pendingOrders: 0, deliveredOrders: 0,
        cancelledOrders: 0, totalSpent: 0, averageOrderValue: 0,
    });
    const [filters, setFilters] = useState({ status: 'all', page: 1, limit: 10 });

    // Order details modal
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Review modal
    const [showReview, setShowReview] = useState(false);
    const [reviewProduct, setReviewProduct] = useState(null);
    const [reviewOrder, setReviewOrder] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 0, reviewText: '', hoverRating: 0 });

    // Cancel confirm modal
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // ── API calls ───────────────────────────────────────────────────────
    const fetchUserOrders = async () => {
        if (!token || !userId) {
            navigate('/login');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const qs = new URLSearchParams({
                page: filters.page,
                limit: filters.limit,
                status: filters.status,
            }).toString();
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/orders/user/${userId}?${qs}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const data = res.data.orders || [];
                setOrders(data);
                const s = res.data.summary || {};
                setStats((p) => ({
                    ...p,
                    totalOrders: s.totalOrders || res.data.pagination?.total || 0,
                    pendingOrders: s.pendingOrders || 0,
                    deliveredOrders: s.deliveredOrders || 0,
                    cancelledOrders: s.cancelledOrders || 0,
                }));
                if (data.length) checkReviews(data);
            } else {
                setOrders([]);
            }
        } catch (err) {
            setError('Failed to load orders. Please try again.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderStats = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/orders/stats/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const s = res.data.stats || {};
                setStats((p) => ({ ...p, totalSpent: s.totalSpent || 0, averageOrderValue: s.averageOrderValue || 0 }));
            }
        } catch {
            // silent
        }
    };

    // In your checkReviews function - update to use orderNumber
    const checkReviews = async (ordersData) => {
        try {
            const delivered = ordersData.filter((o) => o.orderStatus === 'delivered');
            const checks = [];
            delivered.forEach((o) =>
                o.items.forEach((i) =>
                    checks.push({
                        orderNumber: o.orderNumber,  // ← CHANGED: from orderId to orderNumber
                        productId: i.productId,
                        colorId: i.colorId
                    })
                )
            );

            console.log('Checking reviews for:', checks); // Debug log

            if (!checks.length) return;

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/reviews/check-multiple`,
                { checks, userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Check reviews response:', res.data); // Debug log

            if (res.data.success) {
                setOrders((prev) =>
                    prev.map((o) => ({
                        ...o,
                        items: o.items.map((item) => {
                            const r = res.data.results.find(
                                (x) => x.orderNumber === o.orderNumber &&  // ← Match by orderNumber
                                    x.productId === item.productId &&
                                    x.colorId === item.colorId
                            );
                            return r?.hasReviewed
                                ? {
                                    ...item,
                                    hasReviewed: true,
                                    reviewId: r.reviewId || r._id,
                                    userRating: r.rating,
                                    userReviewText: r.reviewText || '',
                                }
                                : { ...item, hasReviewed: false, reviewId: null, userRating: 0, userReviewText: '' };
                        }),
                    }))
                );
            }
        } catch (err) {
            console.error('Error checking reviews:', err);
        }
    };

    useEffect(() => {
        fetchUserOrders();
        fetchOrderStats();
    }, [filters.page, filters.status]);

    // ── Cancel Order ────────────────────────────────────────────────────
    const confirmCancel = async () => {
        if (!cancelOrderId) return;
        try {
            setCancelling(true);
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/orders/${cancelOrderId}/cancel`,
                { reason: 'Changed my mind' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success('Order cancelled successfully!');
                setCancelOrderId(null);
                fetchUserOrders();
                fetchOrderStats();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    // UserOrders.jsx - Updated openReview function
    const openReview = (order, product, updating = false) => {
        console.log('📦 Opening review modal');
        console.log('Order object:', order);
        console.log('Order Number:', order.orderNumber); // ← Now using orderNumber

        // Store order with orderNumber
        const orderWithNumber = {
            ...order,
            orderNumber: order.orderNumber  // Ensure orderNumber exists
        };

        setReviewOrder(orderWithNumber);
        setReviewProduct(product);
        setIsUpdating(updating);
        setExistingReview(updating ? { reviewId: product.reviewId } : null);
        setReviewData({
            rating: updating ? product.userRating : 0,
            reviewText: updating ? product.userReviewText || '' : '',
            hoverRating: updating ? product.userRating : 0,
        });
        setShowReview(true);
    };

    // Updated submitReview function
    const submitReview = async () => {
        console.log('========== SUBMIT REVIEW START ==========');
        console.log('Review Data:', {
            rating: reviewData.rating,
            reviewText: reviewData.reviewText,
            reviewOrder: reviewOrder,
            reviewProduct: reviewProduct
        });

        if (!reviewData.rating) {
            console.log('❌ No rating selected');
            return toast.error('Please select a star rating');
        }

        try {
            setSubmitting(true);

            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName') || 'User';
            const token = localStorage.getItem('token');

            console.log('📦 Preparing payload...');
            console.log('userId from localStorage:', userId);
            console.log('userName from localStorage:', userName);
            console.log('orderNumber from reviewOrder:', reviewOrder?.orderNumber); // ← Using orderNumber

            // Check if orderNumber exists
            if (!reviewOrder?.orderNumber) {
                console.log('❌ NO ORDER NUMBER FOUND!');
                toast.error('Order number is missing. Please try again.');
                setSubmitting(false);
                return;
            }

            // Prepare the payload - NOW USING orderNumber
            const payload = {
                userId,
                userName,
                orderNumber: reviewOrder.orderNumber,  // ← CHANGED: from orderId to orderNumber
                productId: reviewProduct.productId,
                productName: reviewProduct.productName,
                colorId: reviewProduct.colorId,
                colorName: reviewProduct.colorName,
                modelId: reviewProduct.modelId || '',
                modelName: reviewProduct.modelName || 'Default',
                size: reviewProduct.size || '',
                rating: reviewData.rating,
                reviewText: reviewData.reviewText.trim(),
            };

            

            if (isUpdating && existingReview) {
                console.log('🔄 UPDATING existing review:', existingReview.reviewId);
                const updatePayload = {
                    userId,
                    rating: reviewData.rating,
                    reviewText: reviewData.reviewText.trim()
                };
                console.log('Update payload:', updatePayload);

                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/reviews/update/${existingReview.reviewId}`,
                    updatePayload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log('✅ Update response:', res.data);
                toast.success('Review updated successfully!');

                // Update local state
                setOrders((prev) =>
                    prev.map((o) =>
                        o.orderNumber === reviewOrder.orderNumber  // ← Match by orderNumber
                            ? {
                                ...o,
                                items: o.items.map((i) =>
                                    i.productId === reviewProduct.productId && i.colorId === reviewProduct.colorId
                                        ? {
                                            ...i,
                                            hasReviewed: true,
                                            userRating: reviewData.rating,
                                            userReviewText: reviewData.reviewText.trim(),
                                        }
                                        : i
                                ),
                            }
                            : o
                    )
                );
            } else {
                console.log('📝 SUBMITTING new review');
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/reviews/submit`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log('✅ Submit response:', res.data);
                toast.success('Review submitted successfully!');

                setOrders((prev) =>
                    prev.map((o) =>
                        o.orderNumber === reviewOrder.orderNumber  // ← Match by orderNumber
                            ? {
                                ...o,
                                items: o.items.map((i) =>
                                    i.productId === reviewProduct.productId && i.colorId === reviewProduct.colorId
                                        ? {
                                            ...i,
                                            hasReviewed: true,
                                            reviewId: res.data.review?.reviewId,
                                            userRating: reviewData.rating,
                                            userReviewText: reviewData.reviewText.trim(),
                                        }
                                        : i
                                ),
                            }
                            : o
                    )
                );
            }

            console.log('========== SUBMIT REVIEW END (SUCCESS) ==========');
            setShowReview(false);

        } catch (err) {
            console.log('❌❌❌ SUBMIT REVIEW FAILED ❌❌❌');
            console.log('Error object:', err);
            console.log('Error response:', err.response);
            console.log('Error response data:', err.response?.data);
            console.log('Error response status:', err.response?.status);

            if (err.response?.data?.message) {
                console.log('Server error message:', err.response.data.message);
                toast.error(err.response.data.message);
            } else {
                toast.error(`Failed to ${isUpdating ? 'update' : 'submit'} review`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const deleteReview = async (reviewId, order, product) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/reviews/${reviewId}`,
                { headers: { Authorization: `Bearer ${token}` }, data: { userId } }
            );
            toast.success('Review deleted successfully!');
            setOrders((prev) =>
                prev.map((o) =>
                    o.orderId === order.orderId
                        ? {
                            ...o,
                            items: o.items.map((i) =>
                                i.productId === product.productId && i.colorId === product.colorId
                                    ? { ...i, hasReviewed: false, reviewId: null, userRating: 0, userReviewText: '' }
                                    : i
                            ),
                        }
                        : o
                )
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete review');
        }
    };

    // ── Render helpers ──────────────────────────────────────────────────
    if (!token || !userId) {
        return (
            <div className="uo-auth-wall">
                <div className="uo-auth-wall__icon">🔒</div>
                <h2>Login Required</h2>
                <p>Please login to view your orders.</p>
                <button onClick={() => navigate('/login')} className="uo-auth-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    if (loading)
        return (
            <div className="uo-state-wrap">
                <div className="uo-spinner" />
                <p>Loading your orders...</p>
            </div>
        );

    if (error)
        return (
            <div className="uo-state-wrap">
                <div className="uo-state-icon">😕</div>
                <h3>Unable to load orders</h3>
                <p>{error}</p>
                <button className="uo-retry-btn" onClick={fetchUserOrders}>
                    Try Again
                </button>
            </div>
        );

    // ─── Main render ────────────────────────────────────────────────────
    return (
        <div className="user-orders">
            {/* Header & Stats */}
            <div className="uo-header">
                <h1 className="uo-header__title">My Orders</h1>
                <div className="uo-stats">
                    {[
                        { val: stats.totalOrders, label: 'Total Orders' },
                        { val: stats.pendingOrders, label: 'Pending' },
                        { val: stats.deliveredOrders, label: 'Delivered' },
                    ].map((s, i) => (
                        <div key={i} className="uo-stat">
                            <div className="uo-stat__val">{s.val || 0}</div>
                            <div className="uo-stat__label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Filters */}
            <div className="uo-filters">
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <button
                        key={s}
                        className={`uo-filter ${filters.status === s ? 'active' : ''} ${s !== 'all' ? `uo-filter--${s}` : ''}`}
                        onClick={() => setFilters((p) => ({ ...p, status: s, page: 1 }))}
                    >
                        {s === 'all' ? 'All Orders' : `${STATUS_CFG[s]?.emoji} ${STATUS_CFG[s]?.label}`}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <div className="uo-empty">
                    <div className="uo-empty__icon">📦</div>
                    <h2>No orders yet</h2>
                    <p>You haven't placed any orders. Start shopping!</p>
                    <button className="uo-shop-btn" onClick={() => navigate('/products')}>
                        Start Shopping
                    </button>
                </div>
            ) : (
                <>
                    <div className="uo-orders-list">
                        {orders.map((order) => {
                            const sc = STATUS_CFG[order.orderStatus] || {};
                            return (
                                <div key={order._id} className="uo-order-card">
                                    {/* Header */}
                                    <div className="uo-order-card__header">
                                        <div className="uo-order-card__info">
                                            <div className="uo-order-card__id-row">
                                                <span className="uo-order-id">#{order.orderNumber || order.orderId}</span>
                                                <span className={`uo-status-badge uo-status-badge--${sc.cls}`}>
                                                    {sc.emoji} {sc.label}
                                                </span>
                                                {order.checkoutMode === 'buy-now' && (
                                                    <span className="uo-buynow-badge">Buy Now</span>
                                                )}
                                            </div>
                                            <p className="uo-order-date">
                                                Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="uo-order-total">
                                            <span className="uo-order-total__label">Total</span>
                                            <span className="uo-order-total__amount">
                                                {formatCurrency(order.pricing?.total || order.total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="uo-items-preview">
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="uo-item">
                                                <div className="uo-item__avatar">
                                                    {item.thumbnailImage ? (
                                                        <img src={item.thumbnailImage} alt={item.productName} />
                                                    ) : (
                                                        <span>{item.productName?.charAt(0) || 'P'}</span>
                                                    )}
                                                </div>
                                                <div className="uo-item__info">
                                                    <div className="uo-item__name">{item.productName}</div>
                                                    <div className="uo-item__chips">
                                                        {item.modelName !== 'Default' && <span className="uo-chip">{item.modelName}</span>}
                                                        {/* {item.colorName && <span className="uo-chip">{item.colorName}</span>} */}
                                                        {item.size && <span className="uo-chip">Size: {item.size}</span>}
                                                    </div>
                                                    <div className="uo-item__price-row">
                                                        <span className="uo-item__qty">Qty: {item.quantity}</span>
                                                        <span className="uo-item__price">{formatCurrency(item.totalPrice || item.totalAmount)}</span>
                                                    </div>

                                                    {/* Review section for delivered orders */}
                                                    {order.orderStatus === 'delivered' && (
                                                        <div className="uo-review-section">
                                                            {item.hasReviewed ? (
                                                                <div className="uo-reviewed">
                                                                    <span className="uo-reviewed__badge">⭐ {item.userRating}/5</span>
                                                                    <div className="uo-reviewed__btns">
                                                                        <button
                                                                            className="uo-review-btn uo-review-btn--edit"
                                                                            onClick={() => openReview(order, item, true)}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            className="uo-review-btn uo-review-btn--del"
                                                                            onClick={() => deleteReview(item.reviewId, order, item)}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="uo-write-review-btn"
                                                                    onClick={() => openReview(order, item, false)}
                                                                >
                                                                    ⭐ Write Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <div className="uo-more-items">
                                                +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="uo-order-card__footer">
                                        <div className="uo-order-meta">
                                            <span>📍 {order.deliveryAddress?.city}, {order.deliveryAddress?.state}</span>
                                            <span>🗓 Est. {getDeliveryDate(order.createdAt)}</span>
                                        </div>
                                        <div className="uo-order-actions">
                                            <button
                                                className="uo-action-btn uo-action-btn--view"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowDetails(true);
                                                }}
                                            >
                                                View Details
                                            </button>
                                            {(order.orderStatus === 'pending' || order.orderStatus === 'processing') && (
                                                <button
                                                    className="uo-action-btn uo-action-btn--cancel"
                                                    onClick={() => setCancelOrderId(order.orderNumber)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {stats.totalOrders > filters.limit && (
                        <div className="uo-pagination">
                            <button
                                className="uo-page-btn"
                                disabled={filters.page === 1}
                                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                            >
                                ← Prev
                            </button>
                            <span className="uo-page-info">
                                Page {filters.page} of {Math.ceil(stats.totalOrders / filters.limit)}
                            </span>
                            <button
                                className="uo-page-btn"
                                disabled={filters.page >= Math.ceil(stats.totalOrders / filters.limit)}
                                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ========== CANCEL CONFIRM MODAL ========== */}
            {cancelOrderId && (
                <div className="uo-modal-overlay" onClick={() => !cancelling && setCancelOrderId(null)}>
                    <div className="uo-modal uo-modal--sm" onClick={(e) => e.stopPropagation()}>
                        <div className="uo-modal__header uo-modal__header--danger">
                            <h3>Cancel Order</h3>
                            <button className="uo-modal__close" onClick={() => !cancelling && setCancelOrderId(null)}>
                                ×
                            </button>
                        </div>
                        <div className="uo-modal__body">
                            <div className="uo-confirm-body">
                                <div className="uo-confirm-icon">❌</div>
                                <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="uo-modal__footer">
                            <button
                                className="uo-modal-btn uo-modal-btn--outline"
                                onClick={() => setCancelOrderId(null)}
                                disabled={cancelling}
                            >
                                Keep Order
                            </button>
                            <button
                                className="uo-modal-btn uo-modal-btn--danger"
                                onClick={confirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? (
                                    <>
                                        <span className="uo-btn-spinner" /> Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ORDER DETAILS MODAL ========== */}
            {showDetails && selectedOrder && (
                <div className="uo-modal-overlay" onClick={() => setShowDetails(false)}>
                    <div className="uo-modal uo-modal--lg" onClick={(e) => e.stopPropagation()}>
                        <div className="uo-modal__header">
                            <div>
                                <h3>Order #{selectedOrder.orderNumber || selectedOrder.orderId}</h3>
                                <p className="uo-modal__sub">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <button className="uo-modal__close" onClick={() => setShowDetails(false)}>
                                ×
                            </button>
                        </div>

                        <div className="uo-modal__body">
                            {/* Timeline */}
                            <div className="uo-section">
                                <h4 className="uo-section__title">Order Status</h4>
                                <div className="uo-timeline">
                                    {[
                                        { key: 'pending', icon: '⏳', label: 'Order Placed', date: selectedOrder.createdAt },
                                        { key: 'processing', icon: '🔄', label: 'Processing', date: selectedOrder.timeline?.processedAt },
                                        { key: 'shipped', icon: '🚚', label: 'Shipped', date: selectedOrder.timeline?.shippedAt },
                                        { key: 'delivered', icon: '✅', label: 'Delivered', date: selectedOrder.timeline?.deliveredAt },
                                    ].map((step, i) => {
                                        const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                                        const currentIdx = statusOrder.indexOf(selectedOrder.orderStatus);
                                        const stepIdx = statusOrder.indexOf(step.key);
                                        const isActive = stepIdx <= currentIdx && currentIdx !== -1;
                                        return (
                                            <div key={i} className={`uo-timeline-step ${isActive ? 'active' : ''}`}>
                                                <div className="uo-timeline-step__icon">{step.icon}</div>
                                                <div className="uo-timeline-step__info">
                                                    <span className="uo-timeline-step__label">{step.label}</span>
                                                    {step.date && <span className="uo-timeline-step__date">{formatDate(step.date)}</span>}
                                                </div>
                                                {i < 3 && <div className={`uo-timeline-connector ${isActive && stepIdx < currentIdx ? 'active' : ''}`} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="uo-section">
                                <h4 className="uo-section__title">Items ({selectedOrder.items?.length || 0})</h4>
                                <div className="uo-detail-items">
                                    {selectedOrder.items?.map((item, i) => (
                                        <div key={i} className="uo-detail-item">
                                            <div className="uo-detail-item__avatar">
                                                {item.thumbnailImage ? (
                                                    <img src={item.thumbnailImage} alt={item.productName} />
                                                ) : (
                                                    <span>{item.productName?.charAt(0) || 'P'}</span>
                                                )}
                                            </div>
                                            <div className="uo-detail-item__info">
                                                <div className="uo-detail-item__name">{item.productName}</div>
                                                <div className="uo-item__chips">
                                                    {item.modelName !== 'Default' && <span className="uo-chip">{item.modelName}</span>}
                                                    {/* {item.colorName && <span className="uo-chip">{item.colorName}</span>} */}
                                                    {item.size && <span className="uo-chip">Size: {item.size}</span>}
                                                </div>
                                                <div className="uo-detail-item__pricing">
                                                    <span>
                                                        {formatCurrency(item.offerPrice || item.price)} × {item.quantity}
                                                    </span>
                                                    {item.offerPercentage > 0 && (
                                                        <span className="uo-offer-badge">{item.offerPercentage}% OFF</span>
                                                    )}
                                                    <span className="uo-detail-item__total">
                                                        {formatCurrency(item.totalPrice || item.totalAmount)}
                                                    </span>
                                                </div>

                                                {selectedOrder.orderStatus === 'delivered' && (
                                                    <div className="uo-review-section" style={{ marginTop: 8 }}>
                                                        {item.hasReviewed ? (
                                                            <div className="uo-reviewed">
                                                                <span className="uo-reviewed__badge">⭐ {item.userRating}/5</span>
                                                                {item.userReviewText && (
                                                                    <p className="uo-review-preview">
                                                                        "{item.userReviewText.slice(0, 80)}
                                                                        {item.userReviewText.length > 80 ? '...' : ''}"
                                                                    </p>
                                                                )}
                                                                <div className="uo-reviewed__btns">
                                                                    <button
                                                                        className="uo-review-btn uo-review-btn--edit"
                                                                        onClick={() => {
                                                                            setShowDetails(false);
                                                                            setTimeout(() => openReview(selectedOrder, item, true), 200);
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        className="uo-review-btn uo-review-btn--del"
                                                                        onClick={() => deleteReview(item.reviewId, selectedOrder, item)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="uo-write-review-btn"
                                                                onClick={() => {
                                                                    setShowDetails(false);
                                                                    setTimeout(() => openReview(selectedOrder, item, false), 200);
                                                                }}
                                                            >
                                                                ⭐ Write Review
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="uo-section">
                                <h4 className="uo-section__title">Delivery Address</h4>
                                <div className="uo-address-card">
                                    <div className="uo-address-card__name">{selectedOrder.deliveryAddress?.fullName || 'N/A'}</div>
                                    <div className="uo-address-card__contact">
                                        📱 {selectedOrder.deliveryAddress?.mobile || 'N/A'}
                                        {selectedOrder.deliveryAddress?.email && ` · ✉️ ${selectedOrder.deliveryAddress.email}`}
                                    </div>
                                    <div className="uo-address-card__lines">
                                        <p>{selectedOrder.deliveryAddress?.addressLine1 || 'N/A'}</p>
                                        {selectedOrder.deliveryAddress?.addressLine2 && <p>{selectedOrder.deliveryAddress.addressLine2}</p>}
                                        {selectedOrder.deliveryAddress?.landmark && <p>Near: {selectedOrder.deliveryAddress.landmark}</p>}
                                        <p>
                                            {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} –{' '}
                                            {selectedOrder.deliveryAddress?.pincode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="uo-section">
                                <h4 className="uo-section__title">Order Summary</h4>
                                <div className="uo-summary">
                                    <div className="uo-summary-row">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.subtotal || selectedOrder.subtotal)}</span>
                                    </div>
                                    {(selectedOrder.pricing?.totalSavings || selectedOrder.totalSavings) > 0 && (
                                        <div className="uo-summary-row uo-summary-row--discount">
                                            <span>Total Savings</span>
                                            <span>−{formatCurrency(selectedOrder.pricing?.totalSavings || selectedOrder.totalSavings)}</span>
                                        </div>
                                    )}
                                    <div className="uo-summary-row">
                                        <span>Shipping</span>
                                        <span className={(selectedOrder.pricing?.shipping || selectedOrder.shipping) === 0 ? 'uo-free' : ''}>
                                            {(selectedOrder.pricing?.shipping || selectedOrder.shipping) === 0
                                                ? 'FREE'
                                                : formatCurrency(selectedOrder.pricing?.shipping || selectedOrder.shipping)}
                                        </span>
                                    </div>
                                    <div className="uo-summary-row">
                                        <span>Tax (GST)</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.tax || selectedOrder.tax)}</span>
                                    </div>
                                    <div className="uo-summary-row uo-summary-row--total">
                                        <span>Total Amount</span>
                                        <span>{formatCurrency(selectedOrder.pricing?.total || selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="uo-section">
                                <h4 className="uo-section__title">Payment</h4>
                                <div className="uo-payment-card">
                                    <span className="uo-payment-card__method">
                                        {selectedOrder.payment?.method === 'cod'
                                            ? '💵 Cash on Delivery'
                                            : selectedOrder.payment?.method === 'card'
                                                ? '💳 Card'
                                                : '📱 UPI'}
                                    </span>
                                    <span className={`uo-payment-status uo-payment-status--${selectedOrder.payment?.status}`}>
                                        {selectedOrder.payment?.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="uo-modal__footer">
                            <button className="uo-modal-btn uo-modal-btn--outline" onClick={() => setShowDetails(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== REVIEW MODAL ========== */}
            {showReview && reviewProduct && (
                <div className="uo-modal-overlay" onClick={() => !submitting && setShowReview(false)}>
                    <div className="uo-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="uo-modal__header">
                            <div>
                                <h3>{isUpdating ? 'Update Review' : 'Write a Review'}</h3>
                                <p className="uo-modal__sub">Order #{reviewOrder?.orderId}</p>
                            </div>
                            <button
                                className="uo-modal__close"
                                onClick={() => !submitting && setShowReview(false)}
                                disabled={submitting}
                            >
                                ×
                            </button>
                        </div>

                        <div className="uo-modal__body">
                            <div className="uo-review-product">
                                <div className="uo-review-product__name">{reviewProduct.productName}</div>
                                <div className="uo-item__chips" style={{ marginTop: 4 }}>
                                    {reviewProduct.modelName !== 'Default' && <span className="uo-chip">{reviewProduct.modelName}</span>}
                                    {reviewProduct.colorName && <span className="uo-chip">{reviewProduct.colorName}</span>}
                                    {reviewProduct.size && <span className="uo-chip">Size: {reviewProduct.size}</span>}
                                </div>
                            </div>

                            <div className="uo-review-field">
                                <label>
                                    Your Rating <span className="uo-req">*</span>
                                </label>
                                <StarRating
                                    rating={reviewData.rating}
                                    hoverRating={reviewData.hoverRating}
                                    onHover={(r) => setReviewData((p) => ({ ...p, hoverRating: r }))}
                                    onClick={(r) => setReviewData((p) => ({ ...p, rating: r }))}
                                    disabled={submitting}
                                />
                                <span className="uo-rating-hint">
                                    {reviewData.rating > 0
                                        ? `${reviewData.rating} star${reviewData.rating > 1 ? 's' : ''}`
                                        : 'Tap to rate'}
                                </span>
                            </div>

                            <div className="uo-review-field">
                                <label>
                                    Your Review <span className="uo-optional">(Optional)</span>
                                </label>
                                <textarea
                                    placeholder="Share your experience with this product..."
                                    value={reviewData.reviewText}
                                    onChange={(e) => setReviewData((p) => ({ ...p, reviewText: e.target.value }))}
                                    rows={4}
                                    maxLength={1000}
                                    disabled={submitting}
                                />
                                <span className="uo-char-count">{reviewData.reviewText.length}/1000</span>
                            </div>

                            <div className="uo-review-notes">
                                <p>⭐ Your review helps other shoppers make better decisions</p>
                                <p>✅ Verified purchase from Order #{reviewOrder?.orderId}</p>
                            </div>
                        </div>

                        <div className="uo-modal__footer">
                            <button
                                className="uo-modal-btn uo-modal-btn--outline"
                                onClick={() => !submitting && setShowReview(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="uo-modal-btn uo-modal-btn--primary"
                                onClick={submitReview}
                                disabled={submitting || !reviewData.rating}
                            >
                                {submitting ? (
                                    <>
                                        <span className="uo-btn-spinner" /> {isUpdating ? 'Updating...' : 'Submitting...'}
                                    </>
                                ) : isUpdating ? (
                                    'Update Review'
                                ) : (
                                    'Submit Review'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} theme="light" hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
        </div>
    );
};

export default UserOrders;