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
  const [productOffers, setProductOffers] = useState({});

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      const activeProducts = response.data.filter(p => p.isActive === true);
      setProducts(activeProducts);
      await fetchOffersForProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch offers for all products
  const fetchOffersForProducts = async (productsList) => {
    try {
      const offersMap = {};
      for (const product of productsList) {
        try {
          const offersRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/productoffers/product-color-offers/${product.productId}`
          );
          const validOffer = offersRes.data.find(offer =>
            offer.productId === product.productId &&
            !offer.variableModelId &&
            offer.isCurrentlyValid === true
          );
          if (validOffer) {
            offersMap[product.productId] = validOffer;
          }
        } catch (err) {
          console.log(`No offers for product ${product.productId}`);
        }
      }
      setProductOffers(offersMap);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Get product price from colors array
  const getProductPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].currentPrice || 0;
    }
    return product.currentPrice || 0;
  };

  // Get original price
  const getOriginalPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].originalPrice || 0;
    }
    return product.originalPrice || 0;
  };

  // Get offer price for product
  const getOfferPrice = (product) => {
    const basePrice = getProductPrice(product);
    const offer = productOffers[product.productId];
    if (offer && offer.offerPercentage > 0) {
      const discountAmount = (basePrice * offer.offerPercentage) / 100;
      return Math.max(0, basePrice - discountAmount);
    }
    return basePrice;
  };

  // Get total discount percent
  const getTotalDiscountPercent = (product) => {
    const originalPrice = getOriginalPrice(product);
    const offerPrice = getOfferPrice(product);
    if (originalPrice > 0) {
      return Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
    }
    return 0;
  };

  // Get first color info
  const getFirstColor = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0];
    }
    return null;
  };

  // Get product image
  const getProductImage = (product) => {
    return product.thumbnailImage || "https://via.placeholder.com/300x300?text=No+Image";
  };

  // 🎯 CREATE URL-FRIENDLY NAME FROM PRODUCT NAME
  const createUrlName = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars EXCEPT spaces and hyphens
      .trim()
      .replace(/\s+/g, '-')       // Replace spaces with hyphens
      .replace(/-+/g, '-');       // Replace multiple hyphens with single hyphen
  };


  const createSlug = (productName) => {
    return productName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle Add to Cart
  const handleAddToCart = async (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const basePrice = getProductPrice(product);
    const offerPrice = getOfferPrice(product);
    const hasOffer = !!productOffers[product.productId];
    const currentOffer = productOffers[product.productId];
    const firstColor = getFirstColor(product);
    const taxSlab = product.taxSlab || 18;
    const quantity = 1;

    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: basePrice,
      finalPrice: offerPrice,
      totalPrice: offerPrice * quantity,
      taxSlab: taxSlab,
      selectedColor: firstColor ? {
        colorId: firstColor.colorId,
        colorName: firstColor.colorName,
        currentPrice: firstColor.currentPrice,
        originalPrice: firstColor.originalPrice,
        images: firstColor.images || []
      } : null,
      selectedSize: null,
      hasOffer: hasOffer,
      offerDetails: hasOffer ? {
        offerId: currentOffer._id,
        offerPercentage: currentOffer.offerPercentage,
        offerLabel: currentOffer.offerLabel,
        originalPrice: basePrice,
        offerPrice: offerPrice,
        savedAmount: (basePrice - offerPrice) * quantity
      } : null,
      thumbnailImage: product.thumbnailImage
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
      navigate('/cart');
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error adding to cart. Please try again.");
    }
  };

  // Handle Buy Now
  const handleBuyNow = (e, product) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to proceed with Buy Now");
      navigate("/login");
      return;
    }

    const basePrice = getProductPrice(product);
    const offerPrice = getOfferPrice(product);
    const hasOffer = !!productOffers[product.productId];
    const currentOffer = productOffers[product.productId];
    const firstColor = getFirstColor(product);
    const taxSlab = product.taxSlab || 18;
    const quantity = 1;

    const buyNowData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: basePrice,
      finalPrice: offerPrice,
      totalPrice: offerPrice * quantity,
      taxSlab: taxSlab,
      selectedColor: firstColor ? {
        colorId: firstColor.colorId,
        colorName: firstColor.colorName,
        currentPrice: firstColor.currentPrice,
        originalPrice: firstColor.originalPrice,
        images: firstColor.images || []
      } : null,
      selectedSize: null,
      selectedModel: null,
      hasOffer: hasOffer,
      offerDetails: hasOffer ? {
        offerId: currentOffer._id,
        offerPercentage: currentOffer.offerPercentage,
        offerLabel: currentOffer.offerLabel,
        originalPrice: basePrice,
        offerPrice: offerPrice,
        savedAmount: (basePrice - offerPrice) * quantity
      } : null,
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
    const slug = createSlug(product.productName);
    navigate(`/product/${slug}`, {
      state: { productId: product.productId }
    });
  };

  // Render product card
  const renderProductCard = (product) => {
    const price = getProductPrice(product);
    const originalPrice = getOriginalPrice(product);
    const offerPrice = getOfferPrice(product);
    const productImage = getProductImage(product);
    const hasOffer = !!productOffers[product.productId];
    const currentOffer = productOffers[product.productId];
    const discountPercent = getTotalDiscountPercent(product);

    return (
      <div key={product.productId} className="product-card">
        <div className="product-card__image">
          <img src={productImage} alt={product.productName} />
          {hasOffer && (
            <div className="product-card__offer-badge">
              <span className="offer-percent">{currentOffer.offerPercentage}% OFF</span>
              <span className="offer-label">{currentOffer.offerLabel}</span>
            </div>
          )}
        </div>

        <div className="product-card__content">
          <h3 className="product-card__title">{product.productName}</h3>

          <div className="product-card__price">
            {hasOffer ? (
              <>
                <span className="product-card__current-price offer-price">
                  ₹{offerPrice.toLocaleString()}
                </span>
                <span className="product-card__old-price">
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice > price && (
                  <span className="product-card__mrp">MRP: ₹{originalPrice.toLocaleString()}</span>
                )}
                <span className="product-card__discount-badge">
                  -{discountPercent}% OFF
                </span>
              </>
            ) : (
              <>
                <span className="product-card__current-price">₹{price.toLocaleString()}</span>
                {originalPrice > price && (
                  <span className="product-card__old-price">₹{originalPrice.toLocaleString()}</span>
                )}
              </>
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
          {products.map((product) => renderProductCard(product))}
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
                {products.map((product) => (
                  <div key={product.productId} className="products-section__slider-item">
                    {renderProductCard(product)}
                  </div>
                ))}
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