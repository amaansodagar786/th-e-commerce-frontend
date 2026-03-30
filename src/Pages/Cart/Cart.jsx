import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaShoppingBag, FaTruck, FaLock, FaBoxOpen, FaUndo } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import "./Cart.scss";
import FooterTopPattern from "../../Components/Footer/FooterTopPattern/FooterTopPattern";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    subtotal: 0,
    totalSavings: 0,
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

      // Get inventory once for all products
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
        const originalPrice = colorData?.originalPrice || liveProduct.originalPrice || 0;

        const regularDiscountPercent = originalPrice > basePrice
          ? Math.round(((originalPrice - basePrice) / originalPrice) * 100)
          : 0;

        let currentOffer = null;
        if (selectedColor && productOffers.length > 0) {
          currentOffer = productOffers.find(offer =>
            offer.productId === liveProduct.productId &&
            offer.colorId === selectedColor.colorId &&
            offer.isCurrentlyValid === true
          );

          if (!currentOffer) {
            currentOffer = productOffers.find(offer =>
              offer.productId === liveProduct.productId &&
              !offer.colorId &&
              offer.isCurrentlyValid === true
            );
          }
        }

        let finalPrice = basePrice;
        let offerDetails = null;
        let hasOffer = false;
        let offerDiscountPercent = 0;

        if (currentOffer && currentOffer.offerPercentage > 0) {
          const discountAmount = (basePrice * currentOffer.offerPercentage) / 100;
          finalPrice = Math.max(0, basePrice - discountAmount);
          hasOffer = true;
          offerDiscountPercent = currentOffer.offerPercentage;
          offerDetails = {
            offerId: currentOffer._id,
            offerPercentage: currentOffer.offerPercentage,
            offerLabel: currentOffer.offerLabel || `${currentOffer.offerPercentage}% OFF`,
            originalPrice: basePrice,
            offerPrice: finalPrice,
            savedAmount: (basePrice - finalPrice) * cartItem.quantity
          };
        }

        let totalDiscountPercent = 0;
        let displayOriginalPrice = originalPrice;
        let displayCurrentPrice = finalPrice;

        if (hasOffer) {
          totalDiscountPercent = offerDiscountPercent;
          displayOriginalPrice = basePrice;
          displayCurrentPrice = finalPrice;
        } else if (regularDiscountPercent > 0) {
          totalDiscountPercent = regularDiscountPercent;
          displayOriginalPrice = originalPrice;
          displayCurrentPrice = basePrice;
        }

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
          unitPrice: basePrice,
          originalPrice: originalPrice,
          finalPrice: finalPrice,
          totalPrice: finalPrice * finalQuantity,
          taxSlab: liveProduct.taxSlab || 18,
          hasOffer: hasOffer,
          offerDetails: offerDetails,
          regularDiscountPercent: regularDiscountPercent,
          offerDiscountPercent: offerDiscountPercent,
          totalDiscountPercent: totalDiscountPercent,
          displayOriginalPrice: displayOriginalPrice,
          displayCurrentPrice: displayCurrentPrice,
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
    const subtotal = items.reduce((sum, item) => sum + (item.displayOriginalPrice * item.quantity), 0);
    const totalSavings = items.reduce((sum, item) => {
      const originalTotal = item.displayOriginalPrice * item.quantity;
      const currentTotal = item.displayCurrentPrice * item.quantity;
      return sum + (originalTotal - currentTotal);
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 50;
    const tax = (subtotal - totalSavings) * 0.18;
    const total = (subtotal - totalSavings) + shipping + tax;

    setCartSummary({
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalSavings,
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
            ? { ...item, quantity: newQuantity, totalPrice: item.displayCurrentPrice * newQuantity }
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

      window.dispatchEvent(new Event('cartUpdated'));
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
        unitPrice: item.displayCurrentPrice,
        originalPrice: item.displayOriginalPrice,
        totalPrice: item.displayCurrentPrice * item.quantity,
        taxSlab: item.taxSlab,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedModel: item.selectedModel,
        hasOffer: item.hasOffer,
        offerDetails: item.offerDetails,
        thumbnailImage: item.thumbnailImage,
        discountPercent: item.totalDiscountPercent
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
    navigate('/all-products');
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
                  onClick={() => navigate(`/product/${item.productId}`)}
                  style={{ cursor: "pointer" }}
                />

                <div className="info">
                  <div className="infoHeader">
                    <h3 onClick={() => navigate(`/product/${item.productId}`)} style={{ cursor: "pointer" }}>
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
                      ₹{item.displayCurrentPrice.toLocaleString()}
                    </div>
                    {item.displayOriginalPrice > item.displayCurrentPrice && (
                      <div className="mrp">M.R.P.: ₹{item.displayOriginalPrice.toLocaleString()}</div>
                    )}
                  </div>

                  {item.hasOffer && item.offerDetails && (
                    <div className="offer-label">
                      🎁 {item.offerDetails.offerLabel}
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
            {/* UPDATED FEATURES SECTION - ICON ON TOP, HEADING IN SINGLE LINE */}
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
                <span>₹ {cartSummary.subtotal.toLocaleString()}</span>
              </div>

              {cartSummary.totalSavings > 0 && (
                <div className="row discount-row">
                  <span>Discount on MRP</span>
                  <span className="savings">- ₹ {cartSummary.totalSavings.toLocaleString()}</span>
                </div>
              )}

              <div className="row">
                <span>Coupon Discount</span>
                <span>- ₹0</span>
              </div>

              <div className="row">
                <span>Shipping</span>
                <span>{cartSummary.shipping === 0 ? 'FREE' : `₹ ${cartSummary.shipping}`}</span>
              </div>

              <div className="row">
                <span>Tax (GST 18%)</span>
                <span>₹ {cartSummary.tax.toLocaleString()}</span>
              </div>

              <hr />

              <div className="row total">
                <span>Total Amount</span>
                <span>₹ {cartSummary.total.toLocaleString()}</span>
              </div>

              <div className="taxNote">All prices are inclusive of taxes</div>

              {cartSummary.subtotal < 1000 && (
                <div className="free-shipping-note">
                  🚚 Add ₹{(1000 - cartSummary.subtotal).toLocaleString()} more for FREE shipping!
                </div>
              )}
            </div>

            <button className="checkout" onClick={proceedToCheckout}>
              Check out
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