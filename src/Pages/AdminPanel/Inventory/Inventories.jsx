import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Inventories.scss";

// ─── API Base ──────────────────────────────────────────────────────────────────
const getToken = () => {
  const token = localStorage.getItem("adminToken");
  // console.log("Token exists:", !!token); 
  return token;


};

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });

const formatDateTime = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const getStockStatus = (stock, threshold) => {
  if (stock === 0) return { cls: "out-of-stock", label: "Out of Stock", dot: "red" };
  if (stock < threshold) return { cls: "low-stock", label: "Low Stock", dot: "amber" };
  return { cls: "in-stock", label: "In Stock", dot: "green" };
};

const getBatchStatus = (batch) => {
  const today = new Date();
  const expiry = new Date(batch.expiryDate);
  if (batch.status === "expired" || expiry < today) return { cls: "expired", label: "Expired" };
  if (batch.status === "sold-out") return { cls: "sold-out", label: "Sold Out" };
  const days = Math.ceil((expiry - today) / 86400000);
  if (days <= 30) return { cls: "expiring", label: `${days}d left` };
  return { cls: "active", label: "Active" };
};

// ─── Quick Deduct (inline component) ──────────────────────────────────────────
function QuickDeduct({ item, onDeduct }) {
  const [qty, setQty] = useState("");

  const handle = () => {
    if (qty && parseFloat(qty) > 0) {
      onDeduct(item, parseFloat(qty));
      setQty("");
    }
  };

  return (
    <div className="quick-deduct">
      <input
        type="number"
        min="1"
        max={item.stock}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="deduct-input"
      />
      <button
        onClick={handle}
        disabled={!qty || parseFloat(qty) <= 0 || parseFloat(qty) > item.stock}
        className="deduct-btn"
      >
        Sell
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const Inventories = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Modal states
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [batchDetails, setBatchDetails] = useState({ batches: [], summary: null, history: [] });

  const [addBatchLoading, setAddBatchLoading] = useState(false);

  // Batch form
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    quantity: "",
    manufactureDate: "",
    price: "",
    reason: "New batch received",
    notes: "",
  });

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/all`, {
        headers: authHeader(),
      });
      setInventory(res.data);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryAlerts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/alerts/expiry`, {
        headers: authHeader(),
      });
      setExpiryAlerts(res.data.alerts);
    } catch {
      console.error("Failed to fetch expiry alerts");
    }
  };



  useEffect(() => {

    fetchInventory();
    fetchExpiryAlerts();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openAddBatch = (item) => {
    setSelectedItem(item);
    setBatchForm({
      batchNumber: "",
      quantity: "",
      manufactureDate: new Date().toISOString().split("T")[0].substring(0, 7),
      price: "",
      reason: "New batch received",
      notes: "",
    });
    setShowAddBatch(true);
  };

  const openBatchDetails = async (item) => {
    try {
      setSelectedItem(item);
      const [summaryRes, historyRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/inventory/batch/summary/${item.inventoryId}`, {
          headers: authHeader(),
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/inventory/stock-history/${item.inventoryId}`, {
          headers: authHeader(),
        }),
      ]);
      setBatchDetails({
        batches: item.batches || [],
        summary: summaryRes.data,
        history: historyRes.data.history || [],
      });
      setShowBatchDetails(true);
    } catch {
      toast.error("Failed to load batch details");
    }
  };

  const handleBatchFormChange = (e) => {
    const { name, value } = e.target;
    setBatchForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBatch = async () => {
    if (!selectedItem) return;

    if (!batchForm.batchNumber.trim()) return toast.error("Batch number is required");
    const quantity = parseFloat(batchForm.quantity);
    if (isNaN(quantity) || quantity <= 0) return toast.error("Enter a valid quantity");
    const price = parseFloat(batchForm.price);
    if (isNaN(price) || price <= 0) return toast.error("Enter a valid purchase price");
    if (!batchForm.manufactureDate) return toast.error("Manufacture date is required");

    try {
      setAddBatchLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/inventory/batch/add-batch/${selectedItem.inventoryId}`,
        {
          batch: {
            batchNumber: batchForm.batchNumber.trim().toUpperCase(),
            quantity,
            manufactureDate: batchForm.manufactureDate,
            price,
          },
          reason: batchForm.reason,
          notes: batchForm.notes,
        },
        { headers: authHeader() }
      );
      toast.success(`Batch ${batchForm.batchNumber.toUpperCase()} added successfully!`);
      setShowAddBatch(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add batch");
    } finally {
      setAddBatchLoading(false);
    }
  };

  const handleDeductStock = async (item, quantity) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/batch/deduct-stock/${item.inventoryId}`,
        { quantity, reason: "Stock sold", notes: "Deducted from inventory" },
        { headers: authHeader() }
      );
      toast.success(`Deducted ${quantity} units from ${item.productName}`);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to deduct stock");
    }
  };

  const handleMarkExpired = async (batchNumbers, reason = "Batch expired") => {
    if (!selectedItem) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/batch/mark-expired/${selectedItem.inventoryId}`,
        { batchNumbers, reason, notes: "Marked as expired" },
        { headers: authHeader() }
      );
      toast.success(`${batchNumbers.length} batch(es) marked as expired`);
      fetchInventory();
      setShowBatchDetails(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to mark as expired");
    }
  };

  const handleMarkExpiredFromAlerts = async (batchNumber, inventoryId) => {
    try {
      // find the item temporarily for selectedItem context
      const item = inventory.find((i) => i.inventoryId === inventoryId);
      if (!item) return;
      setSelectedItem(item);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/batch/mark-expired/${inventoryId}`,
        { batchNumbers: [batchNumber], reason: "Marked as expired from alerts", notes: "" },
        { headers: authHeader() }
      );
      toast.success(`Batch ${batchNumber} marked as expired`);
      fetchInventory();
      fetchExpiryAlerts();
      setShowExpiryAlerts(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to mark as expired");
    }
  };

  const handleUpdateThreshold = async (item, newThreshold) => {
    const threshold = parseFloat(newThreshold);
    if (isNaN(threshold) || threshold < 0) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/update-threshold/${item.inventoryId}`,
        { threshold },
        { headers: authHeader() }
      );
      setInventory((prev) =>
        prev.map((i) => (i.inventoryId === item.inventoryId ? { ...i, threshold } : i))
      );
    } catch {
      toast.error("Failed to update threshold");
    }
  };

  // ── Filtered + Stats ──────────────────────────────────────────────────────────

  const filteredInventory = inventory.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const isLow = item.stock < (item.threshold || 10);
    const hasExpiring = item.batches?.some((b) => {
      if (b.status !== "active") return false;
      const days = Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000);
      return days <= 30 && days >= 0;
    });

    if (filterType === "low" && !isLow) return false;
    if (filterType === "expiring" && !hasExpiring) return false;
    return matchSearch;
  });

  const stats = (() => {
    let outOfStock = 0, lowStock = 0, expiring = 0, totalValue = 0;
    filteredInventory.forEach((item) => {
      const s = getStockStatus(item.stock, item.threshold || 10);
      if (s.cls === "out-of-stock") outOfStock++;
      if (s.cls === "low-stock") lowStock++;
      totalValue += item.totalValue || 0;
      item.batches?.forEach((b) => {
        if (b.status === "active") {
          const days = Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000);
          if (days <= 30 && days >= 0) expiring++;
        }
      });
    });
    return { outOfStock, lowStock, expiring, totalValue };
  })();

  // ── Batch preview expiry calc ─────────────────────────────────────────────────
  const previewExpiry = batchForm.manufactureDate
    ? new Date(
      new Date(batchForm.manufactureDate + "-01").setMonth(
        new Date(batchForm.manufactureDate + "-01").getMonth() + 12
      )
    )
      .toISOString()
      .substring(0, 7)
    : "—";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="inventories">

      {/* ── PAGE HEADER ── */}
      <div className="inv-header">
        <div className="inv-header__left">
          <h1 className="inv-header__title">Inventory</h1>
          <span className="inv-header__count">{filteredInventory.length} products</span>
        </div>
        <div className="inv-header__actions">
          <button
            className="btn btn--outline"
            onClick={() => { fetchInventory(); fetchExpiryAlerts(); }}
            disabled={loading}
          >
            <span className="btn-icon">↻</span> Refresh
          </button>
          {expiryAlerts.length > 0 && (
            <button className="btn btn--alert" onClick={() => setShowExpiryAlerts(true)}>
              <span className="btn-icon">⚠</span> {expiryAlerts.length} Expiry Alerts
            </button>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="inv-stats">
        <div className="stat-card stat-card--total">
          <div className="stat-card__value">{filteredInventory.length}</div>
          <div className="stat-card__label">Total Products</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__value">{stats.outOfStock}</div>
          <div className="stat-card__label">Out of Stock</div>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="stat-card__value">{stats.lowStock}</div>
          <div className="stat-card__label">Low Stock</div>
        </div>
        <div className="stat-card stat-card--expiring">
          <div className="stat-card__value">{stats.expiring}</div>
          <div className="stat-card__label">Expiring Soon</div>
        </div>
        <div className="stat-card stat-card--value">
          <div className="stat-card__value stat-card__value--sm">{formatCurrency(stats.totalValue)}</div>
          <div className="stat-card__label">Total Value</div>
        </div>
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div className="inv-filters">
        <div className="inv-search">
          <span className="inv-search__icon">⌕</span>
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="inv-search__clear" onClick={() => setSearchTerm("")}>×</button>
          )}
        </div>
        <div className="inv-filter-tabs">
          {[
            { key: "all", label: "All" },
            { key: "low", label: "⚠ Low Stock" },
            { key: "expiring", label: "⏰ Expiring" },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${filterType === f.key ? "active" : ""} ${f.key !== "all" ? `filter-tab--${f.key}` : ""}`}
              onClick={() => setFilterType(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div className="inv-state">
          <div className="inv-state__spinner" />
          <p>Loading inventory...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="inv-state">
          <div className="inv-state__icon">📦</div>
          <p>No inventory items found</p>
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch Summary</th>
                <th>Stock</th>
                <th>Purchase Value</th>
                <th>Alert Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item.stock, item.threshold || 10);
                const activeBatches = item.batches?.filter((b) => b.status === "active") || [];
                const nextExpiry = activeBatches.sort(
                  (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                )[0]?.expiryDate;

                return (
                  <tr key={item.inventoryId} className={`inv-row inv-row--${status.cls}`}>
                    {/* Product */}
                    <td className="td-product">
                      <div className="product-name">{item.productName}</div>
                      <div className="product-meta">
                        <span className="product-cat">{item.category}</span>
                        {item.hsnCode && <span className="product-hsn">HSN: {item.hsnCode}</span>}
                      </div>
                    </td>

                    {/* Batch Summary */}
                    <td className="td-batch">
                      {item.batches?.length > 0 ? (
                        <div className="batch-pills">
                          <span className="pill pill--total">{item.batches.length} total</span>
                          <span className="pill pill--active">{activeBatches.length} active</span>
                          <span className="pill pill--expired">
                            {item.batches.filter((b) => b.status === "expired").length} expired
                          </span>
                          {nextExpiry && (
                            <span className="pill pill--expiry">
                              Next: {formatDate(nextExpiry)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="no-batch">No batches</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="td-stock">
                      <div className="stock-num">{item.stock}</div>
                      <div className="stock-unit">units</div>
                      <QuickDeduct item={item} onDeduct={handleDeductStock} />
                    </td>

                    {/* Purchase Value */}
                    <td className="td-value">
                      <div className="value-num">{formatCurrency(item.totalValue)}</div>
                      <div className="value-label">Purchase Value</div>
                    </td>

                    {/* Threshold */}
                    <td className="td-threshold">
                      <input
                        type="number"
                        min="0"
                        value={item.threshold || 10}
                        onChange={(e) => handleUpdateThreshold(item, e.target.value)}
                        className="threshold-input"
                      />
                      <span className="threshold-label">min units</span>
                    </td>

                    {/* Status */}
                    <td className="td-status">
                      <span className={`status-badge status-badge--${status.cls}`}>
                        <span className={`status-dot dot--${status.dot}`} />
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="td-actions">
                      <button className="action-btn action-btn--primary" onClick={() => openAddBatch(item)}>
                        + Add Batch
                      </button>
                      <button className="action-btn action-btn--secondary" onClick={() => openBatchDetails(item)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: ADD BATCH
      ═══════════════════════════════════════════════════════════ */}
      {showAddBatch && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowAddBatch(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add New Batch</h3>
                <p className="modal-sub">{selectedItem.productName} • {selectedItem.category}</p>
              </div>
              <button className="modal-close" onClick={() => setShowAddBatch(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Batch Number <span className="req">*</span></label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={batchForm.batchNumber}
                    onChange={handleBatchFormChange}
                    placeholder="e.g. BATCH-2024-001"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Quantity <span className="req">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={batchForm.quantity}
                    onChange={handleBatchFormChange}
                    placeholder="No. of units"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Manufacture Date <span className="req">*</span></label>
                  <input
                    type="month"
                    name="manufactureDate"
                    value={batchForm.manufactureDate}
                    onChange={handleBatchFormChange}
                  />
                  <small>Expiry will be auto-set to 12 months later</small>
                </div>
                <div className="form-group">
                  <label>Purchase Price (per unit) <span className="req">*</span></label>
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={batchForm.price}
                    onChange={handleBatchFormChange}
                    placeholder="₹ 0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reason</label>
                  <select name="reason" value={batchForm.reason} onChange={handleBatchFormChange}>
                    <option>New batch received</option>
                    <option>Stock replenishment</option>
                    <option>Manufacturer shipment</option>
                    <option>Return from customer</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={batchForm.notes}
                    onChange={handleBatchFormChange}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              {/* Preview Card */}
              <div className="batch-preview">
                <div className="batch-preview__title">Batch Preview</div>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Batch No.</span>
                    <strong>{batchForm.batchNumber?.toUpperCase() || "—"}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Quantity</span>
                    <strong>{batchForm.quantity || "—"} units</strong>
                  </div>
                  <div className="preview-item">
                    <span>Manufacture</span>
                    <strong>{batchForm.manufactureDate || "—"}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Expiry</span>
                    <strong>{previewExpiry}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Purchase Price</span>
                    <strong>{batchForm.price ? formatCurrency(batchForm.price) : "—"}</strong>
                  </div>
                  <div className="preview-item preview-item--highlight">
                    <span>New Stock Total</span>
                    <strong>{selectedItem.stock + (parseFloat(batchForm.quantity) || 0)} units</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowAddBatch(false)}>Cancel</button>
              <button
                className="btn btn--primary"
                onClick={handleAddBatch}
                disabled={addBatchLoading}
              >
                {addBatchLoading ? (
                  <><span className="btn-spinner" /> Adding...</>
                ) : (
                  "Add Batch"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: BATCH DETAILS
      ═══════════════════════════════════════════════════════════ */}
      {showBatchDetails && selectedItem && batchDetails.summary && (
        <div className="modal-overlay" onClick={() => setShowBatchDetails(false)}>
          <div className="modal modal--xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedItem.productName}</h3>
                <p className="modal-sub">
                  {selectedItem.category} • Stock: {batchDetails.summary.totalStock} units • Value: {formatCurrency(batchDetails.summary.totalValue)}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowBatchDetails(false)}>×</button>
            </div>

            <div className="modal-body">

              {/* Summary Pills */}
              <div className="detail-summary">
                {[
                  { label: "Total Batches", val: batchDetails.summary.batchSummary?.totalBatches || 0, cls: "" },
                  { label: "Active", val: batchDetails.summary.batchSummary?.activeBatches || 0, cls: "active" },
                  { label: "Expired", val: batchDetails.summary.batchSummary?.expiredBatches || 0, cls: "expired" },
                  { label: "Sold Out", val: batchDetails.summary.batchSummary?.soldOutBatches || 0, cls: "soldout" },
                  { label: "Current Stock", val: `${batchDetails.summary.totalStock} units`, cls: "" },
                  { label: "Purchase Value", val: formatCurrency(batchDetails.summary.totalValue), cls: "value" },
                ].map((s, i) => (
                  <div key={i} className={`detail-stat detail-stat--${s.cls}`}>
                    <div className="detail-stat__val">{s.val}</div>
                    <div className="detail-stat__label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Active Batches Table */}
              <div className="section-block">
                <div className="section-block__header">
                  <h4>Active Batches</h4>
                  {batchDetails.batches.filter((b) => b.status === "active" && new Date(b.expiryDate) < new Date()).length > 0 && (
                    <button
                      className="btn btn--warning btn--sm"
                      onClick={() => {
                        const expired = batchDetails.batches
                          .filter((b) => b.status === "active" && new Date(b.expiryDate) < new Date())
                          .map((b) => b.batchNumber);
                        handleMarkExpired(expired, "Batch expired");
                      }}
                    >
                      ⏰ Mark Expired
                    </button>
                  )}
                </div>

                {batchDetails.batches.filter((b) => b.status === "active").length > 0 ? (
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Batch No.</th>
                          <th>Manufacture</th>
                          <th>Expiry</th>
                          <th>Original Qty</th>
                          <th>Remaining</th>
                          <th>Purchase Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchDetails.batches
                          .filter((b) => b.status === "active")
                          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                          .map((batch, i) => {
                            const bs = getBatchStatus(batch);
                            return (
                              <tr key={batch.batchId || i} className={`detail-row detail-row--${bs.cls}`}>
                                <td><span className="batch-no">{batch.batchNumber}</span></td>
                                <td>{formatDate(batch.manufactureDate)}</td>
                                <td>{formatDate(batch.expiryDate)}</td>
                                <td>{batch.quantity}</td>
                                <td><strong>{batch.currentQuantity}</strong></td>
                                <td>{formatCurrency(batch.price)}</td>
                                <td><span className={`badge badge--${bs.cls}`}>{bs.label}</span></td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">No active batches</div>
                )}
              </div>

              {/* Stock History */}
              {batchDetails.history.length > 0 && (
                <div className="section-block">
                  <div className="section-block__header">
                    <h4>Stock History <span className="section-sub">(Last 10)</span></h4>
                  </div>
                  <div className="detail-table-wrap">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Qty</th>
                          <th>Batch</th>
                          <th>Before</th>
                          <th>After</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchDetails.history.slice(0, 10).map((h, i) => (
                          <tr key={h.historyId || i}>
                            <td className="td-date">{formatDateTime(h.date)}</td>
                            <td><span className={`badge badge--${h.type}`}>{h.type}</span></td>
                            <td>{h.quantity}</td>
                            <td>{h.batchNumber || "—"}</td>
                            <td>{h.previousStock}</td>
                            <td><strong>{h.newStock}</strong></td>
                            <td className="td-reason">{h.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowBatchDetails(false)}>Close</button>
              <button className="btn btn--primary" onClick={() => { setShowBatchDetails(false); openAddBatch(selectedItem); }}>
                + Add New Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: EXPIRY ALERTS
      ═══════════════════════════════════════════════════════════ */}
      {showExpiryAlerts && (
        <div className="modal-overlay" onClick={() => setShowExpiryAlerts(false)}>
          <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header--warning">
              <div>
                <h3 className="modal-title">Expiry Alerts</h3>
                <p className="modal-sub">{expiryAlerts.length} product(s) expiring in next 30 days</p>
              </div>
              <button className="modal-close" onClick={() => setShowExpiryAlerts(false)}>×</button>
            </div>

            <div className="modal-body">
              {expiryAlerts.length === 0 ? (
                <div className="empty-state">✅ No expiry alerts at the moment</div>
              ) : (
                <div className="alerts-list">
                  {expiryAlerts.map((alert, i) => (
                    <div key={i} className="alert-card">
                      <div className="alert-card__header">
                        <span className="alert-card__name">{alert.productName}</span>
                        <span className="alert-card__cat">{alert.category}</span>
                      </div>
                      <div className="alert-batches">
                        {alert.expiringBatches.map((batch, bi) => (
                          <div key={bi} className="alert-batch-row">
                            <span className="ab-batch">{batch.batchNumber}</span>
                            <span className="ab-qty">{batch.currentQuantity} units</span>
                            <span className="ab-expiry">
                              Expires {formatDate(batch.expiryDate)} ({batch.daysUntilExpiry}d)
                            </span>
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleMarkExpiredFromAlerts(batch.batchNumber, alert.inventoryId)}
                            >
                              Mark Expired
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn--outline" onClick={() => setShowExpiryAlerts(false)}>Close</button>
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
  );
};

export default Inventories;