import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProductPage.scss";
import { FaTruck, FaLock, FaBoxOpen, FaUndo, FaChevronLeft, FaChevronRight, FaShoppingCart, FaEye } from "react-icons/fa";

const ProductPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get productId from state if coming from Products.js
  const productIdFromState = location.state?.productId;

  const token = localStorage.getItem("token");
  const [actualProductId, setActualProductId] = useState(null);

  // Product Data States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Offer Data
  const [offers, setOffers] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(null);

  // Quantity selector
  const [quantity, setQuantity] = useState(1);

  // Image States
  const [mainImage, setMainImage] = useState("");
  const [images, setImages] = useState([]);
  const [activeImg, setActiveImg] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Related Products (Similar Products)
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productOffers, setProductOffers] = useState({});
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Inventory Status
  const [inventoryStatus, setInventoryStatus] = useState({
    stock: 0,
    status: 'checking'
  });

  // Reviews Modal
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLimit] = useState(5);

  // Similar Products Slider State
  const [currentSimilarIndex, setCurrentSimilarIndex] = useState(0);

  // Accordion state
  const [open, setOpen] = useState(true);

  // Handle window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto slider for mobile (main product images)
  useEffect(() => {
    let interval;
    if (isMobile && images.length > 1) {
      interval = setInterval(() => {
        setActiveImg((prev) => {
          const currentIndex = images.findIndex(img => img === prev);
          const nextIndex = (currentIndex + 1) % images.length;
          return images[nextIndex];
        });
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMobile, images]);

  // 🎯 MAIN DATA LOADING - Priority: state first, then slug
  useEffect(() => {
    if (productIdFromState) {
      // Came from Products.js/Cart.js navigation - use ID directly
      console.log("✅ Using productId from state:", productIdFromState);
      fetchProductById(productIdFromState);
    } else if (slug) {
      // Direct URL access - search by slug
      console.log("🔍 No state, searching by slug:", slug);
      fetchProductBySlug(slug);
    } else {
      setError("No product identifier provided");
      setLoading(false);
    }
  }, [productIdFromState, slug]);

  // Fetch inventory status when product loads
  useEffect(() => {
    if (product) {
      fetchInventoryStatus();
    }
  }, [product]);

  // Update quantity when stock changes
  useEffect(() => {
    if (inventoryStatus.status === 'in-stock' || inventoryStatus.status === 'low-stock') {
      if (quantity > inventoryStatus.stock) {
        setQuantity(inventoryStatus.stock);
      }
    } else if (inventoryStatus.status === 'out-of-stock') {
      setQuantity(0);
    }
  }, [inventoryStatus]);

  // 🎯 FETCH PRODUCT BY ID (when coming from state)
  const fetchProductById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const productRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/${id}`
      );

      const productData = productRes.data;
      setProduct(productData);
      setActualProductId(id);

      // Fetch offers
      const offersRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/product-color-offers/${id}`
      );
      const offersData = offersRes.data;
      setOffers(offersData);

      // Set images
      const allImages = [];
      if (productData.colors && productData.colors.length > 0) {
        const firstColor = productData.colors[0];
        if (firstColor.images && firstColor.images.length > 0) {
          allImages.push(...firstColor.images);
          setMainImage(firstColor.images[0]);
          setActiveImg(firstColor.images[0]);
        }
      }
      if (allImages.length === 0 && productData.thumbnailImage) {
        allImages.push(productData.thumbnailImage);
        setMainImage(productData.thumbnailImage);
        setActiveImg(productData.thumbnailImage);
      }
      setImages(allImages);

      // Check for offer
      const offer = offersData.find(offer =>
        offer.productId === id &&
        !offer.variableModelId &&
        offer.isCurrentlyValid
      );
      setCurrentOffer(offer || null);

      // Fetch similar products (related products)
      await fetchSimilarProducts(productData.categoryId, id);

    } catch (err) {
      console.error("Error fetching product by ID:", err);
      setError("Product not found");
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FETCH SIMILAR PRODUCTS (excluding current product)
  const fetchSimilarProducts = async (categoryId, currentProductId) => {
    try {
      setRelatedLoading(true);
      // Fetch all products
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      
      // Filter: same category, active, and not current product
      let similar = response.data.filter(p => 
        p.categoryId === categoryId && 
        p.productId !== currentProductId &&
        p.isActive === true
      );
      
      // Limit to max 6 products
      similar = similar.slice(0, 6);
      setRelatedProducts(similar);
      
      // Fetch offers for similar products
      await fetchOffersForSimilarProducts(similar);
      
    } catch (error) {
      console.error("Error fetching similar products:", error);
    } finally {
      setRelatedLoading(false);
    }
  };

  // Fetch offers for similar products
  const fetchOffersForSimilarProducts = async (productsList) => {
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
      console.error("Error fetching offers for similar products:", error);
    }
  };

  // 🎯 FETCH PRODUCT BY SLUG (for direct URL access)
  const fetchProductBySlug = async (slugParam) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Searching by slug:", slugParam);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/slug/${slugParam}`
      );

      if (response.data.success && response.data.product) {
        const productData = response.data.product;
        setProduct(productData);
        setActualProductId(productData.productId);

        // Fetch offers for this product
        const offersRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/productoffers/product-color-offers/${productData.productId}`
        );
        const offersData = offersRes.data;
        setOffers(offersData);

        // Set images
        const allImages = [];
        if (productData.colors && productData.colors.length > 0) {
          const firstColor = productData.colors[0];
          if (firstColor.images && firstColor.images.length > 0) {
            allImages.push(...firstColor.images);
            setMainImage(firstColor.images[0]);
            setActiveImg(firstColor.images[0]);
          }
        }
        if (allImages.length === 0 && productData.thumbnailImage) {
          allImages.push(productData.thumbnailImage);
          setMainImage(productData.thumbnailImage);
          setActiveImg(productData.thumbnailImage);
        }
        setImages(allImages);

        // Check for offer
        const offer = offersData.find(offer =>
          offer.productId === productData.productId &&
          !offer.variableModelId &&
          offer.isCurrentlyValid
        );
        setCurrentOffer(offer || null);

        // Fetch similar products
        await fetchSimilarProducts(productData.categoryId, productData.productId);

      } else {
        setError("Product not found");
        toast.error("Product not found");
      }

    } catch (err) {
      console.error("Error fetching product by slug:", err);
      if (err.response?.status === 404) {
        setError("Product not found");
        toast.error("Product not found");
      } else {
        setError("Error loading product");
        toast.error("Failed to load product details");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory status
  const fetchInventoryStatus = async () => {
    if (!product) return;

    try {
      setInventoryStatus(prev => ({ ...prev, status: 'checking' }));

      const inventoryResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/all`
      );

      const inventoryItems = inventoryResponse.data.filter(item =>
        item.productId === product.productId
      );

      if (inventoryItems.length === 0) {
        setInventoryStatus({
          stock: 0,
          status: 'out-of-stock'
        });
        return;
      }

      const totalStock = inventoryItems.reduce((sum, item) => sum + item.stock, 0);

      let status = 'in-stock';
      if (totalStock === 0) {
        status = 'out-of-stock';
      } else if (totalStock <= 10) {
        status = 'low-stock';
      }

      setInventoryStatus({
        stock: totalStock,
        status: status
      });

    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryStatus({
        stock: 0,
        status: 'error'
      });
    }
  };

  // Fetch reviews
  const fetchProductReviews = async (page = 1) => {
    if (!actualProductId) return;
    
    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reviews/product/${actualProductId}`,
        {
          params: {
            page,
            limit: reviewsLimit
          }
        }
      );

      if (response.data.success) {
        if (page === 1) {
          setReviews(response.data.reviews);
          setReviewsStats({
            averageRating: parseFloat(response.data.stats.averageRating) || 0,
            totalReviews: response.data.stats.totalReviews || 0,
            ratingDistribution: response.data.stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          });
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (actualProductId) {
      fetchProductReviews();
    }
  }, [actualProductId]);

  // Get base price
  const getBasePrice = () => {
    if (product?.colors && product.colors.length > 0) {
      return product.colors[0].currentPrice || 0;
    }
    return product?.currentPrice || product?.price || 0;
  };

  // Get original price
  const getOriginalPrice = () => {
    if (product?.colors && product.colors.length > 0) {
      return product.colors[0].originalPrice || 0;
    }
    return product?.originalPrice || product?.mrp || 0;
  };

  // Get regular discount percentage
  const getRegularDiscountPercent = () => {
    const originalPrice = getOriginalPrice();
    const basePrice = getBasePrice();
    if (originalPrice > 0 && originalPrice > basePrice) {
      return Math.round(((originalPrice - basePrice) / originalPrice) * 100);
    }
    return 0;
  };

  // Get offer price
  const getOfferPrice = () => {
    const basePrice = getBasePrice();
    if (currentOffer && currentOffer.offerPercentage > 0) {
      const discountAmount = (basePrice * currentOffer.offerPercentage) / 100;
      return Math.max(0, basePrice - discountAmount);
    }
    return basePrice;
  };

  // Get total price
  const getTotalPrice = () => {
    return getOfferPrice() * quantity;
  };

  // Get total savings
  const getTotalSavings = () => {
    const originalPrice = getOriginalPrice();
    const offerPrice = getOfferPrice();
    if (originalPrice > offerPrice) {
      return (originalPrice - offerPrice) * quantity;
    }
    return 0;
  };

  // Get total discount percent
  const getTotalDiscountPercent = () => {
    const originalPrice = getOriginalPrice();
    const offerPrice = getOfferPrice();
    if (originalPrice > 0) {
      return Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
    }
    return 0;
  };

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    if (inventoryStatus.status === 'out-of-stock') {
      toast.warning("Product is out of stock!");
      return;
    }

    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      if (newQuantity > inventoryStatus.stock) {
        toast.warning(`Only ${inventoryStatus.stock} items available in stock!`);
        return;
      }
    }

    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInput = (e) => {
    const value = parseInt(e.target.value) || 1;

    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      if (value > inventoryStatus.stock) {
        toast.warning(`Only ${inventoryStatus.stock} items available in stock!`);
        return;
      }
    }

    if (value >= 1 && value <= 99) {
      setQuantity(value);
    }
  };

  // Check if can purchase
  const canPurchaseProduct = () => {
    if (inventoryStatus.status === 'out-of-stock') return false;
    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      return quantity <= inventoryStatus.stock && quantity > 0;
    }
    return true;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!canPurchaseProduct()) {
      if (inventoryStatus.status === 'out-of-stock') {
        toast.error("This product is currently out of stock!");
      } else if (quantity > inventoryStatus.stock) {
        toast.warning(`Only ${inventoryStatus.stock} items available in stock!`);
      }
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const basePrice = getBasePrice();
    const offerPrice = getOfferPrice();
    const hasOffer = currentOffer && currentOffer.offerPercentage > 0;
    const taxSlab = product.taxSlab || 18;

    const firstColor = product?.colors && product.colors.length > 0 ? product.colors[0] : null;

    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: basePrice,
      finalPrice: offerPrice,
      totalPrice: getTotalPrice(),
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

      toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/cart');

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Error adding to cart. Please try again.");
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!canPurchaseProduct()) {
      if (inventoryStatus.status === 'out-of-stock') {
        toast.error("This product is currently out of stock!");
      } else if (quantity > inventoryStatus.stock) {
        toast.warning(`Only ${inventoryStatus.stock} items available in stock!`);
      }
      return;
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to proceed with Buy Now");
      navigate("/login");
      return;
    }

    const basePrice = getBasePrice();
    const offerPrice = getOfferPrice();
    const hasOffer = currentOffer && currentOffer.offerPercentage > 0;
    const taxSlab = product.taxSlab || 18;

    const buyNowData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: basePrice,
      finalPrice: offerPrice,
      totalPrice: getTotalPrice(),
      taxSlab: taxSlab,
      selectedColor: null,
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
      thumbnailImage: mainImage
    };

    navigate('/checkout', {
      state: {
        buyNowMode: true,
        productData: buyNowData
      }
    });
  };

  // Render star rating
  const renderRatingStars = (rating, size = 'medium') => {
    const stars = [];
    const starSize = size === 'small' ? '1.2rem' : '1.5rem';
    const numRating = parseFloat(rating) || 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= Math.round(numRating) ? 'filled' : 'empty'}`}
          style={{ fontSize: starSize }}
        >
          {i <= numRating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  // Format date for reviews
  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle open reviews modal
  const handleOpenReviewsModal = () => {
    setShowReviewsModal(true);
    fetchProductReviews(1);
  };

  // Handle thumbnail click
  const handleThumbnailClick = (img) => {
    setActiveImg(img);
  };

  // ==================== SIMILAR PRODUCTS HELPER FUNCTIONS ====================
  const createSlug = (productName) => {
    return productName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getSimilarProductPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].currentPrice || 0;
    }
    return product.currentPrice || 0;
  };

  const getSimilarOriginalPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].originalPrice || 0;
    }
    return product.originalPrice || 0;
  };

  const getSimilarOfferPrice = (product) => {
    const basePrice = getSimilarProductPrice(product);
    const offer = productOffers[product.productId];
    if (offer && offer.offerPercentage > 0) {
      const discountAmount = (basePrice * offer.offerPercentage) / 100;
      return Math.max(0, basePrice - discountAmount);
    }
    return basePrice;
  };

  const getSimilarDiscountPercent = (product) => {
    const originalPrice = getSimilarOriginalPrice(product);
    const offerPrice = getSimilarOfferPrice(product);
    if (originalPrice > 0) {
      return Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
    }
    return 0;
  };

  const getSimilarProductImage = (product) => {
    if (product.colors && product.colors.length > 0 && product.colors[0].images && product.colors[0].images.length > 0) {
      return product.colors[0].images[0];
    }
    return product.thumbnailImage || "https://via.placeholder.com/300x300?text=No+Image";
  };

  const handleSimilarViewProduct = (similarProduct) => {
    const slug = createSlug(similarProduct.productName);
    navigate(`/product/${slug}`, {
      state: { productId: similarProduct.productId }
    });
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSimilarAddToCart = async (e, similarProduct) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const basePrice = getSimilarProductPrice(similarProduct);
    const offerPrice = getSimilarOfferPrice(similarProduct);
    const hasOffer = !!productOffers[similarProduct.productId];
    const currentOffer = productOffers[similarProduct.productId];
    const firstColor = similarProduct.colors && similarProduct.colors.length > 0 ? similarProduct.colors[0] : null;
    const taxSlab = similarProduct.taxSlab || 18;
    const quantity = 1;

    const cartData = {
      userId,
      productId: similarProduct.productId,
      productName: similarProduct.productName,
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
      thumbnailImage: similarProduct.thumbnailImage
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

  const handleSimilarBuyNow = (e, similarProduct) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.info("Please login to proceed with Buy Now");
      navigate("/login");
      return;
    }

    const basePrice = getSimilarProductPrice(similarProduct);
    const offerPrice = getSimilarOfferPrice(similarProduct);
    const hasOffer = !!productOffers[similarProduct.productId];
    const currentOffer = productOffers[similarProduct.productId];
    const firstColor = similarProduct.colors && similarProduct.colors.length > 0 ? similarProduct.colors[0] : null;
    const taxSlab = similarProduct.taxSlab || 18;
    const quantity = 1;

    const buyNowData = {
      userId,
      productId: similarProduct.productId,
      productName: similarProduct.productName,
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
      thumbnailImage: similarProduct.thumbnailImage
    };

    navigate('/checkout', {
      state: {
        buyNowMode: true,
        productData: buyNowData
      }
    });
  };

  // Similar Products Slider Navigation
  const nextSimilarSlide = () => {
    setCurrentSimilarIndex((prev) => (prev + 1) % relatedProducts.length);
  };

  const prevSimilarSlide = () => {
    setCurrentSimilarIndex((prev) => (prev - 1 + relatedProducts.length) % relatedProducts.length);
  };

  // Render Similar Product Card
  const renderSimilarProductCard = (similarProduct) => {
    const price = getSimilarProductPrice(similarProduct);
    const originalPrice = getSimilarOriginalPrice(similarProduct);
    const offerPrice = getSimilarOfferPrice(similarProduct);
    const productImage = getSimilarProductImage(similarProduct);
    const hasOffer = !!productOffers[similarProduct.productId];
    const currentOffer = productOffers[similarProduct.productId];
    const discountPercent = getSimilarDiscountPercent(similarProduct);

    return (
      <div key={similarProduct.productId} className="similar-product-card">
        <div className="similar-product-card__image">
          <img src={productImage} alt={similarProduct.productName} />
          {hasOffer && (
            <div className="similar-product-card__offer-badge">
              <span className="offer-percent">{currentOffer.offerPercentage}% OFF</span>
              <span className="offer-label">{currentOffer.offerLabel}</span>
            </div>
          )}
        </div>

        <div className="similar-product-card__content">
          <h3 className="similar-product-card__title">{similarProduct.productName}</h3>

          <div className="similar-product-card__price">
            {hasOffer ? (
              <>
                <span className="similar-product-card__current-price offer-price">
                  ₹{offerPrice.toLocaleString()}
                </span>
                <span className="similar-product-card__old-price">
                  ₹{price.toLocaleString()}
                </span>
                {originalPrice > price && (
                  <span className="similar-product-card__mrp">MRP: ₹{originalPrice.toLocaleString()}</span>
                )}
                <span className="similar-product-card__discount-badge">
                  -{discountPercent}% OFF
                </span>
              </>
            ) : (
              <>
                <span className="similar-product-card__current-price">₹{price.toLocaleString()}</span>
                {originalPrice > price && (
                  <span className="similar-product-card__old-price">₹{originalPrice.toLocaleString()}</span>
                )}
              </>
            )}
          </div>

          <div
            className="similar-product-card__view-text"
            onClick={() => handleSimilarViewProduct(similarProduct)}
          >
            View Product
          </div>

          <div className="similar-product-card__actions">
            <button
              className="similar-product-card__btn similar-product-card__btn--cart"
              onClick={(e) => handleSimilarAddToCart(e, similarProduct)}
            >
              <FaShoppingCart />
              <span>Add to Cart</span>
            </button>

            <button
              className="similar-product-card__btn similar-product-card__btn--buy"
              onClick={(e) => handleSimilarBuyNow(e, similarProduct)}
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
      <div className="product-page-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page-error">
        <h2>{error || "Product not found"}</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const basePrice = getBasePrice();
  const offerPrice = getOfferPrice();
  const originalPrice = getOriginalPrice();
  const regularDiscountPercent = getRegularDiscountPercent();
  const hasSpecialOffer = currentOffer && currentOffer.offerPercentage > 0;
  const totalSavings = getTotalSavings();
  const totalDiscountPercent = getTotalDiscountPercent();
  const canPurchase = canPurchaseProduct();

  const getStockStatusText = () => {
    if (inventoryStatus.status === 'out-of-stock') return 'Out of Stock';
    if (inventoryStatus.status === 'low-stock') return 'Low Stock';
    if (inventoryStatus.status === 'in-stock') return 'In Stock';
    return 'Checking stock...';
  };

  const stockStatusClass = inventoryStatus.status;

  return (
    <>
      <div className="product">
        {/* LEFT SECTION - IMAGES */}
        <div className="product__left">
          <div className="product__main-img">
            <img src={activeImg || mainImage} alt={product.productName} />

            {hasSpecialOffer && (
              <div className="product__offer-badge">
                <span className="offer-percent">{currentOffer.offerPercentage}% OFF</span>
                <span className="offer-label">{currentOffer.offerLabel}</span>
              </div>
            )}

            {isMobile && images.length > 1 && (
              <div className="product__slider-indicator">
                {images.map((img, index) => (
                  <span
                    key={index}
                    className={`product__slider-dot ${activeImg === img ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="product__grid">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Product view ${i + 1}`}
                  onClick={() => handleThumbnailClick(img)}
                  className={`product__thumb ${activeImg === img ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SECTION - DETAILS */}
        <div className="product__right">
          <h2>{product.productName}</h2>

          <div className="product__price">
            {hasSpecialOffer ? (
              <div className="price-simple price-striked">
                {regularDiscountPercent > 0 && (
                  <span className="discount">-{regularDiscountPercent}%</span>
                )}
                <span className="price struck">₹{basePrice.toLocaleString()}</span>
                {originalPrice > basePrice && (
                  <span className="mrp struck">M.R.P.: ₹{originalPrice.toLocaleString()}</span>
                )}
              </div>
            ) : (
              <div className="price-simple">
                {regularDiscountPercent > 0 && (
                  <span className="discount">-{regularDiscountPercent}%</span>
                )}
                <span className="price">₹{basePrice.toLocaleString()}</span>
                {originalPrice > basePrice && (
                  <span className="mrp">M.R.P.: ₹{originalPrice.toLocaleString()}</span>
                )}
              </div>
            )}

            {hasSpecialOffer && (
              <div className="offer-extra-info">
                <div className="offer-detail-line">
                  <span className="offer-label-icon">🎁</span>
                  <span className="offer-label-text">Extra {currentOffer.offerPercentage}% OFF</span>
                  <span className="offer-arrow">→</span>
                  <span className="offer-final-price">
                    Final Price: <strong>₹{offerPrice.toLocaleString()}</strong>
                  </span>
                  <span className="offer-save-text">
                    (You save ₹{(originalPrice - offerPrice).toLocaleString()} total)
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviewsStats.totalReviews > 0 && (
            <div className="product__reviews" onClick={handleOpenReviewsModal}>
              <div className="reviews-summary">
                <div className="stars">
                  {renderRatingStars(reviewsStats.averageRating, 'small')}
                </div>
                <span className="rating">{reviewsStats.averageRating.toFixed(1)}/5</span>
                <span className="separator">|</span>
                <span className="total-reviews">{reviewsStats.totalReviews} Reviews</span>
              </div>
            </div>
          )}

          <div className={`product__stock-status ${stockStatusClass}`}>
            {getStockStatusText()}
          </div>

          <div className="product__qty-section">
            <p className="qty-label">Quantity:</p>
            <div className="product__qty">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || inventoryStatus.status === 'out-of-stock'}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={handleQuantityInput}
                className="qty-input"
                disabled={inventoryStatus.status === 'out-of-stock'}
              />
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99 || inventoryStatus.status === 'out-of-stock'}
              >
                +
              </button>
            </div>
          </div>

          <div className="product__buttons">
            <button
              className="same-btn cart-btn"
              onClick={handleAddToCart}
              disabled={!canPurchase}
            >
              {inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className="same-btn buy-btn"
              onClick={handleBuyNow}
              disabled={!canPurchase}
            >
              {inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>

          <div className="product__features">
            <div className="feature-item">
              <FaTruck />
              <div className="feature-content">
                <p>DELIVERED ON TIME</p>
                <span>Standard and express delivery available</span>
              </div>
            </div>
            <div className="feature-item">
              <FaLock />
              <div className="feature-content">
                <p>SECURE PAYMENT</p>
                <span>Faster, safer & more secure online payment</span>
              </div>
            </div>
            <div className="feature-item">
              <FaBoxOpen />
              <div className="feature-content">
                <p>CRAFTED WITH CARE</p>
                <span>Made with attention to detail to deliver premium quality you can trust.</span>
              </div>
            </div>
            <div className="feature-item non-returnable">
              <FaUndo />
              <div className="feature-content">
                <p>NON-RETURNABLE</p>
                <span>For hygiene and quality assurance, this product cannot be returned once delivered.</span>
              </div>
            </div>
          </div>

          <div className="product__details">
            <div className="header" onClick={() => setOpen(!open)}>
              <h3>Product Details</h3>
              <span className="accordion-icon">{open ? "−" : "+"}</span>
            </div>

            {open && (
              <div className="details-content">
                {product.brandName && (
                  <div className="row">
                    <span className="label">Brand</span>
                    <span className="value">{product.brandName}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="row">
                    <span className="label">Item Weight</span>
                    <span className="value">{product.weight}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="row">
                    <span className="label">Dimensions</span>
                    <span className="value">{product.dimensions}</span>
                  </div>
                )}
                {product.manufacturer && (
                  <div className="row">
                    <span className="label">Manufacturer</span>
                    <span className="value">{product.manufacturer}</span>
                  </div>
                )}
                {product.specifications && product.specifications.length > 0 && (
                  product.specifications.map((spec, index) => (
                    <div key={index} className="row">
                      <span className="label">{spec.key}</span>
                      <span className="value">{spec.value}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="product__description">
        <h2>Description</h2>
        <div className="description-content">
          {product.description ? (
            product.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>No description available for this product.</p>
          )}
        </div>
      </div>

      {/* SIMILAR PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="similar-products-section">
          <div className="similar-products-section__container">
            <h2 className="similar-products-section__title">You May Also Like</h2>
            
            {/* Desktop View */}
            <div className="similar-products-section__desktop">
              {relatedProducts.map((product) => renderSimilarProductCard(product))}
            </div>

            {/* Mobile View */}
            <div className="similar-products-section__mobile">
              <div className="similar-products-section__slider">
                <button className="similar-products-section__slider-btn" onClick={prevSimilarSlide}>
                  <FaChevronLeft />
                </button>

                <div className="similar-products-section__slider-container">
                  <div
                    className="similar-products-section__slider-track"
                    style={{ transform: `translateX(-${currentSimilarIndex * 100}%)` }}
                  >
                    {relatedProducts.map((product) => (
                      <div key={product.productId} className="similar-products-section__slider-item">
                        {renderSimilarProductCard(product)}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="similar-products-section__slider-btn" onClick={nextSimilarSlide}>
                  <FaChevronRight />
                </button>
              </div>

              <div className="similar-products-section__dots">
                {relatedProducts.map((product, index) => (
                  <button
                    key={product.productId}
                    className={`similar-products-section__dot ${index === currentSimilarIndex ? 'active' : ''}`}
                    onClick={() => setCurrentSimilarIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS MODAL */}
      {showReviewsModal && (
        <div className="reviews-modal">
          <div className="modal-overlay" onClick={() => setShowReviewsModal(false)}></div>
          <div className="modal-content reviews-modal-content">
            <div className="modal-header">
              <h2>
                Customer Reviews
                <span className="reviews-count-badge">
                  {reviewsStats.totalReviews} review{reviewsStats.totalReviews > 1 ? 's' : ''}
                </span>
              </h2>
              <button
                className="close-btn"
                onClick={() => setShowReviewsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="reviews-modal-body">
              <div className="reviews-stats-sidebar">
                <div className="overall-rating">
                  <div className="overall-rating-number">
                    {reviewsStats.averageRating.toFixed(1)}
                  </div>
                  <div className="overall-rating-stars">
                    {renderRatingStars(reviewsStats.averageRating, 'large')}
                  </div>
                  <div className="overall-rating-text">
                    {reviewsStats.totalReviews} rating{reviewsStats.totalReviews > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="rating-breakdown">
                  <h4>Rating Breakdown</h4>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewsStats.ratingDistribution[star] || 0;
                    const percentage = reviewsStats.totalReviews > 0
                      ? Math.round((count / reviewsStats.totalReviews) * 100)
                      : 0;

                    return (
                      <div key={star} className="breakdown-row">
                        <span className="breakdown-star">{star} ★</span>
                        <div className="breakdown-bar-container">
                          <div
                            className="breakdown-bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="breakdown-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="reviews-list-section">
                <div className="reviews-list-container">
                  {reviewsLoading && reviews.length === 0 ? (
                    <div className="loading-reviews">
                      <div className="spinner-small"></div>
                      Loading reviews...
                    </div>
                  ) : reviews.length > 0 ? (
                    <>
                      {reviews.map((review, index) => (
                        <div key={index} className="review-card-full">
                          <div className="review-header-full">
                            <div className="reviewer-info-full">
                              <div className="reviewer-avatar">
                                {review.userName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="reviewer-details">
                                <div className="reviewer-name-full">{review.userName || 'User'}</div>
                                <div className="review-meta">
                                  <div className="review-rating-full">
                                    {renderRatingStars(review.rating, 'small')}
                                    <span className="review-rating-value">{review.rating}/5</span>
                                  </div>
                                  <span className="review-date-full">
                                    {formatReviewDate(review.createdAt)}
                                  </span>
                                  {review.isVerifiedPurchase && (
                                    <span className="verified-purchase-chip">
                                      ✅ Verified Purchase
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="review-content-full">
                            {review.reviewText ? (
                              <p className="review-text-full">"{review.reviewText}"</p>
                            ) : (
                              <p className="no-review-text">No review text provided</p>
                            )}
                          </div>

                          <div className="review-actions-full">
                            <button className="helpful-btn">
                              👍 Helpful ({review.helpfulCount || 0})
                            </button>
                          </div>
                        </div>
                      ))}

                      {reviews.length < reviewsStats.totalReviews && (
                        <button
                          className="load-more-btn"
                          onClick={() => {
                            const nextPage = reviewsPage + 1;
                            setReviewsPage(nextPage);
                            fetchProductReviews(nextPage);
                          }}
                          disabled={reviewsLoading}
                        >
                          {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="no-reviews-full">
                      <div className="no-reviews-icon-full">⭐</div>
                      <h3>No reviews yet</h3>
                      <p>Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPage;