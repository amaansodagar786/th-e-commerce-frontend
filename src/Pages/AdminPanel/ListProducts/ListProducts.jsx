import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ListProducts.scss";

const ListProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    categoryId: "",
    categoryName: "",
    hsnCode: "",
    taxSlab: 18, // Default tax slab
    type: "simple", // Always simple
    // Simple product fields
    modelName: "", // Will auto-fill with product name
    SKU: "",
    specifications: [],
    colors: [] // Will auto-create with White color
  });

  // File states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [colorImages, setColorImages] = useState([]); // For the default White color

  // Tax slab options
  const taxSlabOptions = [
    { value: 5, label: "5%" },
    { value: 18, label: "18%" },
    { value: 24, label: "24%" }
  ];

  // Fetch products and categories
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      const selectedCat = categories.find(cat => cat.categoryId === value);
      setFormData({
        ...formData,
        categoryId: value,
        categoryName: selectedCat ? selectedCat.name : "",
        modelName: formData.productName // Auto-update model name if product name is being changed
      });
    } else if (name === "productName") {
      // Auto-update model name when product name changes
      setFormData({
        ...formData,
        productName: value,
        modelName: value // Model name always same as product name
      });
    } else if (name === "taxSlab") {
      setFormData({ 
        ...formData, 
        [name]: parseInt(value) // Convert to number
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // GLOBAL SPECIFICATIONS
  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...formData.specifications];
    updatedSpecs[index][field] = value;
    setFormData({ ...formData, specifications: updatedSpecs });
  };

  const addSpecField = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: "", value: "" }]
    });
  };

  const removeSpecField = (index) => {
    const updatedSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: updatedSpecs });
  };

  // COLOR IMAGES for the default White color
  const handleColorImagesChange = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setColorImages([...colorImages, ...newFiles]);
    }
  };

  const removeColorImage = (imageIndex) => {
    setColorImages(colorImages.filter((_, i) => i !== imageIndex));
  };

  // IMAGE HANDLING
  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  // Helper to check if image is a URL
  const isImageUrl = (img) => {
    return typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'));
  };

  // Helper to get image source
  const getImageSrc = (img) => {
    if (isImageUrl(img)) {
      return img;
    } else if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return "";
  };

  // Helper to get image name
  const getImageName = (img) => {
    if (isImageUrl(img)) {
      return img.split('/').pop();
    } else if (img instanceof File) {
      return img.name;
    }
    return "Image";
  };

  // ADD PRODUCT
  const addProduct = async () => {
    try {
      // Validation
      if (!formData.productName.trim()) {
        alert("Product name is required");
        return;
      }
      if (!formData.categoryId) {
        alert("Please select a category");
        return;
      }
      if (!formData.SKU?.trim()) {
        alert("SKU is required");
        return;
      }
      if (!formData.colors?.[0]?.currentPrice || formData.colors[0].currentPrice <= 0) {
        alert("Please enter a valid current price");
        return;
      }
      if (!formData.taxSlab) {
        alert("Please select a tax slab");
        return;
      }

      if (!thumbnailFile && formMode === "add") {
        alert("Thumbnail image is required");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      // Prepare the default White color
      const whiteColor = {
        colorId: `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: [],
        originalPrice: formData.colors[0]?.originalPrice || 0,
        currentPrice: formData.colors[0]?.currentPrice || 0,
        colorSpecifications: []
      };

      const formDataToSend = new FormData();

      // Append basic data
      formDataToSend.append("productName", formData.productName);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("categoryName", formData.categoryName || "");
      formDataToSend.append("hsnCode", formData.hsnCode || "");
      formDataToSend.append("taxSlab", formData.taxSlab);
      formDataToSend.append("type", "simple"); // Always simple
      formDataToSend.append("modelName", formData.modelName || formData.productName); // Auto-fill
      formDataToSend.append("SKU", formData.SKU);

      // Append specifications if any
      const nonEmptySpecs = formData.specifications.filter(
        spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
      );
      if (nonEmptySpecs.length > 0) {
        formDataToSend.append("specifications", JSON.stringify(nonEmptySpecs));
      }

      // Append the default White color
      formDataToSend.append("colors", JSON.stringify([whiteColor]));

      // Append thumbnail file
      if (thumbnailFile) {
        formDataToSend.append("thumbnail", thumbnailFile);
      }

      // Append color images for the default White color
      if (colorImages.length > 0) {
        colorImages.forEach((imgFile, index) => {
          if (imgFile instanceof File) {
            formDataToSend.append(`colorImages[0]`, imgFile);
          }
        });
      }

      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Product added successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      alert(err.response?.data?.error || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // UPDATE PRODUCT
  const updateProduct = async () => {
    try {
      if (!formData.productId) {
        alert("Product ID is missing");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      // Prepare updated colors (preserve existing colorId if updating)
      const existingColors = formData.colors || [];
      const updatedColor = {
        colorId: existingColors[0]?.colorId || `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: existingColors[0]?.images?.filter(img => typeof img === 'string') || [],
        originalPrice: formData.colors[0]?.originalPrice || 0,
        currentPrice: formData.colors[0]?.currentPrice || 0,
        colorSpecifications: []
      };

      const formDataToSend = new FormData();

      // Append basic data
      formDataToSend.append("productName", formData.productName);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("categoryName", formData.categoryName || "");
      formDataToSend.append("hsnCode", formData.hsnCode || "");
      formDataToSend.append("taxSlab", formData.taxSlab);
      formDataToSend.append("type", "simple");
      formDataToSend.append("modelName", formData.modelName || formData.productName);
      formDataToSend.append("SKU", formData.SKU || "");

      // Append specifications
      const nonEmptySpecs = formData.specifications.filter(
        spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
      );
      formDataToSend.append("specifications", JSON.stringify(nonEmptySpecs));

      // Append colors
      formDataToSend.append("colors", JSON.stringify([updatedColor]));

      // Append thumbnail file
      if (thumbnailFile) {
        formDataToSend.append("thumbnail", thumbnailFile);
      }

      // Append new color images
      if (colorImages.length > 0) {
        colorImages.forEach((imgFile, index) => {
          if (imgFile instanceof File) {
            formDataToSend.append(`colorImages[0]`, imgFile);
          }
        });
      }

      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/products/update/${formData.productId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Product updated successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      alert(err.response?.data?.error || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // DELETE PRODUCT
  const deleteProduct = async () => {
    try {
      if (!deleteId) return;

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Product deactivated successfully!");
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(err.response?.data?.error || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // OPEN UPDATE FORM
  const openUpdateForm = (product) => {
    setFormMode("update");

    const preparedData = {
      ...product,
      modelName: product.modelName || product.productName, // Auto-fill model name
      specifications: product.specifications || [],
      colors: product.colors || [{
        colorId: `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: [],
        originalPrice: "",
        currentPrice: "",
        colorSpecifications: []
      }],
      hsnCode: product.hsnCode || "",
      taxSlab: product.taxSlab || 18
    };

    setFormData(preparedData);
    setExistingThumbnail(product.thumbnailImage || "");
    setThumbnailFile(null);
    
    // Set existing color images if any
    if (preparedData.colors[0]?.images) {
      setColorImages([]); // We'll only show existing URLs, not file objects
    } else {
      setColorImages([]);
    }
    
    setShowForm(true);
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({
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
        colorId: `temp_${Date.now()}_1`,
        colorName: "White",
        sizes: [],
        images: [],
        originalPrice: "",
        currentPrice: "",
        colorSpecifications: []
      }]
    });
    setThumbnailFile(null);
    setExistingThumbnail("");
    setColorImages([]);
    setShowForm(false);
  };

  // Format price
  const formatPrice = (price) => {
    return price ? parseFloat(price).toFixed(2) : "0.00";
  };

  // Get display price
  const getDisplayPrice = (product) => {
    if (product.type === "simple") {
      if (product.colors && product.colors.length > 0) {
        const prices = product.colors.map(c => c.currentPrice).filter(p => p);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          return minPrice === maxPrice ?
            `₹${formatPrice(minPrice)}` :
            `₹${formatPrice(minPrice)} - ₹${formatPrice(maxPrice)}`;
        }
      }
      return "₹0.00";
    } else {
      return "Variable Pricing";
    }
  };

  // Get color count
  const getColorCount = (product) => {
    if (product.type === "simple") {
      return product.colors?.length || 0;
    } else {
      let total = 0;
      if (product.models) {
        product.models.forEach(model => {
          total += model.colors?.length || 0;
        });
      }
      return total;
    }
  };

  return (
    <div className="list-products">
      <div className="header">
        <h2>Products ({products.length})</h2>
        <button
          onClick={() => {
            setFormMode("add");
            resetForm();
            setShowForm(true);
          }}
          disabled={loading}
        >
          + Add Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="no-products">
          <p>No products found. Add your first product!</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>SKU</th>
              <th>Variants</th>
              <th>HSN</th>
              <th>Tax Slab</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productId}>
                <td>
                  {p.thumbnailImage && (
                    <img
                      src={p.thumbnailImage}
                      alt={p.productName}
                      className="thumbnail"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                      }}
                    />
                  )}
                </td>
                <td>{p.productName}</td>
                <td>{p.categoryName}</td>
                <td>
                  <span className={`type-badge ${p.type}`}>
                    {p.type}
                  </span>
                </td>
                <td>{p.SKU || "-"}</td>
                <td>
                  <span className="variant-count">
                    {getColorCount(p)} color(s)
                  </span>
                </td>
                <td>{p.hsnCode || "-"}</td>
                <td>{p.taxSlab || 18}%</td>
                <td>
                  {getDisplayPrice(p)}
                </td>
                <td>
                  <span className={`status ${p.isActive ? 'active' : 'inactive'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="edit"
                    onClick={() => openUpdateForm(p)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="delete"
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
      )}

      {showForm && (
        <div className="popup">
          <div className="popup-box large">
            <div className="popup-header">
              <h3>{formMode === "add" ? "Add Product" : "Update Product"}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <div className="form">
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      name="productName"
                      placeholder="Enter product name"
                      value={formData.productName}
                      onChange={handleChange}
                      required
                    />
                    <small className="note">(Model name will be auto-filled same as product name)</small>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group">
                    <label>HSN Code</label>
                    <input
                      name="hsnCode"
                      placeholder="Enter HSN Code"
                      value={formData.hsnCode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tax Slab *</label>
                    <select
                      name="taxSlab"
                      value={formData.taxSlab}
                      onChange={handleChange}
                      required
                    >
                      {taxSlabOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      name="SKU"
                      placeholder="Enter SKU"
                      value={formData.SKU}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Description</label>
                  <textarea
                    name="description"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Thumbnail Image {formMode === "add" && "*"}</h4>
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                  {thumbnailFile && (
                    <div className="file-preview">
                      Selected: {thumbnailFile.name}
                    </div>
                  )}
                  {!thumbnailFile && existingThumbnail && (
                    <div className="existing-image">
                      <p>Current thumbnail:</p>
                      <img
                        src={existingThumbnail}
                        alt="Current thumbnail"
                        className="thumb-preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>Product Specifications</h4>
                <div className="section-header">
                  <button type="button" onClick={addSpecField} className="add-btn small">
                    + Add Specification
                  </button>
                </div>

                {formData.specifications.length === 0 ? (
                  <p className="no-items">No specifications added yet.</p>
                ) : (
                  formData.specifications.map((spec, index) => (
                    <div key={index} className="spec-row">
                      <input
                        placeholder="Key"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                        className="spec-input"
                      />
                      <input
                        placeholder="Value"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                        className="spec-input"
                      />
                      <button
                        type="button"
                        className="remove-btn small"
                        onClick={() => removeSpecField(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="form-section">
                <h4>Product Details</h4>
                <div className="row">
                  <div className="form-group">
                    <label>Original Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.colors[0]?.originalPrice || ""}
                      onChange={(e) => {
                        const updatedColors = [...formData.colors];
                        if (updatedColors[0]) {
                          updatedColors[0].originalPrice = e.target.value;
                        }
                        setFormData({ ...formData, colors: updatedColors });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.colors[0]?.currentPrice || ""}
                      onChange={(e) => {
                        const updatedColors = [...formData.colors];
                        if (updatedColors[0]) {
                          updatedColors[0].currentPrice = e.target.value;
                        }
                        setFormData({ ...formData, colors: updatedColors });
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleColorImagesChange}
                  />
                  {(colorImages.length > 0 || (formData.colors[0]?.images?.length > 0)) && (
                    <div className="color-images">
                      <p>Selected images: {colorImages.length + (formData.colors[0]?.images?.filter(img => typeof img === 'string').length || 0)}</p>
                      <div className="color-thumbs">
                        {/* Existing images from database */}
                        {formData.colors[0]?.images?.map((img, imgIndex) => {
                          if (typeof img === 'string') {
                            return (
                              <div key={`existing-${imgIndex}`} className="image-item">
                                <img
                                  src={img}
                                  alt={`Product ${imgIndex + 1}`}
                                  className="gallery-thumb"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Note: We can't remove existing images from frontend in update mode
                                    // Backend will handle this
                                  }}
                                  className="remove-image-btn"
                                  title="Cannot remove from frontend"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })}
                        
                        {/* Newly uploaded images */}
                        {colorImages.map((img, imgIndex) => (
                          <div key={`new-${imgIndex}`} className="image-item">
                            <div className="file-info">
                              <span className="image-name">{getImageName(img)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeColorImage(imgIndex)}
                              className="remove-image-btn"
                              title="Remove this image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="btns">
              <button className="cancel" onClick={resetForm} disabled={loading}>
                Cancel
              </button>

              {formMode === "add" ? (
                <button className="save" onClick={addProduct} disabled={loading}>
                  {loading ? "Adding..." : "Add Product"}
                </button>
              ) : (
                <button className="save" onClick={updateProduct} disabled={loading}>
                  {loading ? "Updating..." : "Update Product"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="popup">
          <div className="popup-box">
            <h3>Confirm Delete</h3>
            <p>This will deactivate the product. Are you sure?</p>
            <div className="btns">
              <button className="cancel" onClick={() => setDeleteId(null)} disabled={loading}>
                Cancel
              </button>
              <button className="delete" onClick={deleteProduct} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProducts;