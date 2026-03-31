import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./ListProducts.scss";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("adminToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const formatPrice = (price) =>
  price
    ? `₹${parseFloat(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : "₹0.00";

const getDisplayPrice = (product) => {
  if (product.colors?.length > 0) {
    const prices = product.colors.map((c) => c.currentPrice).filter(Boolean);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max
        ? formatPrice(min)
        : `${formatPrice(min)} – ${formatPrice(max)}`;
    }
  }
  return "₹0.00";
};

const TAX_OPTIONS = [
  { value: 5, label: "5%" },
  { value: 18, label: "18%" },
  { value: 24, label: "24%" },
];

const EMPTY_FORM = {
  productName: "",
  description: "",
  categoryId: "",
  categoryName: "",
  hsnCode: "",
  taxSlab: 18,
  type: "simple",
  modelName: "",
  SKU: "",
  specifications: [],
  colors: [{
    colorId: `temp_${Date.now()}`,
    colorName: "White",
    sizes: [],
    images: [],
    originalPrice: "",
    currentPrice: "",
    colorSpecifications: [],
  }],
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ListProducts = () => {
  // ── Data ─────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [deactivatedProducts, setDeactivatedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("active"); // "active" | "deactivated"
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activateId, setActivateId] = useState(null);
  const [activateLoading, setActivateLoading] = useState(false);
  const [permanentDeleteId, setPermanentDeleteId] = useState(null); // NEW — for permanent delete
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false); // NEW
  const [searchTerm, setSearchTerm] = useState("");

  // ── Form State ────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [colorImages, setColorImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeactivatedProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/deactivated`);
      setDeactivatedProducts(res.data);
    } catch {
      toast.error("Failed to load deactivated products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchDeactivatedProducts(); // NEW — fetch deactivated products on page load
  }, []);

  // Fetch deactivated products when that tab is first opened (for refresh)
  useEffect(() => {
    if (activeTab === "deactivated") {
      fetchDeactivatedProducts();
    }
  }, [activeTab]);

  // ── Form Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      const cat = categories.find((c) => c.categoryId === value);
      setFormData((p) => ({ ...p, categoryId: value, categoryName: cat?.name || "" }));
    } else if (name === "productName") {
      setFormData((p) => ({ ...p, productName: value, modelName: value }));
    } else if (name === "taxSlab") {
      setFormData((p) => ({ ...p, taxSlab: parseInt(value) }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handlePriceChange = (field, value) => {
    setFormData((p) => {
      const colors = [...p.colors];
      colors[0] = { ...colors[0], [field]: value };
      return { ...p, colors };
    });
  };

  // Specs
  const addSpec = () =>
    setFormData((p) => ({ ...p, specifications: [...p.specifications, { key: "", value: "" }] }));
  const removeSpec = (i) =>
    setFormData((p) => ({ ...p, specifications: p.specifications.filter((_, idx) => idx !== i) }));
  const updateSpec = (i, field, val) =>
    setFormData((p) => {
      const s = [...p.specifications];
      s[i] = { ...s[i], [field]: val };
      return { ...p, specifications: s };
    });

  // Thumbnail
  const handleThumbnailChange = (e) => e.target.files[0] && setThumbnailFile(e.target.files[0]);

  // New gallery images
  const handleColorImagesChange = (e) => {
    if (e.target.files.length > 0)
      setColorImages((p) => [...p, ...Array.from(e.target.files)]);
  };
  const removeNewColorImage = (i) =>
    setColorImages((p) => p.filter((_, idx) => idx !== i));

  // Remove an existing saved image (marks it for deletion on submit)
  const removeExistingImage = (imgUrl) => {
    setRemovedImages((prev) => [...prev, imgUrl]);
    setFormData((p) => {
      const colors = [...p.colors];
      colors[0] = {
        ...colors[0],
        images: (colors[0].images || []).filter((img) => img !== imgUrl),
      };
      return { ...p, colors };
    });
  };

  // ── Submit: Add ───────────────────────────────────────────────────────────────

  const handleAddProduct = async () => {
    if (!formData.productName.trim())
      return toast.error("Product name is required");
    if (!formData.categoryId)
      return toast.error("Please select a category");
    if (!formData.SKU?.trim())
      return toast.error("SKU is required");
    if (!formData.colors?.[0]?.currentPrice || formData.colors[0].currentPrice <= 0)
      return toast.error("Please enter a valid current price");
    if (!formData.taxSlab)
      return toast.error("Please select a tax slab");
    if (!thumbnailFile)
      return toast.error("Thumbnail image is required");

    try {
      setFormLoading(true);

      const fd = new FormData();
      fd.append("productName", formData.productName);
      fd.append("description", formData.description || "");
      fd.append("categoryId", formData.categoryId);
      fd.append("categoryName", formData.categoryName || "");
      fd.append("hsnCode", formData.hsnCode || "");
      fd.append("taxSlab", formData.taxSlab);
      fd.append("type", "simple");
      fd.append("modelName", formData.modelName || formData.productName);
      fd.append("SKU", formData.SKU);

      const nonEmptySpecs = formData.specifications.filter(
        (s) => s.key?.trim() && s.value?.trim()
      );
      if (nonEmptySpecs.length > 0)
        fd.append("specifications", JSON.stringify(nonEmptySpecs));

      const whiteColor = {
        colorId: `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: [],
        originalPrice: formData.colors[0]?.originalPrice || 0,
        currentPrice: formData.colors[0]?.currentPrice || 0,
        colorSpecifications: [],
      };
      fd.append("colors", JSON.stringify([whiteColor]));
      fd.append("thumbnail", thumbnailFile);

      colorImages.forEach((img) => {
        if (img instanceof File) fd.append("colorImages[0]", img);
      });

      await axios.post(`${import.meta.env.VITE_API_URL}/products/add`, fd, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });

      toast.success("Product added successfully!");
      resetForm();
      fetchProducts();
      fetchDeactivatedProducts(); // Refresh deactivated count too
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add product");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Submit: Update ────────────────────────────────────────────────────────────

  const handleUpdateProduct = async () => {
    if (!formData.productId) return toast.error("Product ID is missing");

    try {
      setFormLoading(true);

      const existingColors = formData.colors || [];
      const updatedColor = {
        colorId: existingColors[0]?.colorId || `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: existingColors[0]?.images?.filter((i) => typeof i === "string") || [],
        originalPrice: formData.colors[0]?.originalPrice || 0,
        currentPrice: formData.colors[0]?.currentPrice || 0,
        colorSpecifications: [],
      };

      const fd = new FormData();
      fd.append("productName", formData.productName);
      fd.append("description", formData.description || "");
      fd.append("categoryId", formData.categoryId);
      fd.append("categoryName", formData.categoryName || "");
      fd.append("hsnCode", formData.hsnCode || "");
      fd.append("taxSlab", formData.taxSlab);
      fd.append("type", "simple");
      fd.append("modelName", formData.modelName || formData.productName);
      fd.append("SKU", formData.SKU || "");

      const nonEmptySpecs = formData.specifications.filter(
        (s) => s.key?.trim() && s.value?.trim()
      );
      fd.append("specifications", JSON.stringify(nonEmptySpecs));
      fd.append("colors", JSON.stringify([updatedColor]));

      if (removedImages.length > 0) {
        fd.append("removedImages", JSON.stringify(removedImages));
      }

      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

      colorImages.forEach((img) => {
        if (img instanceof File) fd.append("colorImages[0]", img);
      });

      await axios.put(
        `${import.meta.env.VITE_API_URL}/products/update/${formData.productId}`,
        fd,
        { headers: { ...authHeader(), "Content-Type": "multipart/form-data" } }
      );

      toast.success("Product updated successfully!");
      resetForm();
      fetchProducts();
      fetchDeactivatedProducts(); // Refresh deactivated list if any product was deactivated
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update product");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Soft Delete (Deactivate) ─────────────────────────────────────────────────

  const handleDeleteProduct = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`,
        { headers: authHeader() }
      );
      toast.success("Product deactivated successfully!");
      setDeleteId(null);
      fetchProducts();
      fetchDeactivatedProducts(); // Refresh deactivated list
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to deactivate product");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Permanent Delete ─────────────────────────────────────────────────────────

  const handlePermanentDeleteProduct = async () => {
    if (!permanentDeleteId) return;
    try {
      setPermanentDeleteLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/permanent/${permanentDeleteId}`,
        { headers: authHeader() }
      );
      toast.success("Product permanently deleted successfully!");
      setPermanentDeleteId(null);
      fetchProducts();
      fetchDeactivatedProducts(); // Refresh deactivated list
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to permanently delete product");
    } finally {
      setPermanentDeleteLoading(false);
    }
  };

  // ── Activate ──────────────────────────────────────────────────────────────────

  const handleActivateProduct = async () => {
    if (!activateId) return;
    try {
      setActivateLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/products/activate/${activateId}`,
        {},
        { headers: authHeader() }
      );
      toast.success("Product activated successfully!");
      setActivateId(null);
      fetchDeactivatedProducts();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to activate product");
    } finally {
      setActivateLoading(false);
    }
  };

  // ── Open Update Form ──────────────────────────────────────────────────────────

  const openUpdateForm = (product) => {
    setFormMode("update");
    setFormData({
      ...product,
      modelName: product.modelName || product.productName,
      specifications: product.specifications || [],
      hsnCode: product.hsnCode || "",
      taxSlab: product.taxSlab || 18,
      colors: product.colors?.length > 0
        ? product.colors
        : [{
          colorId: `temp_${Date.now()}`,
          colorName: "White",
          sizes: [],
          images: [],
          originalPrice: "",
          currentPrice: "",
          colorSpecifications: [],
        }],
    });
    setExistingThumbnail(product.thumbnailImage || "");
    setThumbnailFile(null);
    setColorImages([]);
    setRemovedImages([]);
    setShowForm(true);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      colors: [{ ...EMPTY_FORM.colors[0], colorId: `temp_${Date.now()}` }],
    });
    setThumbnailFile(null);
    setExistingThumbnail("");
    setColorImages([]);
    setRemovedImages([]);
    setShowForm(false);
    setFormMode("add");
  };

  // ── Filtered lists ────────────────────────────────────────────────────────────

  const filteredActive = products.filter(
    (p) =>
      !searchTerm ||
      p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.SKU?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeactivated = deactivatedProducts.filter(
    (p) =>
      !searchTerm ||
      p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.SKU?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Shared product row renderer ───────────────────────────────────────────────

  const renderProductRow = (p, isDeactivated = false) => (
    <tr key={p.productId}>
      <td className="td-img">
        {p.thumbnailImage ? (
          <img
            src={p.thumbnailImage}
            alt={p.productName}
            className="product-thumb"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/48x48?text=N/A";
            }}
          />
        ) : (
          <div className="product-thumb product-thumb--empty">—</div>
        )}
      </td>

      <td className="td-name">
        <div className="product-name">{p.productName}</div>
        <div className="product-variants">{p.colors?.length || 0} variant(s)</div>
      </td>

      <td className="td-cat">
        <span className="cat-chip">{p.categoryName || "—"}</span>
      </td>

      <td className="td-sku">{p.SKU || "—"}</td>
      <td className="td-hsn">{p.hsnCode || "—"}</td>

      <td className="td-tax">
        <span className="tax-chip">{p.taxSlab || 18}%</span>
      </td>

      <td className="td-price">
        <span className="price-val">{getDisplayPrice(p)}</span>
      </td>

      <td className="td-status">
        <span className={`status-dot ${p.isActive ? "active" : "inactive"}`}>
          <span className="dot" />
          {p.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="td-actions">
        {isDeactivated ? (
          // Deactivated tab — Activate + Permanent Delete buttons
          <>
            <button
              className="action-btn action-btn--activate"
              onClick={() => setActivateId(p.productId)}
              disabled={loading}
            >
              Activate
            </button>
            <button
              className="action-btn action-btn--permanent-delete"
              onClick={() => setPermanentDeleteId(p.productId)}
              disabled={loading}
            >
              Delete
            </button>
          </>
        ) : (
          // Active tab — Edit + Soft Delete
          <>
            <button
              className="action-btn action-btn--edit"
              onClick={() => openUpdateForm(p)}
              disabled={loading}
            >
              Edit
            </button>
            <button
              className="action-btn action-btn--delete"
              onClick={() => setDeleteId(p.productId)}
              disabled={loading}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  const currentList = activeTab === "active" ? filteredActive : filteredDeactivated;
  const isDeactivatedTab = activeTab === "deactivated";

  return (
    <AdminLayout>
      <div className="list-products">

        {/* ── HEADER ── */}
        <div className="lp-header">
          <div className="lp-header__left">
            <h1 className="lp-header__title">Products</h1>
            <span className="lp-header__count">
              {activeTab === "active"
                ? `${products.length} active`
                : `${deactivatedProducts.length} deactivated`}
            </span>
          </div>
          {/* Only show Add button on active tab */}
          {!isDeactivatedTab && (
            <button
              className="btn btn--primary"
              onClick={() => { setFormMode("add"); resetForm(); setShowForm(true); }}
              disabled={loading}
            >
              + Add Product
            </button>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="lp-tabs">
          <button
            className={`lp-tab ${activeTab === "active" ? "lp-tab--active" : ""}`}
            onClick={() => { setActiveTab("active"); setSearchTerm(""); }}
          >
            Active
            <span className="lp-tab__badge">{products.length}</span>
          </button>
          <button
            className={`lp-tab ${activeTab === "deactivated" ? "lp-tab--active" : ""}`}
            onClick={() => { setActiveTab("deactivated"); setSearchTerm(""); }}
          >
            Deactivated
            <span className="lp-tab__badge lp-tab__badge--inactive">
              {deactivatedProducts.length}
            </span>
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div className="lp-search-wrap">
          <div className="lp-search">
            <span className="lp-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Search by name, category or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="lp-search__clear" onClick={() => setSearchTerm("")}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── TABLE ── */}
        {loading && currentList.length === 0 ? (
          <div className="lp-state">
            <div className="lp-state__spinner" />
            <p>Loading products...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="lp-state">
            <div className="lp-state__icon">📦</div>
            <p>
              {searchTerm
                ? "No products match your search"
                : isDeactivatedTab
                  ? "No deactivated products"
                  : "No products yet. Add your first product!"}
            </p>
          </div>
        ) : (
          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>HSN</th>
                  <th>Tax</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((p) => renderProductRow(p, isDeactivatedTab))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            FORM MODAL
        ════════════════════════════════════════════════ */}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal modal--xl" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {formMode === "add" ? "Add New Product" : "Update Product"}
                  </h3>
                  <p className="modal-sub">
                    {formMode === "add"
                      ? "Fill in the product details below"
                      : `Editing: ${formData.productName}`}
                  </p>
                </div>
                <button className="modal-close" onClick={resetForm}>×</button>
              </div>

              <div className="modal-body">

                {/* ── Basic Info ── */}
                <div className="form-section">
                  <div className="form-section__title">Basic Information</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Name <span className="req">*</span></label>
                      <input
                        name="productName"
                        placeholder="Enter product name"
                        value={formData.productName}
                        onChange={handleChange}
                      />
                      <small>Model name will be auto-filled same as product name</small>
                    </div>
                    <div className="form-group">
                      <label>Category <span className="req">*</span></label>
                      <select name="categoryId" value={formData.categoryId} onChange={handleChange}>
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>SKU <span className="req">*</span></label>
                      <input
                        name="SKU"
                        placeholder="Enter SKU"
                        value={formData.SKU}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>HSN Code</label>
                      <input
                        name="hsnCode"
                        placeholder="Enter HSN Code"
                        value={formData.hsnCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tax Slab <span className="req">*</span></label>
                      <select name="taxSlab" value={formData.taxSlab} onChange={handleChange}>
                        {TAX_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" />
                  </div>

                  <div className="form-group form-group--full">
                    <label>Description</label>
                    <textarea
                      name="description"
                      placeholder="Enter product description..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>

                {/* ── Pricing ── */}
                <div className="form-section">
                  <div className="form-section__title">Pricing</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Original Price (MRP)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="₹ 0.00"
                        value={formData.colors[0]?.originalPrice || ""}
                        onChange={(e) => handlePriceChange("originalPrice", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Selling Price <span className="req">*</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="₹ 0.00"
                        value={formData.colors[0]?.currentPrice || ""}
                        onChange={(e) => handlePriceChange("currentPrice", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Thumbnail ── */}
                <div className="form-section">
                  <div className="form-section__title">
                    Thumbnail Image {formMode === "add" && <span className="req">*</span>}
                  </div>
                  <div className="form-group">
                    <div className="file-upload-wrap">
                      <label className="file-upload-label">
                        <span className="file-upload-icon">📁</span>
                        <span>
                          {thumbnailFile ? thumbnailFile.name : "Choose thumbnail image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          hidden
                        />
                      </label>
                    </div>
                    {!thumbnailFile && existingThumbnail && (
                      <div className="existing-thumb">
                        <span className="existing-label">Current:</span>
                        <img src={existingThumbnail} alt="Current thumbnail" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Gallery Images ── */}
                <div className="form-section">
                  <div className="form-section__title">Product Gallery Images</div>
                  <div className="form-group">
                    <div className="file-upload-wrap">
                      <label className="file-upload-label">
                        <span className="file-upload-icon">🖼</span>
                        <span>Add product images (multiple allowed)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleColorImagesChange}
                          hidden
                        />
                      </label>
                    </div>

                    {/* Existing saved images — with remove button */}
                    {formData.colors[0]?.images?.filter((i) => typeof i === "string").length > 0 && (
                      <div className="image-grid">
                        {formData.colors[0].images
                          .filter((i) => typeof i === "string")
                          .map((img, idx) => (
                            <div key={`ex-${idx}`} className="image-grid__item">
                              <img src={img} alt={`Product ${idx + 1}`} />
                              <span className="image-grid__label">Saved</span>
                              <button
                                type="button"
                                className="image-grid__remove"
                                onClick={() => removeExistingImage(img)}
                                title="Remove this image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Newly added files */}
                    {colorImages.length > 0 && (
                      <div className="image-grid">
                        {colorImages.map((img, idx) => (
                          <div key={`new-${idx}`} className="image-grid__item">
                            <img src={URL.createObjectURL(img)} alt={img.name} />
                            <button
                              type="button"
                              className="image-grid__remove"
                              onClick={() => removeNewColorImage(idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show removed count as info */}
                    {removedImages.length > 0 && (
                      <p className="removed-images-note">
                        {removedImages.length} image{removedImages.length > 1 ? "s" : ""} will be removed on save.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Specifications ── */}
                <div className="form-section">
                  <div className="form-section__header">
                    <div className="form-section__title">Specifications</div>
                    <button
                      type="button"
                      className="btn btn--sm btn--outline"
                      onClick={addSpec}
                    >
                      + Add Spec
                    </button>
                  </div>

                  {formData.specifications.length === 0 ? (
                    <p className="empty-specs">No specifications added yet.</p>
                  ) : (
                    <div className="specs-list">
                      {formData.specifications.map((spec, i) => (
                        <div key={i} className="spec-row">
                          <input
                            placeholder="Key (e.g. Weight)"
                            value={spec.key}
                            onChange={(e) => updateSpec(i, "key", e.target.value)}
                          />
                          <input
                            placeholder="Value (e.g. 200g)"
                            value={spec.value}
                            onChange={(e) => updateSpec(i, "value", e.target.value)}
                          />
                          <button
                            type="button"
                            className="spec-remove"
                            onClick={() => removeSpec(i)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>{/* modal-body */}

              <div className="modal-footer">
                <button
                  className="btn btn--outline"
                  onClick={resetForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  onClick={formMode === "add" ? handleAddProduct : handleUpdateProduct}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="btn-spinner" />
                      {formMode === "add" ? "Adding..." : "Updating..."}
                    </>
                  ) : (
                    formMode === "add" ? "Add Product" : "Update Product"
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            SOFT DELETE CONFIRM MODAL (Deactivate)
        ════════════════════════════════════════════════ */}
        {deleteId && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header--danger">
                <h3 className="modal-title">Confirm Deactivate</h3>
                <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="delete-confirm">
                  <div className="delete-confirm__icon">🗑️</div>
                  <p>
                    This will <strong>deactivate</strong> the product. It won't be visible
                    on the store. Are you sure?
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn--outline"
                  onClick={() => setDeleteId(null)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--danger"
                  onClick={handleDeleteProduct}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <><span className="btn-spinner btn-spinner--dark" /> Deactivating...</>
                  ) : (
                    "Yes, Deactivate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            ACTIVATE CONFIRM MODAL
        ════════════════════════════════════════════════ */}
        {activateId && (
          <div className="modal-overlay" onClick={() => setActivateId(null)}>
            <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header--success">
                <h3 className="modal-title">Confirm Activate</h3>
                <button className="modal-close" onClick={() => setActivateId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="delete-confirm">
                  <div className="delete-confirm__icon">✅</div>
                  <p>
                    This will <strong>activate</strong> the product and make it visible
                    on the store again. Are you sure?
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn--outline"
                  onClick={() => setActivateId(null)}
                  disabled={activateLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--success"
                  onClick={handleActivateProduct}
                  disabled={activateLoading}
                >
                  {activateLoading ? (
                    <><span className="btn-spinner btn-spinner--dark" /> Activating...</>
                  ) : (
                    "Yes, Activate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            PERMANENT DELETE CONFIRM MODAL ← NEW
        ════════════════════════════════════════════════ */}
        {permanentDeleteId && (
          <div className="modal-overlay" onClick={() => setPermanentDeleteId(null)}>
            <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header--permanent">
                <h3 className="modal-title">Permanent Delete</h3>
                <button className="modal-close" onClick={() => setPermanentDeleteId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="delete-confirm">
                  <div className="delete-confirm__icon">⚠️</div>
                  <p>
                    This will <strong>permanently delete</strong> the product and all its images.
                    <br />
                    <span style={{ color: '#c0392b', fontWeight: 'bold' }}>
                      This action cannot be undone!
                    </span>
                    <br />
                    Are you absolutely sure?
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn--outline"
                  onClick={() => setPermanentDeleteId(null)}
                  disabled={permanentDeleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--danger"
                  onClick={handlePermanentDeleteProduct}
                  disabled={permanentDeleteLoading}
                >
                  {permanentDeleteLoading ? (
                    <><span className="btn-spinner btn-spinner--dark" /> Deleting Permanently...</>
                  ) : (
                    "Yes, Delete Permanently"
                  )}
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

export default ListProducts;