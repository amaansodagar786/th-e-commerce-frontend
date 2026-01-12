// components/CartSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.scss';

const Cart = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    subtotal: 0,
    totalSavings: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Fetch cart data
  useEffect(() => {
    if (isOpen && token && userId) {
      fetchCart();
    }
  }, [isOpen, token, userId]);

  // ADD THIS - Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('Cart update event received');
      if (isOpen && token && userId) {
        fetchCart();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isOpen, token, userId]);

  // UPDATED fetchCart with stock verification
  const fetchCart = async () => {
    try {
      setLoading(true);
      console.log('🛒 Fetching cart for user:', userId);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let cartItems = response.data.cartItems || [];

      // ✅ VERIFY STOCK FOR EACH ITEM (same logic as product page)
      const verifiedItems = [];

      // Get all inventory data once
      let inventoryData = [];
      try {
        const inventoryResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/inventory/all`
        );
        inventoryData = inventoryResponse.data;
        console.log('📦 Loaded inventory data:', inventoryData.length, 'items');
      } catch (invError) {
        console.error('❌ Could not load inventory, skipping stock checks:', invError);
      }

      for (const item of cartItems) {
        try {
          // Find inventory for this product
          const inventoryItems = inventoryData.filter(inv =>
            inv.productId === item.productId && inv.isActive === true
          );

          if (inventoryItems.length === 0) {
            console.log(`⚠️ ${item.productName} - No inventory found, marking as out of stock`);
            // Don't add to cart if out of stock
            continue;
          }

          // Calculate total stock (same as product page)
          const totalStock = inventoryItems.reduce((sum, inv) => sum + inv.stock, 0);

          // If quantity exceeds stock, adjust it
          if (item.quantity > totalStock) {
            if (totalStock > 0) {
              console.log(`⚠️ Adjusting ${item.productName}: ${item.quantity} → ${totalStock}`);

              // Update quantity in backend
              await axios.put(
                `${import.meta.env.VITE_API_URL}/cart/update/${item._id}`,
                { quantity: totalStock, userId: userId },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );

              // Update item locally
              item.quantity = totalStock;
              item.totalPrice = item.finalPrice * totalStock;

              if (item.hasOffer && item.offerDetails) {
                item.offerDetails.savedAmount =
                  (item.unitPrice - item.finalPrice) * totalStock;
              }
            } else {
              // Remove item if out of stock
              console.log(`🗑️ Removing ${item.productName} (out of stock)`);
              await axios.delete(
                `${import.meta.env.VITE_API_URL}/cart/remove/${item._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              continue; // Skip adding to cart
            }
          }

          verifiedItems.push(item);

        } catch (stockError) {
          console.error(`❌ Error checking stock for ${item.productName}:`, stockError);
          verifiedItems.push(item); // Keep item if stock check fails
        }
      }

      console.log('🛍️ Verified Cart Items:', verifiedItems.length, 'items');
      setCartItems(verifiedItems);
      calculateSummary(verifiedItems, response.data.summary);

      // Show message if items were adjusted
      if (verifiedItems.length !== cartItems.length) {
        const removedCount = cartItems.length - verifiedItems.length;
        console.log(`📝 Cart updated: ${removedCount} item(s) removed due to stock issues`);
      }

    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      if (error.response) {
        console.error('📡 Response data:', error.response.data);
        console.error('📡 Response status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items, apiSummary) => {
    console.log('📊 Calculating summary for items:', items.length);

    const subtotal = apiSummary?.subtotal || items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalSavings = apiSummary?.totalSavings || items.reduce((sum, item) => {
      if (item.hasOffer && item.offerDetails) {
        return sum + item.offerDetails.savedAmount;
      }
      return sum;
    }, 0);

    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    const summary = {
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalSavings,
      shipping,
      tax,
      total
    };

    console.log('📊 Final Summary:', summary);
    setCartSummary(summary);
  };


  // UPDATED: Use same inventory/all route as product page
  const checkStockBeforeUpdate = async (productId, requestedQuantity) => {
    try {
      console.log(`📦 Checking stock for product: ${productId}`);

      // SAME AS PRODUCT PAGE: Use inventory/all route
      const inventoryResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/all`
      );

      // Filter items for this product (same logic as product page)
      const inventoryItems = inventoryResponse.data.filter(item =>
        item.productId === productId && item.isActive === true
      );

      if (inventoryItems.length === 0) {
        return {
          allowed: false,
          stock: 0,
          message: "Product is out of stock"
        };
      }

      // Calculate total stock (same logic as product page)
      const totalStock = inventoryItems.reduce((sum, item) => sum + item.stock, 0);

      console.log('📦 Stock check result:', {
        productId,
        requestedQuantity,
        totalStock,
        inventoryItemsCount: inventoryItems.length
      });

      // Check if requested quantity exceeds stock
      if (requestedQuantity > totalStock) {
        return {
          allowed: false,
          stock: totalStock,
          message: `Only ${totalStock} items available in stock`
        };
      }

      return {
        allowed: true,
        stock: totalStock
      };

    } catch (error) {
      console.error('❌ Error checking stock:', error);
      return {
        allowed: true, // Allow if check fails (for now)
        stock: 0,
        message: 'Unable to verify stock, please try again'
      };
    }
  };

  // UPDATED updateQuantity function
  const updateQuantity = async (itemId, newQuantity, productId, itemName) => {
    if (!token || newQuantity < 1 || newQuantity > 99) {
      console.log('❌ Invalid quantity or no token');
      return;
    }

    try {
      console.log(`🔄 Updating ${itemName} to quantity ${newQuantity}`);

      // ✅ CHECK STOCK FIRST (same as product page)
      const stockCheck = await checkStockBeforeUpdate(productId, newQuantity);

      if (!stockCheck.allowed) {
        alert(`❌ ${stockCheck.message}`);
        return;
      }

      setUpdatingItem(itemId);

      // Proceed with quantity update
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/cart/update/${itemId}`,
        { quantity: newQuantity, userId: userId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Update response:', response.data);

      // Update local state
      const updatedItems = cartItems.map(item => {
        if (item._id === itemId) {
          const updatedItem = {
            ...item,
            quantity: newQuantity,
            totalPrice: item.finalPrice * newQuantity
          };

          if (updatedItem.hasOffer && updatedItem.offerDetails) {
            updatedItem.offerDetails.savedAmount =
              (updatedItem.unitPrice - updatedItem.finalPrice) * newQuantity;
          }

          console.log('🔄 Updated item:', updatedItem);
          return updatedItem;
        }
        return item;
      });

      setCartItems(updatedItems);
      calculateSummary(updatedItems);

      // Dispatch event for navbar update
      console.log('📢 Dispatching cartUpdated event');
      window.dispatchEvent(new Event('cartUpdated'));

    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      if (error.response) {
        console.error('📡 Error response:', error.response.data);
        console.error('📡 Error status:', error.response.status);
      }
      alert(`Failed to update quantity: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    if (!token) {
      alert('Please login to manage cart');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }

    try {
      console.log(`🗑️ Removing item ${itemId}`);

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/cart/remove/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Remove response:', response.data);

      // Update local state
      const updatedItems = cartItems.filter(item => item._id !== itemId);
      setCartItems(updatedItems);
      calculateSummary(updatedItems);

      // Dispatch event for navbar update
      console.log('📢 Dispatching cartUpdated event');
      window.dispatchEvent(new Event('cartUpdated'));

      alert('Item removed from cart successfully!');

    } catch (error) {
      console.error('❌ Error removing item:', error);
      if (error.response) {
        console.error('📡 Error response:', error.response.data);
        console.error('📡 Error status:', error.response.status);
      }
      alert(`Failed to remove item: ${error.response?.data?.message || error.message}`);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    onClose();
    navigate('/checkout');
  };

  const continueShopping = () => {
    onClose();
    navigate('/products');
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-overlay" onClick={onClose}></div>

      {/* Cart Sidebar */}
      <div className="cart-sidebar">
        {/* Header */}
        <div className="cart-header">
          <h2>
            <span className="cart-icon">🛒</span>
            Your Shopping Cart
            <span className="cart-count">({cartSummary.totalItems})</span>
          </h2>
          <button className="close-cart" onClick={onClose}>×</button>
        </div>

        {/* Cart Content */}
        <div className="cart-content">
          {loading ? (
            <div className="cart-loading">
              <div className="spinner"></div>
              <p>Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some amazing products to get started!</p>
              <button className="continue-shopping-btn" onClick={continueShopping}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-item">
                    {/* Product Image */}
                    <div className="item-image">
                      <img
                        src={item.selectedColor?.images?.[0] || item.thumbnailImage || "https://via.placeholder.com/80x80"}
                        alt={item.productName}
                        onClick={() => {
                          onClose();
                          navigate(`/product/${item.productId}`);
                        }}
                      />
                    </div>

                    {/* Item Details */}
                    <div className="item-details">
                      <div className="item-header">
                        <h4
                          className="item-name"
                          onClick={() => {
                            onClose();
                            navigate(`/product/${item.productId}`);
                          }}
                        >
                          {item.productName}
                        </h4>
                        <button
                          className="remove-item"
                          onClick={() => removeItem(item._id)}
                          title="Remove"
                          disabled={updatingItem === item._id}
                        >
                          ×
                        </button>
                      </div>

                      {/* Variant Info */}
                      <div className="item-variants">
                        {item.selectedModel && (
                          <span className="variant-chip model">
                            {item.selectedModel.modelName}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="variant-chip color">
                            {item.selectedColor.colorName}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="variant-chip size">
                            Size: {item.selectedSize}
                          </span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="item-pricing">
                        <div className="price-display">
                          {item.hasOffer ? (
                            <>
                              <span className="final-price">
                                ₹{(item.finalPrice * item.quantity).toLocaleString()}
                              </span>
                              <span className="unit-price struck">
                                ₹{(item.unitPrice * item.quantity).toLocaleString()}
                              </span>
                              <span className="saved-badge">
                                Save ₹{item.offerDetails?.savedAmount?.toLocaleString() || 0}
                              </span>
                            </>
                          ) : (
                            <span className="final-price">
                              ₹{(item.finalPrice * item.quantity).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Offer Label */}
                        {item.hasOffer && item.offerDetails && (
                          <div className="offer-label">
                            🎁 {item.offerDetails.offerLabel} ({item.offerDetails.offerPercentage}% OFF)
                          </div>
                        )}
                      </div>

                      <div className="item-quantity">
                        <button
                          className="qty-btn minus"
                          onClick={() => updateQuantity(item._id, item.quantity - 1, item.productId, item.productName)}
                          disabled={item.quantity <= 1 || updatingItem === item._id}
                        >
                          −
                        </button>
                        <span className="qty-value">
                          {updatingItem === item._id ? '...' : item.quantity}
                        </span>
                        <button
                          className="qty-btn plus"
                          onClick={() => updateQuantity(item._id, item.quantity + 1, item.productId, item.productName)}
                          disabled={item.quantity >= 99 || updatingItem === item._id}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal ({cartSummary.totalItems} items)</span>
                  <span>₹{cartSummary.subtotal.toLocaleString()}</span>
                </div>

                {cartSummary.totalSavings > 0 && (
                  <div className="summary-row discount">
                    <span>Total Savings</span>
                    <span className="savings">-₹{cartSummary.totalSavings.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping}`}</span>
                </div>

                <div className="summary-row">
                  <span>Tax (GST 18%)</span>
                  <span>₹{cartSummary.tax.toLocaleString()}</span>
                </div>

                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="total-amount">₹{cartSummary.total.toLocaleString()}</span>
                </div>

                {cartSummary.subtotal < 1000 && (
                  <div className="free-shipping-note">
                    🚚 Add ₹{(1000 - cartSummary.subtotal).toLocaleString()} more for FREE shipping!
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cart Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <button className="continue-shopping" onClick={continueShopping}>
              Continue Shopping
            </button>
            <button className="checkout-btn" onClick={proceedToCheckout}>
              Proceed to Checkout
              <span className="checkout-price">₹{cartSummary.total.toLocaleString()}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;