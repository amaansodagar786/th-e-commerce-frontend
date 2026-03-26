import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./AdminCategories.scss";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("adminToken");
const getRole = () => localStorage.getItem("role");
const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "multipart/form-data",
});

// ─── Component ─────────────────────────────────────────────────────────────────

const AdminCategories = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [categoryName, setCategoryName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  // Edit mode
  const [editId, setEditId] = useState(null);
  const [editExisting, setEditExisting] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  // ── Auth Guard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (!token || role !== "admin") navigate("/admin/login");
  }, [navigate]);

  const validateToken = () => {
    const token = getToken();
    const role = getRole();
    if (!token || role !== "admin") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      navigate("/admin/login");
      return false;
    }
    return true;
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchCategories = async () => {
    if (!validateToken()) return;
    try {
      setIsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Redirecting...");
        localStorage.clear();
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        toast.error(err.response?.data?.message || "Failed to fetch categories");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── Image Select ─────────────────────────────────────────────────────────────

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only image files are allowed (JPEG, PNG, GIF, WEBP)");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setPreviewImage("");
  };

  // ── Add ──────────────────────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!validateToken()) return;
    if (!categoryName.trim()) return toast.error("Category name is required");

    try {
      setFormLoading(true);
      const fd = new FormData();
      fd.append("name", categoryName.trim());
      if (imageFile) fd.append("image", imageFile); // optional

      await axios.post(`${import.meta.env.VITE_API_URL}/categories/add`, fd, {
        headers: authHeader(),
      });

      toast.success("Category added successfully!");
      resetForm();
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 409) {
        toast.error("Category already exists!");
      } else {
        toast.error(err.response?.data?.message || "Failed to add category");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update ───────────────────────────────────────────────────────────────────

  const handleUpdateCategory = async () => {
    if (!validateToken()) return;
    if (!categoryName.trim()) return toast.error("Category name is required");

    try {
      setFormLoading(true);
      const fd = new FormData();
      fd.append("name", categoryName.trim());
      if (imageFile) fd.append("image", imageFile); // optional — keep existing if not provided

      await axios.put(
        `${import.meta.env.VITE_API_URL}/categories/update/${editId}`,
        fd,
        { headers: authHeader() }
      );

      toast.success("Category updated successfully!");
      resetForm();
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Category not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to update category");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDeleteCategory = async () => {
    if (!validateToken()) return;
    try {
      setDeleteLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/categories/delete/${deleteId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Category deleted successfully!");
      setDeleteId(null);
      setDeleteName("");
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Category not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to delete category");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Edit / Reset ─────────────────────────────────────────────────────────────

  const handleEdit = (cat) => {
    setEditId(cat.categoryId);
    setCategoryName(cat.name);
    setEditExisting(cat.image || "");
    setPreviewImage(cat.image || "");
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setCategoryName("");
    setImageFile(null);
    setPreviewImage("");
    setEditId(null);
    setEditExisting("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="admin-cat">

        {/* ── PAGE HEADER ── */}
        <div className="ac-header">
          <div className="ac-header__left">
            <h1 className="ac-header__title">Categories</h1>
            <span className="ac-header__count">{categories.length} total</span>
          </div>
        </div>

        <div className="ac-layout">

          {/* ── FORM PANEL ── */}
          <div className="ac-form-panel">
            <div className="ac-form-panel__title">
              {editId ? "Edit Category" : "Add New Category"}
            </div>

            <div className="ac-form">

              {/* Name */}
              <div className="ac-form-group">
                <label>
                  Category Name <span className="ac-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scented Candles"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={formLoading}
                />
              </div>

              {/* Image — Optional */}
              <div className="ac-form-group">
                <label>
                  Category Image
                  <span className="ac-optional-tag">Optional</span>
                </label>

                {previewImage ? (
                  <div className="ac-image-preview-wrap">
                    <img src={previewImage} alt="Preview" className="ac-image-preview" />
                    <div className="ac-image-actions">
                      <label className="ac-btn ac-btn--outline ac-btn--sm">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          disabled={formLoading}
                          hidden
                        />
                      </label>
                      {imageFile && (
                        <button
                          type="button"
                          className="ac-btn ac-btn--danger-outline ac-btn--sm"
                          onClick={removeSelectedImage}
                          disabled={formLoading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {editId && !imageFile && editExisting && (
                      <p className="ac-image-note">
                        Current image. Upload a new one to replace it.
                      </p>
                    )}
                    {imageFile && (
                      <p className="ac-image-note">New: {imageFile.name}</p>
                    )}
                  </div>
                ) : (
                  <label className={`ac-file-upload-label ${formLoading ? "ac-disabled" : ""}`}>
                    <span className="ac-file-icon">🖼</span>
                    <span>Click to upload image (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={formLoading}
                      hidden
                    />
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="ac-form-actions">
                {editId ? (
                  <>
                    <button
                      className="ac-btn ac-btn--outline"
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="ac-btn ac-btn--primary"
                      onClick={handleUpdateCategory}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <><span className="ac-btn-spinner" /> Updating...</>
                      ) : "Update Category"}
                    </button>
                  </>
                ) : (
                  <button
                    className="ac-btn ac-btn--primary"
                    onClick={handleAddCategory}
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <><span className="ac-btn-spinner" /> Adding...</>
                    ) : "+ Add Category"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── CATEGORIES LIST ── */}
          <div className="ac-list-panel">
            <div className="ac-list-panel__title">All Categories</div>

            {isLoading && categories.length === 0 ? (
              <div className="ac-state">
                <div className="ac-state__spinner" />
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="ac-state">
                <div className="ac-state__icon">🏷️</div>
                <p>No categories yet. Add your first one!</p>
              </div>
            ) : (
              <div className="ac-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className={`ac-card ${editId === cat.categoryId ? "ac-card--editing" : ""}`}
                  >
                    <div className="ac-card__img-wrap">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="ac-card__img" />
                      ) : (
                        <div className="ac-card__no-img">🕯️</div>
                      )}
                      {editId === cat.categoryId && (
                        <div className="ac-card__editing-badge">Editing</div>
                      )}
                    </div>

                    <div className="ac-card__info">
                      <div className="ac-card__name">{cat.name}</div>
                      {!cat.image && (
                        <span className="ac-card__no-img-label">No image</span>
                      )}
                    </div>

                    <div className="ac-card__actions">
                      <button
                        className="ac-action-btn ac-action-btn--edit"
                        onClick={() => handleEdit(cat)}
                        disabled={isLoading || formLoading}
                      >
                        Edit
                      </button>
                      <button
                        className="ac-action-btn ac-action-btn--delete"
                        onClick={() => { setDeleteId(cat.categoryId); setDeleteName(cat.name); }}
                        disabled={isLoading || formLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            DELETE CONFIRM MODAL
        ════════════════════════════════════════════ */}
        {deleteId && (
          <div
            className="ac-modal-overlay"
            onClick={() => { setDeleteId(null); setDeleteName(""); }}
          >
            <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ac-modal__header">
                <h3 className="ac-modal__title">Delete Category</h3>
                <button
                  className="ac-modal__close"
                  onClick={() => { setDeleteId(null); setDeleteName(""); }}
                >×</button>
              </div>

              <div className="ac-modal__body">
                <div className="ac-delete-confirm">
                  <div className="ac-delete-confirm__icon">🗑️</div>
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>"{deleteName}"</strong>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="ac-modal__footer">
                <button
                  className="ac-btn ac-btn--outline"
                  onClick={() => { setDeleteId(null); setDeleteName(""); }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="ac-btn ac-btn--danger"
                  onClick={handleDeleteCategory}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <><span className="ac-btn-spinner" /> Deleting...</>
                  ) : "Yes, Delete"}
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

export default AdminCategories;