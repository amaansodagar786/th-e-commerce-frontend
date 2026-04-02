import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaShoppingBag, FaTruck, FaLock, FaBoxOpen, FaUndo } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import "./Cart.scss";
import FooterTopPattern from "../../Components/Footer/FooterTopPattern/FooterTopPattern";

// ✅ Helper function to create slug from product name
const createSlug = (productName) => {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
};

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    totalMrp: 0,
    totalDiscount: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [productsData, setProductsData] = useState({});
  const [offersData, setOffersData] = useState({});

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // ✅ TAX RATE - 5%
  const TAX_RATE = 5;

  useEffect(() => {
    if (token && userId) {
      fetchCartAndProducts();
    } else {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (token && userId) {
        fetchCartAndProducts();
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [token, userId]);

  const fetchCartAndProducts = async () => {
    try {
      setLoading(true);

      const cartResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cartItemsData = cartResponse.data.cartItems || [];

      if (cartItemsData.length === 0) {
        setCartItems([]);
        calculateSummary([]);
        setLoading(false);
        return;
      }

      const productIds = [...new Set(cartItemsData.map(item => item.productId))];

      const productsPromises = productIds.map(id =>
        axios.get(`${import.meta.env.VITE_API_URL}/products/${id}`)
          .catch(err => ({ data: null, error: true, productId: id }))
      );

      const productsResponses = await Promise.all(productsPromises);

      const offersPromises = productIds.map(id =>
        axios.get(`${import.meta.env.VITE_API_URL}/productoffers/product-color-offers/${id}`)
          .catch(err => ({ data: [], error: true }))
      );

      const offersResponses = await Promise.all(offersPromises);

      const productsMap = {};
      const offersMap = {};

      productsResponses.forEach((res, index) => {
        if (res.data && !res.error) {
          productsMap[productIds[index]] = res.data;
        }
      });

      offersResponses.forEach((res, index) => {
        if (res.data && !res.error) {
          offersMap[productIds[index]] = res.data;
        }
      });

      setProductsData(productsMap);
      setOffersData(offersMap);

      let inventoryMap = {};
      try {
        const inventoryResponse = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/all`);
        inventoryResponse.data.forEach(inv => {
          if (!inventoryMap[inv.productId]) {
            inventoryMap[inv.productId] = 0;
          }
          if (inv.isActive) {
            inventoryMap[inv.productId] += inv.stock;
          }
        });
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }

      const enrichedItems = [];

      for (const cartItem of cartItemsData) {
        const liveProduct = productsMap[cartItem.productId];
        const productOffers = offersMap[cartItem.productId] || [];

        if (!liveProduct) continue;

        const selectedColorId = cartItem.selectedColor?.colorId;

        let selectedColor = null;
        let colorData = null;

        if (liveProduct.colors && liveProduct.colors.length > 0) {
          if (selectedColorId) {
            selectedColor = liveProduct.colors.find(c => c.colorId === selectedColorId);
          }
          if (!selectedColor && liveProduct.colors.length > 0) {
            selectedColor = liveProduct.colors[0];
          }
        }

        if (selectedColor) {
          colorData = {
            colorId: selectedColor.colorId,
            colorName: selectedColor.colorName,
            currentPrice: selectedColor.currentPrice,
            originalPrice: selectedColor.originalPrice,
            images: selectedColor.images || []
          };
        }

        const basePrice = colorData?.currentPrice || liveProduct.currentPrice || 0;
        const originalMRP = colorData?.originalPrice || liveProduct.originalPrice || 0;

        const regularDiscountPercent = originalMRP > basePrice
          ? Math.round(((originalMRP - basePrice) / originalMRP) * 100)
          : 0;
        const regularDiscountAmount = originalMRP - basePrice;

        let currentOffer = null;
        if (selectedColor && productOffers.length > 0) {
          currentOffer = productOffers.find(offer =>
            offer.productId === liveProduct.productId &&
            offer.colorId === selectedColor.colorId &&
            offer.isCurrentlyValid === true
          );
        }

        let finalPrice = basePrice;
        let offerDetails = null;
        let hasExtraOffer = false;
        let extraOfferPercentage = 0;
        let extraDiscountAmount = 0;

        if (currentOffer && currentOffer.offerPercentage > 0) {
          extraOfferPercentage = currentOffer.offerPercentage;
          extraDiscountAmount = (basePrice * extraOfferPercentage) / 100;
          finalPrice = Math.max(0, basePrice - extraDiscountAmount);
          hasExtraOffer = true;

          offerDetails = {
            offerId: currentOffer._id,
            offerPercentage: currentOffer.offerPercentage,
            offerLabel: currentOffer.offerLabel || `${currentOffer.offerPercentage}% EXTRA OFF`,
            originalPrice: basePrice,
            offerPrice: finalPrice,
            savedAmount: (basePrice - finalPrice) * cartItem.quantity
          };
        }

        const totalDiscountPerItem = originalMRP - finalPrice;
        const totalDiscountPercent = Math.round((totalDiscountPerItem / originalMRP) * 100);

        const stock = inventoryMap[liveProduct.productId] || 0;

        let finalQuantity = cartItem.quantity;
        if (finalQuantity > stock && stock > 0) {
          finalQuantity = stock;
          if (finalQuantity !== cartItem.quantity) {
            await axios.put(
              `${import.meta.env.VITE_API_URL}/cart/update/${cartItem._id}`,
              { quantity: finalQuantity, userId: userId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }

        enrichedItems.push({
          _id: cartItem._id,
          productId: liveProduct.productId,
          productName: liveProduct.productName,
          quantity: finalQuantity,
          thumbnailImage: liveProduct.thumbnailImage || colorData?.images?.[0] || null,
          selectedColor: colorData,
          selectedModel: cartItem.selectedModel,
          selectedSize: cartItem.selectedSize,
          originalMRP: originalMRP,
          basePrice: basePrice,
          finalPrice: finalPrice,
          regularDiscountAmount: regularDiscountAmount,
          regularDiscountPercent: regularDiscountPercent,
          extraDiscountAmount: extraDiscountAmount,
          extraOfferPercentage: extraOfferPercentage,
          totalDiscountAmount: totalDiscountPerItem,
          totalDiscountPercent: totalDiscountPercent,
          hasExtraOffer: hasExtraOffer,
          offerDetails: offerDetails,
          itemTotalMrp: originalMRP * finalQuantity,
          itemTotalAfterDiscount: finalPrice * finalQuantity,
          stock: stock
        });
      }

      setCartItems(enrichedItems);
      calculateSummary(enrichedItems);

    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items) => {
    const totalMrp = items.reduce((sum, item) => sum + (item.originalMRP * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.totalDiscountAmount * item.quantity), 0);
    const subtotal = totalMrp - totalDiscount;
    const shipping = 0;
    const tax = (subtotal * TAX_RATE) / 100;
    const total = subtotal + shipping;

    setCartSummary({
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalMrp,
      totalDiscount,
      subtotal,
      shipping,
      tax,
      total
    });
  };

  const updateQuantity = async (itemId, newQuantity, productId, currentStock) => {
    if (!token || newQuantity < 1 || newQuantity > 99) return;

    if (newQuantity > currentStock) {
      toast.warning(`Only ${currentStock} item${currentStock > 1 ? 's' : ''} available in stock!`);
      return;
    }

    try {
      setUpdatingItemId(itemId);

      await axios.put(
        `${import.meta.env.VITE_API_URL}/cart/update/${itemId}`,
        { quantity: newQuantity, userId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(prev => {
        const updatedItems = prev.map(item =>
          item._id === itemId
            ? {
              ...item,
              quantity: newQuantity,
              itemTotalMrp: item.originalMRP * newQuantity,
              itemTotalAfterDiscount: item.finalPrice * newQuantity
            }
            : item
        );
        calculateSummary(updatedItems);
        return updatedItems;
      });

    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (itemId) => {
    if (!token) {
      toast.info("Please login to manage cart");
      return;
    }

    try {
      setUpdatingItemId(itemId);

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/cart/remove/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(prev => {
        const updatedItems = prev.filter(item => item._id !== itemId);
        calculateSummary(updatedItems);
        return updatedItems;
      });

      toast.success("Item removed from cart");

    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const checkoutData = {
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        originalPrice: item.originalMRP,
        finalPrice: item.finalPrice,
        unitPrice: item.basePrice,
        totalPrice: item.finalPrice * item.quantity,
        taxSlab: TAX_RATE,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedModel: item.selectedModel,
        hasExtraOffer: item.hasExtraOffer,
        extraOfferPercentage: item.extraOfferPercentage,
        offerDetails: item.offerDetails,
        thumbnailImage: item.thumbnailImage,
        discountPercent: item.totalDiscountPercent,
        discountAmount: item.totalDiscountAmount,
        regularDiscountAmount: item.regularDiscountAmount,
        extraDiscountAmount: item.extraDiscountAmount
      })),
      summary: cartSummary
    };

    navigate('/checkout', {
      state: {
        cartMode: true,
        cartData: checkoutData
      }
    });
  };

  const continueShopping = () => {
    navigate('/');
  };

  // ✅ Handle product click navigation with slug
  const handleProductClick = (productId, productName) => {
    const slug = createSlug(productName);
    navigate(`/product/${slug}`, {
      state: { productId: productId }
    });
  };

  if (loading) {
    return (
      <div className="cartPage">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cartPage">
        <div className="cartContainer">
          <div className="left">
            {cartItems.length === 0 ? (
              <div className="emptyCart">
                <FaShoppingBag className="emptyIcon" />
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet</p>
                <button className="shopNowBtn" onClick={continueShopping}>
                  Shop Now
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item._id} className="cartItem">
                  <img
                    src={item.thumbnailImage || "https://via.placeholder.com/120x120"}
                    alt={item.productName}
                    onClick={() => handleProductClick(item.productId, item.productName)}
                    style={{ cursor: "pointer" }}
                  />

                  <div className="info">
                    <div className="infoHeader">
                      <h3 
                        onClick={() => handleProductClick(item.productId, item.productName)} 
                        style={{ cursor: "pointer" }}
                      >
                        {item.productName}
                      </h3>
                      <MdClose
                        className="closeBtn"
                        onClick={() => removeItem(item._id)}
                      />
                    </div>

                    <div className="priceWrapper">
                      <div className="price">
                        {item.totalDiscountPercent > 0 && (
                          <span className="discount">-{item.totalDiscountPercent}%</span>
                        )}
                        ₹{item.finalPrice.toLocaleString()}
                      </div>
                      {item.originalMRP > item.finalPrice && (
                        <div className="mrp">M.R.P.: ₹{item.originalMRP.toLocaleString()}</div>
                      )}
                    </div>

                    {item.hasExtraOffer && item.offerDetails && (
                      <div className="offer-label extra-offer">
                        🎁 {item.offerDetails.offerLabel}
                      </div>
                    )}

                    {!item.hasExtraOffer && item.regularDiscountPercent > 0 && (
                      <div className="offer-label regular-offer">
                        🔥 {item.regularDiscountPercent}% OFF
                      </div>
                    )}

                    <div className="qtyBox">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1, item.productId, item.stock)}
                        disabled={item.quantity <= 1 || updatingItemId === item._id}
                      >
                        -
                      </button>
                      <span className={updatingItemId === item._id ? 'updating' : ''}>
                        {updatingItemId === item._id ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1, item.productId, item.stock)}
                        disabled={item.quantity >= item.stock || updatingItemId === item._id}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="right">
              <div className="cart__features">
                <div className="cart__feature-item">
                  <FaTruck className="feature-icon" />
                  <div className="cart__feature-content">
                    <p>DELIVERED ON TIME</p>
                    <span>Standard and express delivery available</span>
                  </div>
                </div>
                <div className="cart__feature-item">
                  <FaLock className="feature-icon" />
                  <div className="cart__feature-content">
                    <p>SECURE PAYMENT</p>
                    <span>Faster, safer & more secure online payment</span>
                  </div>
                </div>
                <div className="cart__feature-item">
                  <FaBoxOpen className="feature-icon" />
                  <div className="cart__feature-content">
                    <p>CRAFTED WITH CARE</p>
                    <span>Made with attention to detail to deliver premium quality</span>
                  </div>
                </div>
                <div className="cart__feature-item">
                  <FaUndo className="feature-icon" />
                  <div className="cart__feature-content">
                    <p>NON-RETURNABLE</p>
                    <span>For hygiene and quality assurance, this product cannot be returned</span>
                  </div>
                </div>
              </div>

              <div className="summary">
                <h3>Order Summary</h3>

                <div className="row">
                  <span>Total MRP</span>
                  <span>₹ {cartSummary.totalMrp.toLocaleString()}</span>
                </div>

                {cartSummary.totalDiscount > 0 && (
                  <div className="row discount-row">
                    <span>Total Discount</span>
                    <span className="savings">- ₹ {cartSummary.totalDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="row subtotal-row">
                  <span>Subtotal</span>
                  <span>₹ {cartSummary.subtotal.toLocaleString()}</span>
                </div>

                <div className="row">
                  <span>Shipping</span>
                  <span className="free-shipping">FREE</span>
                </div>

                <div className="row tax-row">
                  <span>Tax (GST {TAX_RATE}%)</span>
                  <span>₹ {cartSummary.tax.toLocaleString()}</span>
                </div>

                <hr />

                <div className="row total">
                  <span>Total Amount</span>
                  <span>₹ {cartSummary.total.toLocaleString()}</span>
                </div>

                <div className="taxNote">
                  ✅ {TAX_RATE}% GST included in Subtotal
                </div>

                <div className="free-shipping-badge">
                  🚚 FREE Shipping on all orders!
                </div>
              </div>

              <button className="checkout" onClick={proceedToCheckout}>
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      <FooterTopPattern bgColor="#e9e6df" />
    </>
  );
};

export default Cart;