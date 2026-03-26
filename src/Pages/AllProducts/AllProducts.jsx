import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaShoppingCart, FaEye } from "react-icons/fa";
import "./AllProducts.scss";

function AllProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchAllProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [searchTerm, sortBy, selectedCategory, products]);

  // Fetch all products
  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const productsRes = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);

      // Filter active products and process them
      const activeProducts = productsRes.data.filter(p => p.isActive === true);
      const processedProducts = processProducts(activeProducts);

      setProducts(processedProducts);
      setFilteredProducts(processedProducts.slice(0, visibleProducts));

    } catch (error) {
      console.error("Error fetching all products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Process products for card display
  const processProducts = (productList) => {
    return productList.map(product => {
      // Get price from colors array or direct
      let currentPrice = product.currentPrice || 0;
      let originalPrice = product.originalPrice || 0;

      if (product.colors && product.colors.length > 0) {
        currentPrice = product.colors[0].currentPrice || currentPrice;
        originalPrice = product.colors[0].originalPrice || originalPrice;
      }

      return {
        productId: product.productId,
        productName: product.productName,
        thumbnailImage: product.thumbnailImage,
        currentPrice: currentPrice,
        originalPrice: originalPrice,
        taxSlab: product.taxSlab || 18,
        type: product.type
      };
    });
  };

  // Filter and sort products
  const filterAndSortProducts = () => {
    let result = [...products];

    // Apply category filter
    if (selectedCategory !== "all") {
      // You'll need to fetch product categories or add categoryId to processed products
      // For now, we'll just filter by categoryId if available
      // This is simplified - you may need to enhance based on your data structure
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.productName.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
        break;
      case "name-asc":
        result.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case "name-desc":
        result.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredProducts(result.slice(0, visibleProducts));
  };

  // Add to cart
  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: 1,
      unitPrice: product.currentPrice,
      finalPrice: product.currentPrice,
      totalPrice: product.currentPrice,
      taxSlab: product.taxSlab || 18,
      selectedColor: null,
      selectedSize: null,
      hasOffer: false,
      offerDetails: null
    };

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/cart/add`,
        cartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success(`Added to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error adding to cart. Please try again.");
    }
  };

  // Buy now
  const handleBuyNow = (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to proceed with Buy Now");
      navigate("/login");
      return;
    }

    const buyNowData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: 1,
      unitPrice: product.currentPrice,
      finalPrice: product.currentPrice,
      totalPrice: product.currentPrice,
      taxSlab: product.taxSlab || 18,
      selectedColor: null,
      selectedSize: null,
      selectedModel: null,
      hasOffer: false,
      offerDetails: null,
      thumbnailImage: product.thumbnailImage
    };

    navigate('/checkout', {
      state: {
        buyNowMode: true,
        productData: buyNowData
      }
    });
  };

  // View product
  const handleViewProduct = (product) => {
    navigate(`/product/${product.productId}`);
  };

  // Load more products
  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 12);
    setFilteredProducts(products.slice(0, visibleProducts + 12));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("featured");
    setSelectedCategory("all");
  };

  if (loading) {
    return (
      <div className="all-products-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-products-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>All Products</h1>
          <p>Browse our complete collection of {products.length} products</p>
        </div>
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {(searchTerm || selectedCategory !== "all" || sortBy !== "featured") && (
              <button className="reset-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="products-count">
        <span className="count-number">{filteredProducts.length}</span> of{" "}
        <span className="total-number">{products.length}</span> products
        {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const hasDiscount = product.originalPrice > product.currentPrice;

              return (
                <div key={product.productId} className="product-card">
                  <div className="product-card__image">
                    <img src={product.thumbnailImage} alt={product.productName} />
                  </div>

                  <div className="product-card__content">
                    <h3 className="product-card__title">{product.productName}</h3>

                    <div className="product-card__price">
                      <span className="product-card__current-price">
                        ₹{product.currentPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="product-card__old-price">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div
                      className="product-card__view-text"
                      onClick={() => handleViewProduct(product)}
                    >
                      View Product
                    </div>

                    <div className="product-card__actions">
                      <button
                        className="product-card__btn product-card__btn--cart"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        <FaShoppingCart />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        className="product-card__btn product-card__btn--buy"
                        onClick={(e) => handleBuyNow(e, product)}
                      >
                        <FaEye />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={resetFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {visibleProducts < products.length && filteredProducts.length >= visibleProducts && (
          <div className="load-more">
            <button onClick={loadMoreProducts}>
              Load More Products ({products.length - visibleProducts} more)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllProducts;