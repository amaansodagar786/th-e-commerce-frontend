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
  price ? `₹${parseFloat(price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

const getDisplayPrice = (product) => {
  if (product.colors?.length > 0) {
    const prices = product.colors.map((c) => c.currentPrice).filter(Boolean);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
    }
  }
  return "₹0.00";
};

const TAX_OPTIONS = [
  { value: 5,  label: "5%"  },
  { value: 18, label: "18%" },
  { value: 24, label: "24%" },
];

const EMPTY_FORM = {
  productName:    "",
  description:    "",
  categoryId:     "",
  categoryName:   "",
  hsnCode:        "",
  taxSlab:        18,
  type:           "simple",
  modelName:      "",
  SKU:            "",
  specifications: [],
  colors: [{
    colorId:           `temp_${Date.now()}`,
    colorName:         "White",
    sizes:             [],
    images:            [],
    originalPrice:     "",
    currentPrice:      "",
    colorSpecifications: [],
  }],
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ListProducts = () => {
  const [products,          setProducts]          = useState([]);
  const [categories,        setCategories]        = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [formLoading,       setFormLoading]       = useState(false);
  const [showForm,          setShowForm]          = useState(false);
  const [formMode,          setFormMode]          = useState("add");
  const [deleteId,          setDeleteId]          = useState(null);
  const [deleteLoading,     setDeleteLoading]     = useState(false);
  const [searchTerm,        setSearchTerm]        = useState("");

  const [formData,          setFormData]          = useState(EMPTY_FORM);
  const [thumbnailFile,     setThumbnailFile]     = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [colorImages,       setColorImages]       = useState([]);

  // ── Fetch ────────────────────────────────────────────────────────────────────

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
  }, []);

  // ── Form Handlers ────────────────────────────────────────────────────────────

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
  const addSpec    = () => setFormData((p) => ({ ...p, specifications: [...p.specifications, { key: "", value: "" }] }));
  const removeSpec = (i) => setFormData((p) => ({ ...p, specifications: p.specifications.filter((_, idx) => idx !== i) }));
  const updateSpec = (i, field, val) =>
    setFormData((p) => {
      const s = [...p.specifications];
      s[i] = { ...s[i], [field]: val };
      return { ...p, specifications: s };
    });

  // Images
  const handleThumbnailChange   = (e) => e.target.files[0] && setThumbnailFile(e.target.files[0]);
  const handleColorImagesChange = (e) => {
    if (e.target.files.length > 0)
      setColorImages((p) => [...p, ...Array.from(e.target.files)]);
  };
  const removeColorImage = (i) => setColorImages((p) => p.filter((_, idx) => idx !== i));

  // ── Submit: Add ──────────────────────────────────────────────────────────────

  const handleAddProduct = async () => {
    if (!formData.productName.trim())                             return toast.error("Product name is required");
    if (!formData.categoryId)                                     return toast.error("Please select a category");
    if (!formData.SKU?.trim())                                    return toast.error("SKU is required");
    if (!formData.colors?.[0]?.currentPrice || formData.colors[0].currentPrice <= 0)
                                                                  return toast.error("Please enter a valid current price");
    if (!formData.taxSlab)                                        return toast.error("Please select a tax slab");
    if (!thumbnailFile)                                           return toast.error("Thumbnail image is required");

    try {
      setFormLoading(true);

      const fd = new FormData();
      fd.append("productName",  formData.productName);
      fd.append("description",  formData.description || "");
      fd.append("categoryId",   formData.categoryId);
      fd.append("categoryName", formData.categoryName || "");
      fd.append("hsnCode",      formData.hsnCode || "");
      fd.append("taxSlab",      formData.taxSlab);
      fd.append("type",         "simple");
      fd.append("modelName",    formData.modelName || formData.productName);
      fd.append("SKU",          formData.SKU);

      const nonEmptySpecs = formData.specifications.filter(
        (s) => s.key?.trim() && s.value?.trim()
      );
      if (nonEmptySpecs.length > 0)
        fd.append("specifications", JSON.stringify(nonEmptySpecs));

      const whiteColor = {
        colorId:             `temp_${Date.now()}_1`,
        colorName:           "White",
        sizes:               [],
        images:              [],
        originalPrice:       formData.colors[0]?.originalPrice || 0,
        currentPrice:        formData.colors[0]?.currentPrice  || 0,
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
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add product");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Submit: Update ───────────────────────────────────────────────────────────

  const handleUpdateProduct = async () => {
    if (!formData.productId) return toast.error("Product ID is missing");

    try {
      setFormLoading(true);

      const existingColors = formData.colors || [];
      const updatedColor = {
        colorId:             existingColors[0]?.colorId || `temp_${Date.now()}_1`,
        colorName:           "White",
        sizes:               [],
        images:              existingColors[0]?.images?.filter((i) => typeof i === "string") || [],
        originalPrice:       formData.colors[0]?.originalPrice || 0,
        currentPrice:        formData.colors[0]?.currentPrice  || 0,
        colorSpecifications: [],
      };

      const fd = new FormData();
      fd.append("productName",  formData.productName);
      fd.append("description",  formData.description || "");
      fd.append("categoryId",   formData.categoryId);
      fd.append("categoryName", formData.categoryName || "");
      fd.append("hsnCode",      formData.hsnCode || "");
      fd.append("taxSlab",      formData.taxSlab);
      fd.append("type",         "simple");
      fd.append("modelName",    formData.modelName || formData.productName);
      fd.append("SKU",          formData.SKU || "");

      const nonEmptySpecs = formData.specifications.filter(
        (s) => s.key?.trim() && s.value?.trim()
      );
      fd.append("specifications", JSON.stringify(nonEmptySpecs));
      fd.append("colors", JSON.stringify([updatedColor]));

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
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update product");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDeleteProduct = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`, {
        headers: authHeader(),
      });
      toast.success("Product deactivated successfully!");
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Open Update Form ─────────────────────────────────────────────────────────

  const openUpdateForm = (product) => {
    setFormMode("update");
    setFormData({
      ...product,
      modelName:      product.modelName      || product.productName,
      specifications: product.specifications || [],
      hsnCode:        product.hsnCode        || "",
      taxSlab:        product.taxSlab        || 18,
      colors: product.colors?.length > 0
        ? product.colors
        : [{ colorId: `temp_${Date.now()}`, colorName: "White", sizes: [], images: [], originalPrice: "", currentPrice: "", colorSpecifications: [] }],
    });
    setExistingThumbnail(product.thumbnailImage || "");
    setThumbnailFile(null);
    setColorImages([]);
    setShowForm(true);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, colors: [{ ...EMPTY_FORM.colors[0], colorId: `temp_${Date.now()}` }] });
    setThumbnailFile(null);
    setExistingThumbnail("");
    setColorImages([]);
    setShowForm(false);
    setFormMode("add");
  };

  // ── Filtered ─────────────────────────────────────────────────────────────────

  const filtered = products.filter(
    (p) =>
      !searchTerm ||
      p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.SKU?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="list-products">

        {/* ── HEADER ── */}
        <div className="lp-header">
          <div className="lp-header__left">
            <h1 className="lp-header__title">Products</h1>
            <span className="lp-header__count">{products.length} total</span>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => { setFormMode("add"); resetForm(); setShowForm(true); }}
            disabled={loading}
          >
            + Add Product
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
              <button className="lp-search__clear" onClick={() => setSearchTerm("")}>×</button>
            )}
          </div>
        </div>

        {/* ── TABLE ── */}
        {loading && products.length === 0 ? (
          <div className="lp-state">
            <div className="lp-state__spinner" />
            <p>Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="lp-state">
            <div className="lp-state__icon">📦</div>
            <p>{searchTerm ? "No products match your search" : "No products yet. Add your first product!"}</p>
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
                {filtered.map((p) => (
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
                      <div className="product-variants">
                        {p.colors?.length || 0} variant(s)
                      </div>
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
                    </td>
                  </tr>
                ))}
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
                    {formMode === "add" ? "Fill in the product details below" : `Editing: ${formData.productName}`}
                  </p>
                </div>
                <button className="modal-close" onClick={resetForm}>×</button>
              </div>

              <div className="modal-body">

                {/* Basic Info */}
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
                          <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
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

                {/* Pricing */}
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

                {/* Images */}
                <div className="form-section">
                  <div className="form-section__title">
                    Thumbnail Image {formMode === "add" && <span className="req">*</span>}
                  </div>
                  <div className="form-group">
                    <div className="file-upload-wrap">
                      <label className="file-upload-label">
                        <span className="file-upload-icon">📁</span>
                        <span>{thumbnailFile ? thumbnailFile.name : "Choose thumbnail image"}</span>
                        <input type="file" accept="image/*" onChange={handleThumbnailChange} hidden />
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

                    {/* Existing images from DB */}
                    {formData.colors[0]?.images?.filter((i) => typeof i === "string").length > 0 && (
                      <div className="image-grid">
                        {formData.colors[0].images
                          .filter((i) => typeof i === "string")
                          .map((img, idx) => (
                            <div key={`ex-${idx}`} className="image-grid__item">
                              <img src={img} alt={`Product ${idx + 1}`} />
                              <span className="image-grid__label">Saved</span>
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
                              onClick={() => removeColorImage(idx)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Specifications */}
                <div className="form-section">
                  <div className="form-section__header">
                    <div className="form-section__title">Specifications</div>
                    <button type="button" className="btn btn--sm btn--outline" onClick={addSpec}>
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
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>{/* modal-body */}

              <div className="modal-footer">
                <button className="btn btn--outline" onClick={resetForm} disabled={formLoading}>
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  onClick={formMode === "add" ? handleAddProduct : handleUpdateProduct}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <><span className="btn-spinner" /> {formMode === "add" ? "Adding..." : "Updating..."}</>
                  ) : (
                    formMode === "add" ? "Add Product" : "Update Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            DELETE CONFIRM MODAL
        ════════════════════════════════════════════════ */}
        {deleteId && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header--danger">
                <h3 className="modal-title">Confirm Delete</h3>
                <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="delete-confirm">
                  <div className="delete-confirm__icon">🗑️</div>
                  <p>This will <strong>deactivate</strong> the product. It won't be visible on the store. Are you sure?</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn--outline" onClick={() => setDeleteId(null)} disabled={deleteLoading}>
                  Cancel
                </button>
                <button className="btn btn--danger" onClick={handleDeleteProduct} disabled={deleteLoading}>
                  {deleteLoading ? <><span className="btn-spinner btn-spinner--dark" /> Deleting...</> : "Yes, Delete"}
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