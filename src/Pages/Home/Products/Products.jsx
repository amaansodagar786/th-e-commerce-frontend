import React, { useState, useEffect } from "react";
import "./Products.scss";
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaEye } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      // Filter only active products
      const activeProducts = response.data.filter(p => p.isActive === true);
      setProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Get product price from colors array or direct fields
  const getProductPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].currentPrice || 0;
    }
    return product.currentPrice || 0;
  };

  // Get original price from colors array or direct fields
  const getOriginalPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].originalPrice || 0;
    }
    return product.originalPrice || 0;
  };

  // Get first color info if available
  const getFirstColor = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0];
    }
    return null;
  };

  // Get product image - USE THUMBNAIL ONLY
  const getProductImage = (product) => {
    return product.thumbnailImage || "https://via.placeholder.com/300x300?text=No+Image";
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const price = getProductPrice(product);
    const firstColor = getFirstColor(product);
    const taxSlab = product.taxSlab || 18;

    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: 1,
      unitPrice: price,
      finalPrice: price,
      totalPrice: price,
      taxSlab: taxSlab,
      selectedColor: firstColor ? {
        colorId: firstColor.colorId,
        colorName: firstColor.colorName,
        currentPrice: firstColor.currentPrice,
        originalPrice: firstColor.originalPrice,
        images: firstColor.images || []
      } : null,
      selectedSize: null,
      hasOffer: false,
      offerDetails: null,
      thumbnailImage: product.thumbnailImage  // ✅ Send thumbnail
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

      // ✅ NAVIGATE TO CART PAGE
      navigate('/cart');

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error adding to cart. Please try again.");
    }
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to proceed with Buy Now");
      navigate("/login");
      return;
    }

    const price = getProductPrice(product);
    const firstColor = getFirstColor(product);
    const taxSlab = product.taxSlab || 18;

    const buyNowData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: 1,
      unitPrice: price,
      finalPrice: price,
      totalPrice: price,
      taxSlab: taxSlab,
      selectedColor: firstColor ? {
        colorId: firstColor.colorId,
        colorName: firstColor.colorName,
        images: firstColor.images || []
      } : null,
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

  const handleViewProduct = (product) => {
    navigate(`/product/${product.productId}`);
  };

  if (loading) {
    return (
      <section className="products-section">
        <div className="products-section__container">
          <div style={{ textAlign: "center", padding: "50px" }}>
            Loading products...
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="products-section">
        <div className="products-section__container">
          <div style={{ textAlign: "center", padding: "50px" }}>
            No products available
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section">
      <div className="products-section__container">

        {/* DESKTOP */}
        <div className="products-section__desktop">
          {products.map((product) => {
            const price = getProductPrice(product);
            const originalPrice = getOriginalPrice(product);
            const productImage = getProductImage(product);

            return (
              <div key={product.productId} className="product-card">

                <div className="product-card__image">
                  <img src={productImage} alt={product.productName} />
                </div>

                <div className="product-card__content">
                  <h3 className="product-card__title">{product.productName}</h3>

                  <div className="product-card__price">
                    <span className="product-card__current-price">₹{price.toLocaleString()}</span>
                    {originalPrice > price && (
                      <span className="product-card__old-price">₹{originalPrice.toLocaleString()}</span>
                    )}
                  </div>

                  {/* VIEW PRODUCT TEXT */}
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
          })}
        </div>

        {/* MOBILE */}
        <div className="products-section__mobile">
          <div className="products-section__slider">

            <button className="products-section__slider-btn" onClick={prevSlide}>
              <FaChevronLeft />
            </button>

            <div className="products-section__slider-container">
              <div
                className="products-section__slider-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {products.map((product) => {
                  const price = getProductPrice(product);
                  const originalPrice = getOriginalPrice(product);
                  const productImage = getProductImage(product);

                  return (
                    <div key={product.productId} className="products-section__slider-item">

                      <div className="product-card">

                        <div className="product-card__image">
                          <img src={productImage} alt={product.productName} />
                        </div>

                        <div className="product-card__content">
                          <h3 className="product-card__title">{product.productName}</h3>

                          <div className="product-card__price">
                            <span className="product-card__current-price">₹{price.toLocaleString()}</span>
                            {originalPrice > price && (
                              <span className="product-card__old-price">₹{originalPrice.toLocaleString()}</span>
                            )}
                          </div>

                          {/* VIEW PRODUCT TEXT */}
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

                    </div>
                  );
                })}
              </div>
            </div>

            <button className="products-section__slider-btn" onClick={nextSlide}>
              <FaChevronRight />
            </button>

          </div>

          <div className="products-section__dots">
            {products.map((product, index) => (
              <button
                key={product.productId}
                className={`products-section__dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Products;