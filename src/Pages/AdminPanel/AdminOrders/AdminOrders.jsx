import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./AdminOrders.scss";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("adminToken");

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const maskPhone = (phone) => {
  if (!phone) return "N/A";
  const s = String(phone);
  return `${s.slice(0, 4)}****${s.slice(-2)}`;
};

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: "Pending", cls: "pending", dot: "amber" },
  processing: { label: "Processing", cls: "processing", dot: "blue" },
  confirmed: { label: "Confirmed", cls: "confirmed", dot: "teal" },
  shipped: { label: "Shipped", cls: "shipped", dot: "indigo" },
  delivered: { label: "Delivered", cls: "delivered", dot: "green" },
  cancelled: { label: "Cancelled", cls: "cancelled", dot: "red" },
  returned: { label: "Returned", cls: "returned", dot: "gray" },
};

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  cash: "Cash",
  card: "Card",
  upi: "UPI",
};

// ─── Component ─────────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // ── State ───────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Tabs: "online" | "offline" | "all"
  const [activeTab, setActiveTab] = useState("online");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: "", notes: "" });

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") navigate("/admin/login");
  }, [navigate]);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (overrides = {}) => {
    try {
      setIsLoading(true);

      const tab = overrides.tab ?? activeTab;
      const status = overrides.status ?? statusFilter;
      const search = overrides.search ?? searchTerm;
      const page = overrides.page ?? pagination.page;

      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(tab !== "all" && { orderType: tab }),
        ...(status !== "all" && { status }),
        ...(search && { search }),
      });

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/all/orders?${params}`,
        { headers: authHeader() }
      );

      if (res.data.success) {
        setOrders(res.data.orders || []);
        setStats(res.data.stats || {});
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination?.total || 0,
          page,
        }));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Redirecting to login...");
        localStorage.clear();
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        toast.error(err.response?.data?.message || "Failed to fetch orders");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, searchTerm, pagination.page, pagination.limit, navigate]);

  // Fetch on tab / status / page change
  useEffect(() => {
    fetchOrders();
  }, [activeTab, statusFilter, pagination.page]);

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders({ search: searchTerm, page: 1 });
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Tab change ──────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOrders({ tab, status: "all", page: 1 });
  };

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdate({
      status: order.orderStatus || "",
      notes: order.notes || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // ── Update status (online only) ─────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!statusUpdate.status) return toast.error("Please select a status");
    if (!selectedOrder) return;

    try {
      setStatusLoading(true);

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/orders/${selectedOrder.orderNumber}/status`,
        { status: statusUpdate.status, notes: statusUpdate.notes },
        { headers: authHeader() }
      );

      if (res.data.success) {
        toast.success("Order status updated successfully!");

        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === selectedOrder.orderNumber
              ? { ...o, ...res.data.order }
              : o
          )
        );
        setSelectedOrder((prev) => ({ ...prev, ...res.data.order }));
        fetchOrders();
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else {
        toast.error(err.response?.data?.message || "Failed to update status");
      }
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getCustomerName = (order) =>
    order.orderType === "online"
      ? order.deliveryAddress?.fullName
      : order.customer?.name || "N/A";

  const getCustomerPhone = (order) =>
    order.orderType === "online"
      ? maskPhone(order.deliveryAddress?.mobile)
      : maskPhone(order.customer?.mobile);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="admin-orders">

        {/* ── PAGE HEADER ── */}
        <div className="ao-header">
          <div className="ao-header__left">
            <h1 className="ao-header__title">Orders</h1>
            <span className="ao-header__count">{pagination.total} total</span>
          </div>
          <div className="ao-header__actions">
            <button
              className="btn btn--outline"
              onClick={() => fetchOrders()}
              disabled={isLoading}
            >
              <span className={`btn-icon ${isLoading ? "spin" : ""}`}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="ao-stats">
          {[
            { label: "Total Orders", val: stats.totalOrders || 0, cls: "total" },
            { label: "Total Revenue", val: formatCurrency(stats.totalRevenue || 0), cls: "revenue", },
            { label: "Pending", val: stats.statusBreakdown?.find(s => s._id === "pending")?.count || 0, cls: "pending" },
            { label: "Processing", val: stats.statusBreakdown?.find(s => s._id === "processing")?.count || 0, cls: "processing" },
            { label: "Shipped", val: stats.statusBreakdown?.find(s => s._id === "shipped")?.count || 0, cls: "shipped" },
            { label: "Delivered", val: stats.statusBreakdown?.find(s => s._id === "delivered")?.count || 0, cls: "delivered" },
          ].map((s, i) => (
            <div key={i} className={`ao-stat ao-stat--${s.cls}`}>
              <div className="ao-stat__val">{s.val}</div>
              <div className="ao-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TYPE TABS ── */}
        <div className="ao-tabs">
          {[
            { key: "online", label: "Online Orders" },
            { key: "offline", label: "Offline Orders" },
            { key: "all", label: "All Orders" },
          ].map((t) => (
            <button
              key={t.key}
              className={`ao-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
          <div
            className="ao-tab-indicator"
            style={{
              left: activeTab === "online" ? "0%"
                : activeTab === "offline" ? "33.33%"
                  : "66.66%",
              width: "33.33%",
            }}
          />
        </div>

        {/* ── SEARCH + STATUS FILTER ── */}
        <div className="ao-filters">
          <div className="ao-search">
            <span className="ao-search__icon">⌕</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by order number, customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="ao-search__clear"
                onClick={() => setSearchTerm("")}
              >×</button>
            )}
          </div>

          {/* Status filters — only for online / all tabs */}
          {activeTab !== "offline" && (
            <div className="ao-status-tabs">
              {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <button
                  key={s}
                  className={`status-tab ${statusFilter === s ? "active" : ""} ${s !== "all" ? `status-tab--${s}` : ""}`}
                  onClick={() => {
                    setStatusFilter(s);
                    setPagination((p) => ({ ...p, page: 1 }));
                    fetchOrders({ status: s, page: 1 });
                  }}
                >
                  {s === "all" ? "All Status" : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── TABLE ── */}
        {isLoading ? (
          <div className="ao-state">
            <div className="ao-state__spinner" />
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="ao-state">
            <div className="ao-state__icon">📭</div>
            <p>No orders found</p>
          </div>
        ) : (
          <div className="ao-table-wrap">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sc = STATUS_CONFIG[order.orderStatus] || {};
                  return (
                    <tr
                      key={order._id}
                      className={`ao-row ao-row--${sc.cls || "default"}`}
                      onClick={() => openModal(order)}
                    >
                      {/* Order */}
                      <td className="td-order">
                        <div className="order-num">#{order.orderNumber}</div>
                        {order.checkoutMode === "buy-now" && (
                          <span className="badge badge--buynow">Buy Now</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="td-customer">
                        <div className="cust-name">{getCustomerName(order)}</div>
                        <div className="cust-phone">{getCustomerPhone(order)}</div>
                      </td>

                      {/* Items */}
                      <td className="td-items">
                        <div className="items-count">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                        </div>
                        <div className="items-preview">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <span key={idx} className="item-chip">{item.productName}</span>
                          ))}
                          {order.items?.length > 2 && (
                            <span className="item-chip item-chip--more">
                              +{order.items.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="td-amount">
                        <div className="amount-val">{formatCurrency(order.total)}</div>
                        {order.totalSavings > 0 && (
                          <div className="amount-saved">
                            Saved {formatCurrency(order.totalSavings)}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="td-date">
                        {formatDate(order.date || order.createdAt)}
                      </td>

                      {/* Type */}
                      <td className="td-type">
                        <span className={`type-badge type-badge--${order.orderType}`}>
                          {order.orderType === "online" ? "🌐 Online" : "🏪 Offline"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="td-status">
                        <span className={`status-badge status-badge--${sc.cls}`}>
                          <span className={`dot dot--${sc.dot}`} />
                          {sc.label || order.orderStatus}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="td-payment">
                        <div className="pay-method">
                          {PAYMENT_LABELS[order.payment?.method] || order.payment?.method || "N/A"}
                        </div>
                        <span className={`pay-status pay-status--${order.payment?.status}`}>
                          {order.payment?.status || "pending"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="td-action" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="view-btn"
                          onClick={() => openModal(order)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="ao-pagination">
            <button
              className="page-btn"
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1 || isLoading}
            >
              ← Prev
            </button>
            <span className="page-info">
              Page {pagination.page} of {totalPages}
              <span className="page-total"> ({pagination.total} orders)</span>
            </span>
            <button
              className="page-btn"
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= totalPages || isLoading}
            >
              Next →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            MODAL
        ════════════════════════════════════════════════════════ */}
        {showModal && selectedOrder && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal modal--lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`modal-header modal-header--${selectedOrder.orderType}`}>
                <div>
                  <h3 className="modal-title">
                    #{selectedOrder.orderNumber}
                  </h3>
                  <p className="modal-sub">
                    {selectedOrder.orderType === "online" ? "🌐 Online Order" : "🏪 Offline Order"}
                    {" · "}
                    {formatDateTime(selectedOrder.date || selectedOrder.createdAt)}
                  </p>
                </div>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <div className="modal-body">

                {/* ── Status Update (ONLINE ONLY) ── */}
                {selectedOrder.orderType === "online" && (
                  <div className="modal-section modal-section--highlighted">
                    <div className="section-title">Update Order Status</div>
                    <div className="status-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>New Status</label>
                          <select
                            value={statusUpdate.status}
                            onChange={(e) =>
                              setStatusUpdate((p) => ({ ...p, status: e.target.value }))
                            }
                            disabled={statusLoading}
                          >
                            <option value="">Select status...</option>
                            {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                              <option key={s} value={s}>
                                {STATUS_CONFIG[s]?.label || s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Notes (Optional)</label>
                          <input
                            type="text"
                            placeholder="Add a note..."
                            value={statusUpdate.notes}
                            onChange={(e) =>
                              setStatusUpdate((p) => ({ ...p, notes: e.target.value }))
                            }
                            disabled={statusLoading}
                          />
                        </div>
                      </div>
                      <div className="status-form__actions">
                        <div className="current-status-wrap">
                          <span className="current-status-label">Current:</span>
                          <span className={`status-badge status-badge--${STATUS_CONFIG[selectedOrder.orderStatus]?.cls}`}>
                            <span className={`dot dot--${STATUS_CONFIG[selectedOrder.orderStatus]?.dot}`} />
                            {STATUS_CONFIG[selectedOrder.orderStatus]?.label || selectedOrder.orderStatus}
                          </span>
                        </div>
                        <button
                          className="btn btn--primary"
                          onClick={handleUpdateStatus}
                          disabled={statusLoading || !statusUpdate.status}
                        >
                          {statusLoading ? (
                            <><span className="btn-spinner" /> Updating...</>
                          ) : "Update Status"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Order Info ── */}
                <div className="modal-section">
                  <div className="section-title">Order Information</div>
                  <div className="info-grid">
                    <div className="info-item">
                      <span>Order Number</span>
                      <strong>#{selectedOrder.orderNumber}</strong>
                    </div>
                    <div className="info-item">
                      <span>Date</span>
                      <strong>{formatDate(selectedOrder.date || selectedOrder.createdAt)}</strong>
                    </div>
                    <div className="info-item">
                      <span>Order Type</span>
                      <strong style={{ textTransform: "capitalize" }}>{selectedOrder.orderType}</strong>
                    </div>
                    {selectedOrder.orderType === "online" && (
                      <div className="info-item">
                        <span>Checkout Mode</span>
                        <strong style={{ textTransform: "capitalize" }}>
                          {selectedOrder.checkoutMode || "Cart"}
                        </strong>
                      </div>
                    )}
                    {selectedOrder.orderType === "offline" && selectedOrder.businessType && (
                      <div className="info-item">
                        <span>Business Type</span>
                        <strong style={{ textTransform: "uppercase" }}>
                          {selectedOrder.businessType}
                        </strong>
                      </div>
                    )}
                    <div className="info-item">
                      <span>Status</span>
                      <span className={`status-badge status-badge--${STATUS_CONFIG[selectedOrder.orderStatus]?.cls}`}>
                        <span className={`dot dot--${STATUS_CONFIG[selectedOrder.orderStatus]?.dot}`} />
                        {STATUS_CONFIG[selectedOrder.orderStatus]?.label || selectedOrder.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Customer Info ── */}
                <div className="modal-section">
                  <div className="section-title">Customer Information</div>
                  <div className="info-grid">
                    {selectedOrder.orderType === "online" ? (
                      <>
                        <div className="info-item">
                          <span>Name</span>
                          <strong>{selectedOrder.deliveryAddress?.fullName || "N/A"}</strong>
                        </div>
                        <div className="info-item">
                          <span>Mobile</span>
                          <strong>{selectedOrder.deliveryAddress?.mobile || "N/A"}</strong>
                        </div>
                        {selectedOrder.deliveryAddress?.email && (
                          <div className="info-item">
                            <span>Email</span>
                            <strong>{selectedOrder.deliveryAddress.email}</strong>
                          </div>
                        )}
                        <div className="info-item info-item--full">
                          <span>Delivery Address</span>
                          <strong>
                            {[
                              selectedOrder.deliveryAddress?.addressLine1,
                              selectedOrder.deliveryAddress?.addressLine2,
                              selectedOrder.deliveryAddress?.city,
                              selectedOrder.deliveryAddress?.state,
                              selectedOrder.deliveryAddress?.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="info-item">
                          <span>Name</span>
                          <strong>{selectedOrder.customer?.name || "N/A"}</strong>
                        </div>
                        <div className="info-item">
                          <span>Mobile</span>
                          <strong>{selectedOrder.customer?.mobile || "N/A"}</strong>
                        </div>
                        {selectedOrder.customer?.email && (
                          <div className="info-item">
                            <span>Email</span>
                            <strong>{selectedOrder.customer.email}</strong>
                          </div>
                        )}
                        {selectedOrder.customer?.gstNumber && (
                          <div className="info-item">
                            <span>GST Number</span>
                            <strong>{selectedOrder.customer.gstNumber}</strong>
                          </div>
                        )}
                        {selectedOrder.customer?.address && (
                          <div className="info-item info-item--full">
                            <span>Address</span>
                            <strong>{selectedOrder.customer.address}</strong>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ── Order Items ── */}
                <div className="modal-section">
                  <div className="section-title">
                    Order Items
                    <span className="section-count">{selectedOrder.items?.length || 0}</span>
                  </div>
                  <div className="order-items">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <div className="order-item__info">
                          <div className="order-item__name">{item.productName}</div>
                          <div className="order-item__meta">
                            {item.batchNumber && (
                              <span className="meta-chip">Batch: {item.batchNumber}</span>
                            )}
                            {item.colorName && (
                              <span className="meta-chip">{item.colorName}</span>
                            )}
                            {item.modelName && item.modelName !== "Default" && (
                              <span className="meta-chip">{item.modelName}</span>
                            )}
                            {item.size && (
                              <span className="meta-chip">Size: {item.size}</span>
                            )}
                          </div>
                        </div>
                        <div className="order-item__pricing">
                          <div className="pricing-row">
                            <span>Qty</span>
                            <strong>{item.quantity}</strong>
                          </div>
                          <div className="pricing-row">
                            <span>Unit Price</span>
                            <strong>{formatCurrency(item.price)}</strong>
                          </div>
                          {item.discount > 0 && (
                            <div className="pricing-row pricing-row--discount">
                              <span>Discount ({item.discount}%)</span>
                              <strong>−{formatCurrency(item.discountAmount)}</strong>
                            </div>
                          )}
                          <div className="pricing-row pricing-row--total">
                            <span>Total</span>
                            <strong>{formatCurrency(item.totalAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Order Summary ── */}
                <div className="modal-section">
                  <div className="section-title">Order Summary</div>
                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="summary-row summary-row--discount">
                        <span>Discount</span>
                        <span>−{formatCurrency(selectedOrder.discount)}</span>
                      </div>
                    )}
                    {selectedOrder.totalSavings > 0 && (
                      <div className="summary-row summary-row--discount">
                        <span>Total Savings</span>
                        <span>−{formatCurrency(selectedOrder.totalSavings)}</span>
                      </div>
                    )}
                    {selectedOrder.promoDiscount > 0 && (
                      <div className="summary-row summary-row--discount">
                        <span>Promo Discount</span>
                        <span>−{formatCurrency(selectedOrder.promoDiscount)}</span>
                      </div>
                    )}
                    {selectedOrder.shipping > 0 ? (
                      <div className="summary-row">
                        <span>Shipping</span>
                        <span>{formatCurrency(selectedOrder.shipping)}</span>
                      </div>
                    ) : selectedOrder.orderType === "online" && (
                      <div className="summary-row summary-row--free">
                        <span>Shipping</span>
                        <span>FREE</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>Tax (GST)</span>
                      <span>{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                    {selectedOrder.cgst > 0 && (
                      <div className="summary-row summary-row--sub">
                        <span>CGST</span>
                        <span>{formatCurrency(selectedOrder.cgst)}</span>
                      </div>
                    )}
                    {selectedOrder.sgst > 0 && (
                      <div className="summary-row summary-row--sub">
                        <span>SGST</span>
                        <span>{formatCurrency(selectedOrder.sgst)}</span>
                      </div>
                    )}
                    <div className="summary-row summary-row--total">
                      <span>Total Amount</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Payment Info ── */}
                <div className="modal-section">
                  <div className="section-title">Payment Information</div>
                  <div className="info-grid">
                    <div className="info-item">
                      <span>Method</span>
                      <strong>{PAYMENT_LABELS[selectedOrder.payment?.method] || selectedOrder.payment?.method || "N/A"}</strong>
                    </div>
                    <div className="info-item">
                      <span>Status</span>
                      <span className={`pay-status pay-status--${selectedOrder.payment?.status}`}>
                        {selectedOrder.payment?.status?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                    {selectedOrder.payment?.paidAmount && (
                      <div className="info-item">
                        <span>Paid Amount</span>
                        <strong>{formatCurrency(selectedOrder.payment.paidAmount)}</strong>
                      </div>
                    )}
                    {selectedOrder.payment?.paymentDate && (
                      <div className="info-item">
                        <span>Payment Date</span>
                        <strong>{formatDate(selectedOrder.payment.paymentDate)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remarks / Notes */}
                {(selectedOrder.remarks || selectedOrder.notes) && (
                  <div className="modal-section">
                    <div className="section-title">Remarks</div>
                    <p className="remarks-text">
                      {selectedOrder.remarks || selectedOrder.notes}
                    </p>
                  </div>
                )}

              </div>{/* modal-body */}

              {/* Footer */}
              <div className="modal-footer">
                <button className="btn btn--outline" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="light"
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;