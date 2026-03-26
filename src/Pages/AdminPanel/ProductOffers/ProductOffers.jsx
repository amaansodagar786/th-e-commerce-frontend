import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./ProductOffers.scss";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("adminToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const formatDate = (dateString) => {
  if (!dateString) return "No end date";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── Color Card (reused for simple + variable) ─────────────────────────────────

const ColorCard = ({ color, product, modelName, modelId, onEdit, onRemove }) => (
  <div className={`po-color-card ${color.hasOffer ? "po-color-card--has-offer" : ""}`}>
    <div className="po-color-card__top">
      <div className="po-color-card__info">
        <div className="po-color-card__name">{color.colorName}</div>
        <div className="po-color-card__price">
          {color.hasOffer && color.offerPrice ? (
            <>
              <span className="po-original">
                {formatCurrency(color.originalPriceDisplay || color.currentPrice)}
              </span>
              <span className="po-offer-price">
                {formatCurrency(color.offerPrice)}
              </span>
              <span className="po-discount-badge">
                {color.offer.offerPercentage}% OFF
              </span>
            </>
          ) : (
            <span className="po-regular-price">
              {formatCurrency(color.currentPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="po-color-card__actions">
        <button
          className={`po-color-btn ${color.hasOffer ? "po-color-btn--edit" : "po-color-btn--add"}`}
          onClick={(e) => { e.stopPropagation(); onEdit(color, modelName, modelId); }}
        >
          {color.hasOffer ? "Edit" : "+ Add Offer"}
        </button>
        {color.hasOffer && color.offer && (
          <button
            className="po-color-btn po-color-btn--remove"
            onClick={(e) => { e.stopPropagation(); onRemove(color.offer.offerId, color.colorName); }}
            title="Remove offer"
          >
            ✕
          </button>
        )}
      </div>
    </div>

    {color.hasOffer && color.offer && (
      <div className="po-color-card__offer-details">
        <div className="po-offer-row">
          <span>Label</span>
          <strong>{color.offer.offerLabel}</strong>
        </div>
        <div className="po-offer-row">
          <span>Start</span>
          <strong>{formatDate(color.offer.startDate)}</strong>
        </div>
        <div className="po-offer-row">
          <span>End</span>
          <strong>{formatDate(color.offer.endDate)}</strong>
        </div>
        <div className="po-offer-row">
          <span>Status</span>
          <span className={`po-status-badge ${color.offer.isCurrentlyValid ? "po-status-badge--active" : "po-status-badge--inactive"}`}>
            <span className={`po-dot ${color.offer.isCurrentlyValid ? "po-dot--green" : "po-dot--gray"}`} />
            {color.offer.isCurrentlyValid ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    )}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ProductOffers = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Add / Edit offer modal
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [offerForm, setOfferForm] = useState({
    offerPercentage: "",
    offerLabel: "Special Offer",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    hasEndDate: false,
  });

  // Remove confirm modal
  const [removeOfferId, setRemoveOfferId] = useState(null);
  const [removeColorName, setRemoveColorName] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/products-with-color-offers`,
        { headers: authHeader() }
      );
      setProducts(res.data);
      setExpandedProduct(null);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = (() => {
    let totalColors = 0, colorsWithOffers = 0, activeOffers = 0;
    products.forEach((p) => {
      if (p.type === "simple" && p.colors) {
        totalColors += p.colors.length;
        p.colors.forEach((c) => {
          if (c.hasOffer) { colorsWithOffers++; if (c.offer?.isCurrentlyValid) activeOffers++; }
        });
      } else if (p.type === "variable" && p.models) {
        p.models.forEach((m) => {
          if (m.colors) {
            totalColors += m.colors.length;
            m.colors.forEach((c) => {
              if (c.hasOffer) { colorsWithOffers++; if (c.offer?.isCurrentlyValid) activeOffers++; }
            });
          }
        });
      }
    });
    return { totalColors, colorsWithOffers, activeOffers };
  })();

  // ── Toggle expand ────────────────────────────────────────────────────────────

  const toggleExpand = (productId) =>
    setExpandedProduct((prev) => (prev === productId ? null : productId));

  // ── Open offer form ──────────────────────────────────────────────────────────

  const openAddOffer = (product, color, modelName = "", modelId = "") => {
    setSelectedProduct(product);
    setSelectedColor({ ...color, modelName, variableModelId: modelId });
    setOfferForm(
      color.offer
        ? {
          offerPercentage: color.offer.offerPercentage.toString(),
          offerLabel: color.offer.offerLabel,
          startDate: color.offer.startDate
            ? new Date(color.offer.startDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          endDate: color.offer.endDate
            ? new Date(color.offer.endDate).toISOString().split("T")[0]
            : "",
          hasEndDate: !!color.offer.endDate,
        }
        : {
          offerPercentage: "",
          offerLabel: "Special Offer",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          hasEndDate: false,
        }
    );
    setShowAddOffer(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfferForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  // ── Save offer ───────────────────────────────────────────────────────────────

  const handleSaveOffer = async () => {
    if (!selectedProduct || !selectedColor) return;

    const percentage = parseFloat(offerForm.offerPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100)
      return toast.error("Enter a valid offer percentage between 0 and 100");

    try {
      setSaveLoading(true);
      const offerData = {
        productId: selectedProduct.productId,
        colorId: selectedColor.colorId,
        colorName: selectedColor.colorName,
        offerPercentage: percentage,
        offerLabel: offerForm.offerLabel || "Special Offer",
        startDate: offerForm.startDate || new Date().toISOString().split("T")[0],
        modelName: selectedColor.modelName || selectedProduct.modelName || "Default",
        variableModelId: selectedColor.variableModelId || "",
      };
      if (offerForm.hasEndDate && offerForm.endDate)
        offerData.endDate = offerForm.endDate;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/productoffers/add-color-offer`,
        offerData,
        { headers: authHeader() }
      );

      toast.success(`Offer ${selectedColor.hasOffer ? "updated" : "added"} successfully!`);
      setShowAddOffer(false);
      setSelectedColor(null);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save offer");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Remove offer ─────────────────────────────────────────────────────────────

  const handleRemoveOffer = async () => {
    if (!removeOfferId) return;
    try {
      setRemoveLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/productoffers/deactivate-color-offer/${removeOfferId}`,
        {},
        { headers: authHeader() }
      );
      toast.success("Offer removed successfully!");
      setRemoveOfferId(null);
      setRemoveColorName("");
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove offer");
    } finally {
      setRemoveLoading(false);
    }
  };

  // ── Product offers count ─────────────────────────────────────────────────────

  const getProductOffersCount = (product) => {
    if (product.type === "simple")
      return product.colors?.filter((c) => c.hasOffer).length || 0;
    return (
      product.models?.reduce(
        (acc, m) => acc + (m.colors?.filter((c) => c.hasOffer).length || 0), 0
      ) || 0
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="product-offers">

        {/* ── HEADER ── */}
        <div className="po-header">
          <div className="po-header__left">
            <h1 className="po-header__title">Product Offers</h1>
            <span className="po-header__count">{products.length} products</span>
          </div>
          <button
            className="po-btn po-btn--outline"
            onClick={fetchProducts}
            disabled={loading}
          >
            <span className={loading ? "po-spin-icon" : ""}>↻</span> Refresh
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="po-stats">
          {[
            { label: "Total Products", val: products.length, cls: "total" },
            { label: "Total Colors", val: stats.totalColors, cls: "colors" },
            { label: "With Offers", val: stats.colorsWithOffers, cls: "with" },
            { label: "Active Offers", val: stats.activeOffers, cls: "active" },
          ].map((s, i) => (
            <div key={i} className={`po-stat po-stat--${s.cls}`}>
              <div className="po-stat__val">{s.val}</div>
              <div className="po-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── PRODUCTS LIST ── */}
        {loading ? (
          <div className="po-state">
            <div className="po-state__spinner" />
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="po-state">
            <div className="po-state__icon">🕯️</div>
            <p>No products found</p>
          </div>
        ) : (
          <div className="po-products">
            {products.map((product) => {
              const isExpanded = expandedProduct === product.productId;
              const offersCount = getProductOffersCount(product);

              return (
                <div
                  key={product.productId}
                  className={`po-product-card ${isExpanded ? "po-product-card--expanded" : ""}`}
                >
                  {/* Product Header */}
                  <div
                    className="po-product-header"
                    onClick={() => toggleExpand(product.productId)}
                  >
                    <div className="po-product-header__left">
                      <div className="po-product-thumb">
                        {product.thumbnailImage ? (
                          <img
                            src={product.thumbnailImage}
                            alt={product.productName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/52x52?text=N/A";
                            }}
                          />
                        ) : (
                          <div className="po-product-thumb__empty">🕯️</div>
                        )}
                      </div>

                      <div className="po-product-info">
                        <div className="po-product-name">{product.productName}</div>
                        <div className="po-product-meta">
                          <span className="po-meta-chip po-meta-chip--cat">
                            {product.categoryName || "Uncategorized"}
                          </span>
                          <span className={`po-meta-chip po-meta-chip--type po-meta-chip--${product.type}`}>
                            {product.type}
                          </span>
                          {offersCount > 0 && (
                            <span className="po-meta-chip po-meta-chip--offers">
                              {offersCount} offer{offersCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="po-product-header__right">
                      <span className="po-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded: Colors */}
                  {isExpanded && (
                    <div className="po-product-body">

                      {product.type === "simple" && product.colors ? (
                        <div className="po-section">
                          <div className="po-section__title">
                            Color Variants
                            <span className="po-section__count">{product.colors.length}</span>
                          </div>
                          <div className="po-colors-grid">
                            {product.colors.map((color) => (
                              <ColorCard
                                key={color.colorId}
                                color={color}
                                product={product}
                                modelName={product.modelName || "Default"}
                                modelId=""
                                onEdit={(c, mn, mid) => openAddOffer(product, c, mn, mid)}
                                onRemove={(offerId, colorName) => {
                                  setRemoveOfferId(offerId);
                                  setRemoveColorName(colorName);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : product.type === "variable" && product.models ? (
                        product.models.map((model, mi) => (
                          <div key={mi} className="po-section">
                            <div className="po-section__title">
                              {model.modelName}
                              {model.SKU && (
                                <span className="po-section__sku"> · {model.SKU}</span>
                              )}
                            </div>
                            {model.colors?.length > 0 ? (
                              <div className="po-colors-grid">
                                {model.colors.map((color) => (
                                  <ColorCard
                                    key={color.colorId}
                                    color={color}
                                    product={product}
                                    modelName={model.modelName}
                                    modelId={model._id || model.modelId || ""}
                                    onEdit={(c, mn, mid) => openAddOffer(product, c, mn, mid)}
                                    onRemove={(offerId, colorName) => {
                                      setRemoveOfferId(offerId);
                                      setRemoveColorName(colorName);
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="po-empty">No colors for this model</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="po-empty">No colors available</p>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════
            MODAL: ADD / EDIT OFFER
        ════════════════════════════════════════════ */}
        {showAddOffer && selectedProduct && selectedColor && (
          <div className="po-modal-overlay" onClick={() => setShowAddOffer(false)}>
            <div className="po-modal" onClick={(e) => e.stopPropagation()}>
              <div className="po-modal-header">
                <div>
                  <h3 className="po-modal-title">
                    {selectedColor.hasOffer ? "Edit Offer" : "Add Offer"} — {selectedColor.colorName}
                  </h3>
                  <p className="po-modal-sub">
                    {selectedProduct.productName} · {selectedColor.modelName}
                  </p>
                </div>
                <button className="po-modal-close" onClick={() => setShowAddOffer(false)}>×</button>
              </div>

              <div className="po-modal-body">

                <div className="po-form-group">
                  <label>Offer Percentage <span className="po-req">*</span></label>
                  <div className="po-pct-wrap">
                    <input
                      type="number"
                      name="offerPercentage"
                      min="0"
                      max="100"
                      step="0.1"
                      value={offerForm.offerPercentage}
                      onChange={handleFormChange}
                      placeholder="e.g. 20"
                    />
                    <span className="po-pct-symbol">%</span>
                  </div>
                  <small>Enter discount percentage between 0 and 100</small>
                </div>

                <div className="po-form-group">
                  <label>Offer Label</label>
                  <input
                    type="text"
                    name="offerLabel"
                    value={offerForm.offerLabel}
                    onChange={handleFormChange}
                    placeholder="e.g. Summer Sale, Clearance..."
                  />
                </div>

                <div className="po-form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={offerForm.startDate}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="po-form-group">
                  <label className="po-checkbox-label">
                    <input
                      type="checkbox"
                      name="hasEndDate"
                      checked={offerForm.hasEndDate}
                      onChange={handleFormChange}
                    />
                    Set End Date
                    <span className="po-checkbox-hint">(leave unchecked for ongoing)</span>
                  </label>
                </div>

                {offerForm.hasEndDate && (
                  <div className="po-form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={offerForm.endDate}
                      onChange={handleFormChange}
                      min={offerForm.startDate}
                    />
                  </div>
                )}

              </div>

              <div className="po-modal-footer">
                <button
                  className="po-btn po-btn--outline"
                  onClick={() => setShowAddOffer(false)}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  className="po-btn po-btn--primary"
                  onClick={handleSaveOffer}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <><span className="po-spinner" /> Saving...</>
                  ) : selectedColor.hasOffer ? "Update Offer" : "Add Offer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            MODAL: REMOVE CONFIRM
        ════════════════════════════════════════════ */}
        {removeOfferId && (
          <div className="po-modal-overlay" onClick={() => { setRemoveOfferId(null); setRemoveColorName(""); }}>
            <div className="po-modal po-modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="po-modal-header po-modal-header--danger">
                <h3 className="po-modal-title">Remove Offer</h3>
                <button
                  className="po-modal-close"
                  onClick={() => { setRemoveOfferId(null); setRemoveColorName(""); }}
                >×</button>
              </div>
              <div className="po-modal-body">
                <div className="po-delete-confirm">
                  <div className="po-delete-confirm__icon">🗑️</div>
                  <p>
                    Remove offer for <strong>"{removeColorName}"</strong>?
                    This will deactivate the discount immediately.
                  </p>
                </div>
              </div>
              <div className="po-modal-footer">
                <button
                  className="po-btn po-btn--outline"
                  onClick={() => { setRemoveOfferId(null); setRemoveColorName(""); }}
                  disabled={removeLoading}
                >
                  Cancel
                </button>
                <button
                  className="po-btn po-btn--danger"
                  onClick={handleRemoveOffer}
                  disabled={removeLoading}
                >
                  {removeLoading ? <><span className="po-spinner" /> Removing...</> : "Yes, Remove"}
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

export default ProductOffers;