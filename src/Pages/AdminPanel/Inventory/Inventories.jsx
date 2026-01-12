import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Inventories.scss";

const Inventories = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Batch form state
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    quantity: "",
    manufactureDate: "",
    price: "",
    sellingPrice: "",
    reason: "New batch received",
    notes: ""
  });

  // Batch details state
  const [batchDetails, setBatchDetails] = useState({
    batches: [],
    summary: null,
    history: []
  });

  // Expiry alerts state
  const [expiryAlerts, setExpiryAlerts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInventory(res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      alert("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchExpiryAlerts();
  }, []);

  // Fetch expiry alerts
  const fetchExpiryAlerts = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/alerts/expiry`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpiryAlerts(res.data.alerts);
    } catch (err) {
      console.error("Error fetching expiry alerts:", err);
    }
  };

  // Open add batch modal
  const openAddBatch = (item) => {
    setSelectedItem(item);
    // Pre-fill selling price with current price
    setBatchForm({
      batchNumber: "",
      quantity: "",
      manufactureDate: new Date().toISOString().split('T')[0].substring(0, 7), // YYYY-MM
      price: item.sellingPrice || "",
      sellingPrice: item.sellingPrice || "",
      reason: "New batch received",
      notes: ""
    });
    setShowAddBatch(true);
  };

  // Open batch details modal
  const openBatchDetails = async (item) => {
    try {
      setSelectedItem(item);
      const token = localStorage.getItem("adminToken");

      // Fetch batch summary
      const summaryRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/batch/summary/${item.inventoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch stock history
      const historyRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/stock-history/${item.inventoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBatchDetails({
        batches: item.batches || [],
        summary: summaryRes.data,
        history: historyRes.data.history || []
      });

      setShowBatchDetails(true);
    } catch (err) {
      console.error("Error fetching batch details:", err);
      alert("Failed to load batch details");
    }
  };

  // Handle batch form changes
  const handleBatchFormChange = (e) => {
    const { name, value } = e.target;
    setBatchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add batch to inventory
  const handleAddBatch = async () => {
    try {
      if (!selectedItem) return;

      // Validation
      if (!batchForm.batchNumber.trim()) {
        alert("Batch number is required");
        return;
      }

      const quantity = parseFloat(batchForm.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity");
        return;
      }

      const price = parseFloat(batchForm.price);
      if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price");
        return;
      }

      const sellingPrice = parseFloat(batchForm.sellingPrice) || price;
      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        alert("Please enter a valid selling price");
        return;
      }

      if (!batchForm.manufactureDate) {
        alert("Manufacture date is required");
        return;
      }

      const token = localStorage.getItem("adminToken");

      // Create batch data object
      const batchData = {
        batch: {
          batchNumber: batchForm.batchNumber.trim().toUpperCase(),
          quantity: quantity,
          manufactureDate: batchForm.manufactureDate,
          price: price,
          sellingPrice: sellingPrice
        },
        reason: batchForm.reason,
        notes: batchForm.notes
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/inventory/batch/add-batch/${selectedItem.inventoryId}`,  // ← Change to _id
        batchData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Batch ${batchForm.batchNumber} added successfully!`);
      setShowAddBatch(false);
      setSelectedItem(null);
      fetchInventory(); // Refresh list
    } catch (err) {
      console.error("Error adding batch:", err);
      alert(err.response?.data?.error || "Failed to add batch");
    }
  };

  // Deduct stock from batch inventory
  const handleDeductStock = async (item, quantity) => {
    try {
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/batch/deduct-stock/${item.inventoryId}`,
        {
          quantity: parseFloat(quantity),
          reason: "Stock sold",
          notes: "Deducted from inventory"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Successfully deducted ${quantity} stock from ${item.productName}`);
      fetchInventory(); // Refresh list
    } catch (err) {
      console.error("Error deducting stock:", err);
      alert(err.response?.data?.error || "Failed to deduct stock");
    }
  };

  // Mark batch as expired
  const handleMarkExpired = async (batchNumbers, reason = "Batch expired") => {
    try {
      if (!selectedItem) return;

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/batch/mark-expired/${selectedItem.inventoryId}`,
        {
          batchNumbers: batchNumbers,
          reason: reason,
          notes: "Marked as expired"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${batchNumbers.length} batch(es) marked as expired`);
      fetchInventory(); // Refresh list
      setShowBatchDetails(false); // Close details modal
    } catch (err) {
      console.error("Error marking batch as expired:", err);
      alert(err.response?.data?.error || "Failed to mark batch as expired");
    }
  };

  // Update threshold
  const handleUpdateThreshold = async (item, newThreshold) => {
    try {
      const threshold = parseFloat(newThreshold);
      if (isNaN(threshold) || threshold < 0) {
        alert("Please enter a valid threshold value");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/update-threshold/${item.inventoryId}`,
        { threshold },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setInventory(prev => prev.map(i =>
        i.inventoryId === item.inventoryId ? { ...i, threshold } : i
      ));

      alert("Threshold updated successfully!");
    } catch (err) {
      console.error("Error updating threshold:", err);
      alert(err.response?.data?.error || "Failed to update threshold");
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.toLowerCase().includes(searchTerm.toLowerCase());

    const isLowStock = item.stock < (item.threshold || 10);
    const matchesLowStock = filterType !== "low" || isLowStock;

    // Check for expiring batches
    const hasExpiringBatches = item.batches && item.batches.some(batch => {
      if (batch.status !== "active") return false;
      const expiryDate = new Date(batch.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });

    const matchesExpiring = filterType !== "expiring" || hasExpiringBatches;

    return matchesSearch && matchesLowStock && matchesExpiring;
  });

  // Get stock status
  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return { class: "out-of-stock", text: "Out of Stock", icon: "❌" };
    if (stock < threshold) return { class: "low-stock", text: "Low Stock", icon: "⚠️" };
    return { class: "in-stock", text: "In Stock", icon: "✅" };
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time for history
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get batch status
  const getBatchStatus = (batch) => {
    const today = new Date();
    const expiryDate = new Date(batch.expiryDate);

    if (batch.status === "expired") {
      return { class: "expired", text: "Expired", icon: "⏰" };
    }

    if (batch.status === "sold-out") {
      return { class: "sold-out", text: "Sold Out", icon: "✅" };
    }

    if (expiryDate < today) {
      return { class: "expired", text: "Expired", icon: "⏰" };
    }

    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30) {
      return { class: "expiring", text: `Expiring in ${daysUntilExpiry} days`, icon: "⚠️" };
    }

    return { class: "active", text: "Active", icon: "✓" };
  };

  // Get stock statistics
  const getStats = () => {
    let totalStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    let totalValue = 0;
    let expiringBatches = 0;

    filteredInventory.forEach(item => {
      totalStock += item.stock;
      totalValue += item.totalValue || 0;

      const status = getStockStatus(item.stock, item.threshold || 10);
      if (status.class === "out-of-stock") outOfStock++;
      else if (status.class === "low-stock") lowStock++;
      else inStock++;

      // Count expiring batches
      if (item.batches) {
        item.batches.forEach(batch => {
          if (batch.status === "active") {
            const expiryDate = new Date(batch.expiryDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
              expiringBatches++;
            }
          }
        });
      }
    });

    return { totalStock, outOfStock, lowStock, inStock, totalValue, expiringBatches };
  };

  const stats = getStats();

  // Quick deduct stock
  const QuickDeductStock = ({ item }) => {
    const [quantity, setQuantity] = useState("");

    const handleDeduct = () => {
      if (quantity && parseFloat(quantity) > 0) {
        handleDeductStock(item, parseFloat(quantity));
        setQuantity("");
      }
    };

    return (
      <div className="quick-deduct">
        <input
          type="number"
          min="1"
          max={item.stock}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
          className="deduct-input"
        />
        <button
          onClick={handleDeduct}
          disabled={!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > item.stock}
          className="deduct-btn"
          title="Deduct stock"
        >
          Sell
        </button>
      </div>
    );
  };

  return (
    <div className="inventories">
      {/* HEADER */}
      <div className="header">
        <div className="title-section">
          <h2>Batch Inventory Management</h2>
          <span className="count">({filteredInventory.length} batch products)</span>
        </div>
        <div className="actions">
          <button
            className="refresh-btn"
            onClick={() => {
              fetchInventory();
              fetchExpiryAlerts();
            }}
            disabled={loading}
          >
            ⟳ Refresh
          </button>
          <button
            className="alerts-btn"
            onClick={() => setShowExpiryAlerts(true)}
            disabled={expiryAlerts.length === 0}
          >
            ⚠️ Expiry Alerts ({expiryAlerts.length})
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{filteredInventory.length}</div>
          <div className="stat-label">Batch Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.expiringBatches}</div>
          <div className="stat-label">Expiring Soon</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{stats.totalValue.toLocaleString()}</div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by product name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>

        <div className="filter-buttons">
          <button
            className={filterType === "all" ? "active" : ""}
            onClick={() => setFilterType("all")}
          >
            All Products
          </button>
          <button
            className={filterType === "low" ? "active low" : ""}
            onClick={() => setFilterType("low")}
          >
            ⚠️ Low Stock
          </button>
          <button
            className={filterType === "expiring" ? "active expiring" : ""}
            onClick={() => setFilterType("expiring")}
          >
            ⏰ Expiring Soon
          </button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      {loading ? (
        <div className="loading">Loading batch inventory...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="no-items">
          <p>No batch inventory items found</p>
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Batch Summary</th>
                <th>Current Stock</th>
                <th>Price & Value</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.threshold || 10);
                const batchSummary = item.batches ? {
                  totalBatches: item.batches.length,
                  activeBatches: item.batches.filter(b => b.status === "active").length,
                  expiredBatches: item.batches.filter(b => b.status === "expired").length,
                  soldOutBatches: item.batches.filter(b => b.status === "sold-out").length,
                  nextExpiry: item.batches
                    .filter(b => b.status === "active")
                    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]?.expiryDate
                } : null;

                return (
                  <tr key={item.inventoryId} className={stockStatus.class}>
                    <td className="product-details">
                      <div className="product-name">{item.productName}</div>
                      <div className="product-id">ID: {item.productId}</div>
                      <div className="product-category">{item.category} • {item.hsnCode}</div>
                      <div className="inventory-id">Inventory: {item.inventoryId}</div>
                    </td>

                    <td className="batch-summary">
                      {batchSummary ? (
                        <div className="batch-stats">
                          <div className="batch-stat">
                            <span className="stat-label">Batches:</span>
                            <span className="stat-value">{batchSummary.totalBatches}</span>
                          </div>
                          <div className="batch-stat">
                            <span className="stat-label">Active:</span>
                            <span className="stat-value active">{batchSummary.activeBatches}</span>
                          </div>
                          <div className="batch-stat">
                            <span className="stat-label">Expired:</span>
                            <span className="stat-value expired">{batchSummary.expiredBatches}</span>
                          </div>
                          <div className="batch-stat">
                            <span className="stat-label">Sold Out:</span>
                            <span className="stat-value sold-out">{batchSummary.soldOutBatches}</span>
                          </div>
                          {batchSummary.nextExpiry && (
                            <div className="batch-stat">
                              <span className="stat-label">Next Expiry:</span>
                              <span className="stat-value expiring">
                                {formatDate(batchSummary.nextExpiry)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-batches">No batches added</div>
                      )}
                    </td>

                    <td className="stock-cell">
                      <div className="stock-display">
                        <span className="stock-value">{item.stock} units</span>
                        <QuickDeductStock item={item} />
                      </div>
                    </td>

                    <td className="price-cell">
                      <div className="price-info">
                        <div className="selling-price">
                          ₹{item.sellingPrice?.toFixed(2) || "0.00"}
                          <span className="price-label">Selling Price</span>
                        </div>
                        <div className="total-value">
                          ₹{(item.sellingPrice * item.stock).toLocaleString()}
                          <span className="value-label">Total Value</span>
                        </div>
                      </div>
                    </td>

                    <td className="threshold-cell">
                      <div className="threshold-display">
                        <input
                          type="number"
                          min="0"
                          value={item.threshold || 10}
                          onChange={(e) => handleUpdateThreshold(item, e.target.value)}
                          className="threshold-input"
                        />
                        <span className="threshold-label">Alert when below</span>
                      </div>
                    </td>

                    <td className="status-cell">
                      <span className={`status-badge ${stockStatus.class}`}>
                        {stockStatus.icon} {stockStatus.text}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="add-batch-btn"
                          onClick={() => openAddBatch(item)}
                          title="Add New Batch"
                        >
                          + Add Batch
                        </button>
                        <button
                          className="details-btn"
                          onClick={() => openBatchDetails(item)}
                          title="View Batch Details"
                        >
                          📋 Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD BATCH MODAL */}
      {showAddBatch && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Batch - {selectedItem.productName}</h3>
              <p className="modal-subtitle">
                Inventory: {selectedItem.inventoryId} • Current Stock: {selectedItem.stock}
              </p>
              <button className="close-btn" onClick={() => setShowAddBatch(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Batch Number *</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={batchForm.batchNumber}
                    onChange={handleBatchFormChange}
                    placeholder="e.g., BATCH-2024-001"
                    autoFocus
                  />
                  <small>Unique identifier for this batch</small>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    value={batchForm.quantity}
                    onChange={handleBatchFormChange}
                    placeholder="Number of units"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Manufacture Date *</label>
                  <input
                    type="month"
                    name="manufactureDate"
                    value={batchForm.manufactureDate}
                    onChange={handleBatchFormChange}
                  />
                  <small>Format: YYYY-MM (Expiry will be 12 months later)</small>
                </div>

                <div className="form-group">
                  <label>Purchase Price *</label>
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={batchForm.price}
                    onChange={handleBatchFormChange}
                    placeholder="Cost per unit"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    min="0.01"
                    step="0.01"
                    value={batchForm.sellingPrice}
                    onChange={handleBatchFormChange}
                    placeholder="Selling price per unit"
                  />
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <select
                    name="reason"
                    value={batchForm.reason}
                    onChange={handleBatchFormChange}
                  >
                    <option value="New batch received">New batch received</option>
                    <option value="Stock replenishment">Stock replenishment</option>
                    <option value="Manufacturer shipment">Manufacturer shipment</option>
                    <option value="Return from customer">Return from customer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={batchForm.notes}
                  onChange={handleBatchFormChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="batch-preview">
                <h4>Batch Preview</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Batch Number:</span>
                    <strong>{batchForm.batchNumber || "Not specified"}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Quantity:</span>
                    <strong>{batchForm.quantity || 0} units</strong>
                  </div>
                  <div className="preview-item">
                    <span>Manufacture:</span>
                    <strong>{batchForm.manufactureDate || "Not specified"}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Expiry:</span>
                    <strong>
                      {batchForm.manufactureDate ?
                        new Date(new Date(batchForm.manufactureDate + '-01').setMonth(
                          new Date(batchForm.manufactureDate + '-01').getMonth() + 12
                        )).toISOString().substring(0, 7) :
                        "Not specified"}
                    </strong>
                  </div>
                  <div className="preview-item">
                    <span>Purchase Price:</span>
                    <strong>₹{batchForm.price || "0.00"}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Selling Price:</span>
                    <strong>₹{batchForm.sellingPrice || batchForm.price || "0.00"}</strong>
                  </div>
                </div>
                <div className="stock-change">
                  <div className="change-item">
                    <span>Current Stock:</span>
                    <strong>{selectedItem.stock}</strong>
                  </div>
                  <div className="change-item">
                    <span>Adding:</span>
                    <strong className="positive">+{batchForm.quantity || 0}</strong>
                  </div>
                  <div className="change-item total">
                    <span>New Stock:</span>
                    <strong>{selectedItem.stock + (parseFloat(batchForm.quantity) || 0)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddBatch(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddBatch}>
                Add Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DETAILS MODAL */}
      {showBatchDetails && selectedItem && batchDetails.summary && (
        <div className="modal-overlay">
          <div className="modal xlarge">
            <div className="modal-header">
              <h3>Batch Details - {selectedItem.productName}</h3>
              <p className="modal-subtitle">
                Total Stock: {batchDetails.summary.totalStock} •
                Total Value: ₹{batchDetails.summary.totalValue?.toLocaleString()}
              </p>
              <button className="close-btn" onClick={() => setShowBatchDetails(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Batch Summary */}
              <div className="summary-section">
                <h4>Batch Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Total Batches:</span>
                    <strong>{batchDetails.summary.batchSummary?.totalBatches || 0}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Active Batches:</span>
                    <strong className="active">{batchDetails.summary.batchSummary?.activeBatches || 0}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Expired Batches:</span>
                    <strong className="expired">{batchDetails.summary.batchSummary?.expiredBatches || 0}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Sold Out Batches:</span>
                    <strong className="sold-out">{batchDetails.summary.batchSummary?.soldOutBatches || 0}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Current Stock:</span>
                    <strong>{batchDetails.summary.totalStock}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total Value:</span>
                    <strong>₹{batchDetails.summary.totalValue?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Active Batches Table */}
              <div className="batches-section">
                <div className="section-header">
                  <h4>Active Batches ({batchDetails.batches.filter(b => b.status === "active").length})</h4>
                  {batchDetails.batches.filter(b => b.status === "active").length > 0 && (
                    <button
                      className="mark-expired-btn"
                      onClick={() => {
                        const expiringBatches = batchDetails.batches
                          .filter(b => b.status === "active" && new Date(b.expiryDate) < new Date())
                          .map(b => b.batchNumber);
                        if (expiringBatches.length > 0) {
                          if (window.confirm(`Mark ${expiringBatches.length} expired batch(es) as expired?`)) {
                            handleMarkExpired(expiringBatches, "Batch expired");
                          }
                        }
                      }}
                    >
                      ⏰ Mark Expired Batches
                    </button>
                  )}
                </div>

                {batchDetails.batches.filter(b => b.status === "active").length > 0 ? (
                  <div className="batches-table-container">
                    <table className="batches-table">
                      <thead>
                        <tr>
                          <th>Batch Number</th>
                          <th>Manufacture Date</th>
                          <th>Expiry Date</th>
                          <th>Quantity</th>
                          <th>Current Qty</th>
                          <th>Purchase Price</th>
                          <th>Selling Price</th>
                          <th>Status</th>
                          <th>Added On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchDetails.batches
                          .filter(batch => batch.status === "active")
                          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)) // Sort by expiry
                          .map((batch, index) => {
                            const batchStatus = getBatchStatus(batch);
                            return (
                              <tr key={batch.batchId || index} className={batchStatus.class}>
                                <td className="batch-number">{batch.batchNumber}</td>
                                <td>{formatDate(batch.manufactureDate)}</td>
                                <td>{formatDate(batch.expiryDate)}</td>
                                <td>{batch.quantity}</td>
                                <td><strong>{batch.currentQuantity}</strong></td>
                                <td>₹{batch.price?.toFixed(2)}</td>
                                <td>₹{batch.sellingPrice?.toFixed(2)}</td>
                                <td>
                                  <span className={`batch-status ${batchStatus.class}`}>
                                    {batchStatus.icon} {batchStatus.text}
                                  </span>
                                </td>
                                <td>{formatDate(batch.addedAt)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-active-batches">No active batches</div>
                )}
              </div>

              {/* Stock History */}
              {batchDetails.history.length > 0 && (
                <div className="history-section">
                  <h4>Stock History (Last 10 Transactions)</h4>
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Batch Number</th>
                          <th>Previous</th>
                          <th>New</th>
                          <th>Reason</th>
                          <th>Added By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchDetails.history.slice(0, 10).map((history, index) => {
                          const typeClass = history.type === "added" ? "added" :
                            history.type === "deducted" ? "deducted" :
                              history.type === "initial" ? "initial" : "default";
                          return (
                            <tr key={history.historyId || index}>
                              <td>{formatDateTime(history.date)}</td>
                              <td>
                                <span className={`type-badge ${typeClass}`}>
                                  {history.type}
                                </span>
                              </td>
                              <td>{history.quantity}</td>
                              <td>{history.batchNumber || "-"}</td>
                              <td>{history.previousStock}</td>
                              <td><strong>{history.newStock}</strong></td>
                              <td className="reason">{history.reason}</td>
                              <td>{history.addedBy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowBatchDetails(false)}>
                Close
              </button>
              <button className="add-batch-btn" onClick={() => {
                setShowBatchDetails(false);
                openAddBatch(selectedItem);
              }}>
                + Add New Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPIRY ALERTS MODAL */}
      {showExpiryAlerts && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>⚠️ Expiry Alerts (Next 30 Days)</h3>
              <p className="modal-subtitle">
                {expiryAlerts.length} product(s) have batches expiring soon
              </p>
              <button className="close-btn" onClick={() => setShowExpiryAlerts(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {expiryAlerts.length === 0 ? (
                <div className="no-alerts">
                  <p>No expiry alerts at the moment</p>
                </div>
              ) : (
                <div className="alerts-list">
                  {expiryAlerts.map((alert, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-header">
                        <h4>{alert.productName}</h4>
                        <span className="product-id">{alert.productId}</span>
                      </div>
                      <div className="alert-batches">
                        {alert.expiringBatches.map((batch, bIndex) => (
                          <div key={bIndex} className="batch-alert">
                            <span className="batch-number">Batch: {batch.batchNumber}</span>
                            <span className="batch-quantity">Qty: {batch.currentQuantity}</span>
                            <span className="batch-expiry">
                              Expires: {formatDate(batch.expiryDate)}
                              ({batch.daysUntilExpiry} days)
                            </span>
                            <button
                              className="mark-expired-btn small"
                              onClick={() => {
                                if (window.confirm(`Mark batch ${batch.batchNumber} as expired?`)) {
                                  handleMarkExpired([batch.batchNumber], "Marked as expired from alerts");
                                  setShowExpiryAlerts(false);
                                }
                              }}
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
              <button className="close-btn" onClick={() => setShowExpiryAlerts(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventories;