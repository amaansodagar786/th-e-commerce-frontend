// components/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './Checkout.scss';
import AddressForm from './Address/AddressForm';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1); // 1: Review, 2: Address, 3: Payment
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cart Data
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    totalItems: 0,
    totalSavings: 0
  });

  // Address Data
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // User Data
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const [checkoutMode, setCheckoutMode] = useState('cart'); // 'cart' or 'buy-now'
  const [buyNowData, setBuyNowData] = useState(null);

  // Step Names
  const steps = [
    { number: 1, name: 'Review Order' },
    { number: 2, name: 'Select Address' },
    { number: 3, name: 'Payment' }
  ];

  // ==================== INITIAL DATA FETCHING ====================
  useEffect(() => {
    if (!token || !userId) {
      navigate('/login');
      return;
    }

    // Check if we're in Buy Now mode (data passed from product page)
    if (location.state && location.state.buyNowMode) {
      setCheckoutMode('buy-now');
      setBuyNowData(location.state.productData);
      processBuyNowData(location.state.productData);
    } else {
      // Normal cart mode
      setCheckoutMode('cart');
      fetchCartData();
      fetchAddresses();
    }
  }, [location.state]);

  // Process Buy Now data
  const processBuyNowData = async (productData) => {
    try {
      setLoading(true);

      // LOG BUY NOW DATA WITH TAX SLAB
      console.log('🛒 Buy Now Data Received:', {
        productName: productData.productName,
        quantity: productData.quantity,
        price: productData.finalPrice,
        taxSlab: productData.taxSlab || 'Not found',
        total: productData.totalPrice
      });

      // Create checkout session on backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/buynow/create-checkout-session`,
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Set cart items and summary from buy now session
        setCartItems(response.data.checkoutSession.cartItems);
        setCartSummary(response.data.summary);

        // LOG BUY NOW CHECKOUT SESSION ITEMS
        console.log('🛍️ Buy Now Checkout Session Items:', response.data.checkoutSession.cartItems);
      }

      // Still fetch addresses (same for both modes)
      await fetchAddresses();

    } catch (error) {
      console.error('Error processing Buy Now:', error);
      alert('Failed to process Buy Now. Please try again.');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart data
  const fetchCartData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.cartItems) {
        setCartItems(response.data.cartItems);

        // LOG CART ITEMS WITH TAX SLAB
        console.log('🛒 Cart Items with Tax Slab:', response.data.cartItems.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.finalPrice,
          taxSlab: item.taxSlab || 'Not found',
          total: item.totalPrice
        })));

        calculateCartSummary(response.data.cartItems, response.data.summary);
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      alert('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/profile/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAddresses(response.data.addresses);

        // Set default address as selected
        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
    }
  };

  // Calculate cart summary
  const calculateCartSummary = (items, apiSummary) => {
    const subtotal = apiSummary?.subtotal || items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalSavings = apiSummary?.totalSavings || items.reduce((sum, item) => {
      if (item.hasOffer && item.offerDetails?.savedAmount) {
        return sum + item.offerDetails.savedAmount;
      }
      return sum;
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    setCartSummary({
      subtotal,
      totalSavings,
      shipping,
      tax,
      total,
      totalItems
    });
  };

  // ==================== ADDRESS MANAGEMENT ====================
  const handleAddAddress = async (addressData) => {
    try {
      setSaving(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/address/add`,
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh addresses
        await fetchAddresses();

        setSelectedAddress(response.data.address);

        // Close form
        setShowAddressForm(false);

        // Success message
        alert('✅ Address added successfully! It is now selected for delivery.');
      }
    } catch (error) {
      console.error('❌ Error adding address:', error);
      alert(error.response?.data?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAddress = async (addressData) => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile/address/update/${editingAddress.addressId}`,
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh addresses
        await fetchAddresses();

        // Update selected address if it was the one being edited
        if (selectedAddress?.addressId === editingAddress.addressId) {
          setSelectedAddress(response.data.address);
        }

        // Close form
        setShowAddressForm(false);
        setEditingAddress(null);

        alert('✅ Address updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating address:', error);
      alert(error.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleSubmitAddress = (addressData) => {
    if (editingAddress) {
      handleUpdateAddress(addressData);
    } else {
      handleAddAddress(addressData);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  // ==================== STEP NAVIGATION ====================
  const goToNextStep = () => {
    if (currentStep === 2 && !selectedAddress) {
      alert('⚠️ Please select or add a delivery address');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const goToPrevStep = () => {
    if (currentStep === 1) {
      navigate('/cart');
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  // Add this function to Checkout.jsx
  const calculateItemGST = (item) => {
    const quantity = item.quantity || 1;
    const taxRate = item.taxSlab || 18;
    const finalPrice = item.finalPrice || item.price || 0;
    const discount = item.discount || 0;

    // Calculate
    const itemTotal = finalPrice * quantity;
    const discountAmount = itemTotal * (discount / 100);
    const totalAfterDiscount = itemTotal - discountAmount;
    const baseValue = totalAfterDiscount / (1 + taxRate / 100);
    const taxAmount = totalAfterDiscount - baseValue;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;

    return {
      baseValue: parseFloat(baseValue.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalPrice: parseFloat(totalAfterDiscount.toFixed(2))
    };
  };

  // Update handlePlaceOrder function in Checkout.jsx
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('⚠️ Please select a delivery address');
      setCurrentStep(2);
      return;
    }

    try {
      setSaving(true);

      // Calculate GST for each item
      const itemsWithGST = cartItems.map(item => {
        const gstCalculation = calculateItemGST(item);

        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          finalPrice: item.finalPrice,
          // Add GST fields
          taxSlab: item.taxSlab || 18,
          hsn: item.hsn || "",
          category: item.category || "",
          baseValue: gstCalculation.baseValue,
          taxAmount: gstCalculation.taxAmount,
          cgstAmount: gstCalculation.cgstAmount,
          sgstAmount: gstCalculation.sgstAmount,
          discountAmount: gstCalculation.discountAmount,
          totalPrice: gstCalculation.totalPrice,
          discount: item.discount || 0,
          // Add other fields
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          selectedModel: item.selectedModel,
          thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage,
          hasOffer: item.hasOffer,
          offerDetails: item.offerDetails
        };
      });

      // Calculate order totals
      let subtotal = 0, tax = 0, cgst = 0, sgst = 0, totalDiscount = 0, baseValue = 0;
      const taxPercentages = new Set();

      itemsWithGST.forEach(item => {
        subtotal += (item.unitPrice * item.quantity);
        tax += item.taxAmount;
        cgst += item.cgstAmount;
        sgst += item.sgstAmount;
        totalDiscount += item.discountAmount;
        baseValue += item.baseValue;
        taxPercentages.add(item.taxSlab);
      });

      const shipping = subtotal > 1000 ? 0 : 50;
      const total = subtotal - totalDiscount + shipping;
      const hasMixedTaxRates = taxPercentages.size > 1;

      // Prepare order data
      const orderData = {
        userId,
        checkoutMode,
        items: itemsWithGST,
        address: selectedAddress,
        paymentMethod: 'cod',
        // Send calculated totals
        subtotal: parseFloat(subtotal.toFixed(2)),
        baseValue: parseFloat(baseValue.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        hasMixedTaxRates,
        taxPercentages: Array.from(taxPercentages)
      };

      console.log('📦 Order data being sent:', orderData);

      // Call backend to create order
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/create`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ Order placed successfully!\nOrder ID: ${response.data.order.orderNumber}\nTotal: ₹${response.data.order.pricing.total.toLocaleString()}`);

        window.dispatchEvent(new Event('cartUpdated'));

        navigate('/orders', {
          state: {
            orderSuccess: true,
            orderId: response.data.order.orderNumber,
            orderTotal: response.data.order.pricing.total
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  // Render Product Review Step
  const renderReviewStep = () => (
    <div className="checkout-step">
      <h2>Review Your Order</h2>

      {/* Cart Items */}
      <div className="order-items">
        {cartItems.map(item => {
          // LOG EACH ITEM WITH TAX SLAB
          console.log('📦 Checkout Item:', {
            name: item.productName,
            quantity: item.quantity,
            price: item.finalPrice,
            taxSlab: item.taxSlab || 'Not found',
            total: item.totalPrice
          });

          return (
            <div key={item._id} className="order-item">
              <div className="item-image">
                <img
                  src={item.selectedColor?.images?.[0] || item.thumbnailImage || "https://via.placeholder.com/80x80"}
                  alt={item.productName}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80x80";
                  }}
                />
              </div>

              <div className="item-details">
                <h4 className="item-name">{item.productName}</h4>

                <div className="item-variants">
                  {item.selectedModel && (
                    <span className="variant-chip">{item.selectedModel.modelName}</span>
                  )}
                  {item.selectedColor && (
                    <span className="variant-chip">{item.selectedColor.colorName}</span>
                  )}
                  {item.selectedSize && (
                    <span className="variant-chip">Size: {item.selectedSize}</span>
                  )}
                  {/* ✅ SHOW TAX SLAB IN UI */}
                  <span className="variant-chip tax-chip">
                    GST: {item.taxSlab || 18}%
                  </span>
                </div>

                <div className="item-quantity-price">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <span className="price">
                    ₹{(item.finalPrice * item.quantity).toLocaleString()}
                    {item.hasOffer && (
                      <span className="original-price">
                        ₹{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h3>Order Summary</h3>

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
          <span className={cartSummary.shipping === 0 ? 'free' : ''}>
            {cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping}`}
          </span>
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
    </div>
  );

  // Render Address Selection Step
  const renderAddressStep = () => (
    <div className="checkout-step">
      <h2>Select Delivery Address</h2>

      {/* Current Selected Address Preview */}
      {selectedAddress && (
        <div className="selected-address-preview">
          <h3>✅ Currently Selected Address:</h3>
          <div className="address-preview">
            <div className="address-header">
              <p><strong>{selectedAddress.fullName}</strong> | 📱 {selectedAddress.mobile}</p>
              {selectedAddress.isDefault && (
                <span className="default-badge">Default</span>
              )}
            </div>
            <div className="address-details">
              <p>{selectedAddress.addressLine1}</p>
              {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
              {selectedAddress.landmark && <p><strong>Landmark:</strong> {selectedAddress.landmark}</p>}
              <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
              <p>{selectedAddress.country}</p>
              {selectedAddress.instructions && (
                <div className="address-instructions">
                  <p><strong>Delivery Instructions:</strong> {selectedAddress.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Options */}
      <div className="address-options-section">
        <h3>Choose from saved addresses:</h3>

        {addresses.length === 0 ? (
          <div className="no-addresses">
            <div className="empty-state">
              <span className="empty-icon">📍</span>
              <p>No addresses saved. Please add a delivery address.</p>
            </div>
          </div>
        ) : (
          <div className="address-options-list">
            {addresses.map(address => (
              <div
                key={address.addressId}
                className={`address-option-card ${selectedAddress?.addressId === address.addressId ? 'selected' : ''}`}
                onClick={() => handleSelectAddress(address)}
              >
                <div className="address-option-header">
                  <div className="address-radio">
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddress?.addressId === address.addressId}
                      onChange={() => handleSelectAddress(address)}
                    />
                  </div>
                  <div className="address-option-title">
                    <h4>{address.fullName}</h4>
                    {address.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                    <span className="address-type-badge">
                      {address.addressType === 'home' ? '🏠 Home' :
                        address.addressType === 'work' ? '💼 Work' : '📌 Other'}
                    </span>
                  </div>
                </div>

                <div className="address-option-content">
                  <p className="address-contact">
                    📱 {address.mobile}
                    {address.email && ` | ✉️ ${address.email}`}
                  </p>

                  <div className="address-details">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    {address.landmark && <p><strong>Landmark:</strong> {address.landmark}</p>}
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    <p>{address.country}</p>
                  </div>

                  {address.instructions && (
                    <div className="address-instructions">
                      <p><strong>Delivery Instructions:</strong> {address.instructions}</p>
                    </div>
                  )}

                  <div className="address-actions">
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(address);
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Address Button */}
        <div className="add-address-section">
          <button
            className="add-address-btn"
            onClick={() => setShowAddressForm(true)}
            disabled={saving}
          >
            ＋ Add New Address
          </button>
          <p className="add-address-note">
            {addresses.length === 0 ?
              "Add your first delivery address" :
              "Can't find your address? Add a new one"}
          </p>
        </div>
      </div>
    </div>
  );

  // Render Payment Step
  const renderPaymentStep = () => (
    <div className="checkout-step">
      <h2>Payment Method</h2>

      <div className="payment-methods">
        <div className="payment-method selected">
          <input
            type="radio"
            id="cod"
            name="payment"
            defaultChecked
            readOnly
          />
          <label htmlFor="cod">
            <span className="method-icon">💵</span>
            <div className="method-info">
              <span className="method-name">Cash on Delivery</span>
              <span className="method-desc">Pay when you receive your order</span>
            </div>
          </label>
        </div>

        <div className="payment-method disabled">
          <input type="radio" id="card" name="payment" disabled />
          <label htmlFor="card">
            <span className="method-icon">💳</span>
            <div className="method-info">
              <span className="method-name">Credit/Debit Card</span>
              <span className="method-desc">Coming Soon</span>
            </div>
          </label>
        </div>

        <div className="payment-method disabled">
          <input type="radio" id="upi" name="payment" disabled />
          <label htmlFor="upi">
            <span className="method-icon">📱</span>
            <div className="method-info">
              <span className="method-name">UPI</span>
              <span className="method-desc">Coming Soon</span>
            </div>
          </label>
        </div>
      </div>

      <div className="order-confirmation">
        <h3>Order Confirmation</h3>
        <div className="confirmation-details">
          <div className="delivery-address">
            <p><strong>Delivery Address:</strong></p>
            {selectedAddress ? (
              <div className="selected-address">
                <div className="address-header">
                  <p><strong>{selectedAddress.fullName}</strong> | 📱 {selectedAddress.mobile}</p>
                  {selectedAddress.isDefault && (
                    <span className="default-badge">Default</span>
                  )}
                </div>
                <p>{selectedAddress.addressLine1}</p>
                {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                {selectedAddress.instructions && (
                  <p><strong>Instructions:</strong> {selectedAddress.instructions}</p>
                )}
              </div>
            ) : (
              <p className="error">⚠️ No address selected</p>
            )}
          </div>

          <div className="order-summary-final">
            <div className="summary-row">
              <span>Items Total:</span>
              <span>₹{cartSummary.subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className={cartSummary.shipping === 0 ? 'free' : ''}>
                {cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping}`}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (18% GST):</span>
              <span>₹{cartSummary.tax.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span className="total-price">₹{cartSummary.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-note">
            <p>💰 <strong>Cash on Delivery:</strong> Pay ₹{cartSummary.total.toLocaleString()} when your order arrives.</p>
            <p>📦 <strong>Delivery:</strong> 3-7 business days</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  if (!token || !userId) {
    return (
      <div className="checkout-container">
        <div className="login-required">
          <h2>Login Required</h2>
          <p>Please login to proceed with checkout.</p>
          <button onClick={() => navigate('/login')} className="auth-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout.</p>
          <button onClick={() => navigate('/products')} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Progress Indicator */}
      <div className="checkout-progress">
        {steps.map(step => (
          <div
            key={step.number}
            className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-name">{step.name}</div>
            {step.number < 3 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="checkout-content">
        {currentStep === 1 && renderReviewStep()}
        {currentStep === 2 && renderAddressStep()}
        {currentStep === 3 && renderPaymentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="checkout-navigation">
        <button className="back-btn" onClick={goToPrevStep}>
          {currentStep === 1 ? 'Back to Cart' : 'Back'}
        </button>

        <div className="step-indicator">
          Step {currentStep} of 3
        </div>

        {currentStep < 3 ? (
          <button className="next-btn" onClick={goToNextStep}>
            Continue to {currentStep === 1 ? 'Address' : 'Payment'}
          </button>
        ) : (
          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading-spinner-small"></span>
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onSubmit={handleSubmitAddress}
          onCancel={handleCancelAddressForm}
          mode={editingAddress ? 'edit' : 'add'}
        />
      )}
    </div>
  );
};

export default Checkout;