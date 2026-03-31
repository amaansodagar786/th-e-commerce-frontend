// Checkout.jsx - UPDATED with unique wrapper class to prevent conflicts
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MdShoppingBag,
  MdLocationOn,
  MdPayment,
  MdCheckCircle,
  MdLocalShipping,
  MdEdit,
  MdAdd,
  MdDelete,
  MdHome,
  MdWork,
  MdPlace,
  MdClose,
  MdArrowBack,
  MdArrowForward,
  MdLocalOffer,
  MdCreditCard,
  MdMoney,
  MdQrCode,
} from 'react-icons/md';
import './Checkout.scss';
import AddressForm from './Address/AddressForm';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cart Data
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalMrp: 0,
    totalDiscount: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    totalItems: 0
  });

  // Address Data
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // User Data
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // ✅ TAX RATE - 5% (INCLUDED IN PRICE)
  const TAX_RATE = 5;

  const [checkoutMode, setCheckoutMode] = useState('cart');

  const steps = [
    { number: 1, name: 'Review Order', icon: <MdShoppingBag /> },
    { number: 2, name: 'Select Address', icon: <MdLocationOn /> },
    { number: 3, name: 'Payment', icon: <MdPayment /> }
  ];

  // Scroll to top when step changes
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ✅ Helper function to calculate tax (5% of subtotal)
  const calculateTax = (subtotal) => {
    return (subtotal * TAX_RATE) / 100;
  };

  // ==================== INITIAL DATA FETCHING ====================
  useEffect(() => {
    if (!token || !userId) {
      navigate('/login');
      return;
    }

    if (location.state && location.state.buyNowMode) {
      setCheckoutMode('buy-now');
      processBuyNowData(location.state.productData);
    } else {
      setCheckoutMode('cart');
      fetchCartData();
      fetchAddresses();
    }
  }, [location.state]);

  const processBuyNowData = async (productData) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/buynow/create-checkout-session`,
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCartItems(response.data.checkoutSession.cartItems);
        calculateCartSummary(response.data.checkoutSession.cartItems);
      }
      await fetchAddresses();
    } catch (error) {
      console.error('Error processing Buy Now:', error);
      toast.error('Failed to process Buy Now. Please try again.');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.cartItems) {
        setCartItems(response.data.cartItems);
        calculateCartSummary(response.data.cartItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCartSummary = (items) => {
    const totalMrp = items.reduce((sum, item) => {
      const itemMrp = item.originalPrice || item.unitPrice || 0;
      return sum + (itemMrp * item.quantity);
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      const originalPrice = item.originalPrice || item.unitPrice || 0;
      const finalPrice = item.finalPrice || item.price || 0;
      return sum + ((originalPrice - finalPrice) * item.quantity);
    }, 0);

    const subtotal = totalMrp - totalDiscount;
    const shipping = 0;
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    setCartSummary({
      totalMrp,
      totalDiscount,
      subtotal,
      shipping,
      tax,
      total,
      totalItems
    });
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/profile/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAddresses(response.data.addresses);
        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
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
        await fetchAddresses();
        setSelectedAddress(response.data.address);
        setShowAddressForm(false);
        toast.success('Address added successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
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
        await fetchAddresses();
        if (selectedAddress?.addressId === editingAddress.addressId) {
          setSelectedAddress(response.data.address);
        }
        setShowAddressForm(false);
        setEditingAddress(null);
        toast.success('Address updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Are you sure you want to delete this address?');
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/profile/address/delete/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAddresses();
      if (selectedAddress?.addressId === addressId) {
        setSelectedAddress(null);
      }
      toast.success('Address deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
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

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <MdHome />;
      case 'work': return <MdWork />;
      default: return <MdPlace />;
    }
  };

  // ==================== STEP NAVIGATION ====================
  const goToNextStep = () => {
    if (currentStep === 2 && !selectedAddress) {
      toast.warning('Please select or add a delivery address');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
    setTimeout(scrollToTop, 100);
  };

  const goToPrevStep = () => {
    if (currentStep === 1) {
      navigate('/cart');
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
      setTimeout(scrollToTop, 100);
    }
  };

  // ==================== PLACE ORDER ====================
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.warning('Please select a delivery address');
      setCurrentStep(2);
      setTimeout(scrollToTop, 100);
      return;
    }

    try {
      setSaving(true);

      const itemsWithData = cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.originalPrice || item.unitPrice,
        finalPrice: item.finalPrice || item.price,
        originalPrice: item.originalPrice || item.unitPrice,
        taxSlab: TAX_RATE,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedModel: item.selectedModel,
        thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage,
        hasOffer: item.hasOffer,
        offerDetails: item.offerDetails,
        discountAmount: (item.originalPrice || item.unitPrice) - (item.finalPrice || item.price),
        extraOfferPercentage: item.extraOfferPercentage || 0,
        regularDiscountPercent: item.regularDiscountPercent || 0
      }));

      let totalMrp = 0;
      let totalDiscount = 0;

      itemsWithData.forEach(item => {
        totalMrp += (item.unitPrice * item.quantity);
        totalDiscount += ((item.unitPrice - item.finalPrice) * item.quantity);
      });

      const subtotal = totalMrp - totalDiscount;
      const shipping = 0;
      const tax = (subtotal * TAX_RATE) / 100;
      const total = subtotal + shipping;

      const orderData = {
        userId,
        checkoutMode,
        items: itemsWithData.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          originalPrice: item.unitPrice,
          finalPrice: item.finalPrice,
          taxSlab: TAX_RATE,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          selectedModel: item.selectedModel,
          thumbnailImage: item.thumbnailImage,
          hasOffer: item.hasOffer,
          offerDetails: item.offerDetails,
          baseValue: (item.finalPrice * item.quantity) - ((item.finalPrice * item.quantity) * TAX_RATE / (100 + TAX_RATE)),
          taxAmount: (item.finalPrice * item.quantity) * TAX_RATE / (100 + TAX_RATE),
          discountAmount: (item.unitPrice - item.finalPrice) * item.quantity
        })),
        address: selectedAddress,
        paymentMethod: 'cod',
        totalMrp: parseFloat(totalMrp.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        taxRate: TAX_RATE,
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/create`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Order placed successfully! Order ID: ${response.data.order.orderNumber}`);
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/orders', {
          state: { orderSuccess: true, orderId: response.data.order.orderNumber }
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderReviewStep = () => (
    <div className="checkout-page__step two-column">
      <div className="checkout-page__step-left">
        <div className="checkout-page__step-header">
          <h2>Review Your Order</h2>
          <p className="checkout-page__step-subtitle">Please review your items before proceeding</p>
        </div>

        <div className="checkout-page__order-items">
          {cartItems.map((item, idx) => {
            const originalPrice = item.originalPrice || item.unitPrice || 0;
            const finalPrice = item.finalPrice || item.price || 0;
            const discountPercent = originalPrice > finalPrice
              ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
              : 0;

            return (
              <div key={idx} className="checkout-page__order-item">
                <div className="checkout-page__item-image">
                  <img
                    src={item.selectedColor?.images?.[0] || item.thumbnailImage || "https://via.placeholder.com/80x80"}
                    alt={item.productName}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/80x80"; }}
                  />
                </div>
                <div className="checkout-page__item-details">
                  <h4 className="checkout-page__item-name">{item.productName}</h4>
                  <div className="checkout-page__item-variants">
                    {item.selectedModel && item.selectedModel.modelName !== "Default" && (
                      <span className="checkout-page__variant-chip">{item.selectedModel.modelName}</span>
                    )}
                    {/* {item.selectedColor && (
                      <span className="checkout-page__variant-chip checkout-page__color-chip">
                        <span className="checkout-page__color-dot" style={{ backgroundColor: item.selectedColor.colorCode || '#ccc' }}></span>
                        {item.selectedColor.colorName}
                      </span>
                    )} */}
                    {item.selectedSize && (
                      <span className="checkout-page__variant-chip">Size: {item.selectedSize}</span>
                    )}
                    <span className="checkout-page__variant-chip checkout-page__tax-chip">GST: {TAX_RATE}%</span>
                  </div>
                  <div className="checkout-page__item-quantity-price">
                    <span className="checkout-page__quantity">Qty: {item.quantity}</span>
                    <div className="checkout-page__price-info">
                      <span className="checkout-page__price">₹{(finalPrice * item.quantity).toLocaleString()}</span>
                      {discountPercent > 0 && (
                        <>
                          <span className="checkout-page__original-price">₹{(originalPrice * item.quantity).toLocaleString()}</span>
                          <span className="checkout-page__discount-badge">-{discountPercent}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.hasOffer && item.offerDetails && (
                    <div className="checkout-page__extra-offer-badge">
                      🎁 {item.offerDetails.offerLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="checkout-page__step-right">
        <div className="checkout-page__order-summary">
          <h3>Order Summary</h3>
          <div className="checkout-page__summary-row">
            <span>Total MRP</span>
            <span>₹{cartSummary.totalMrp.toLocaleString()}</span>
          </div>
          {cartSummary.totalDiscount > 0 && (
            <div className="checkout-page__summary-row checkout-page__discount">
              <span><MdLocalOffer /> Total Discount</span>
              <span className="checkout-page__savings">-₹{cartSummary.totalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="checkout-page__summary-row checkout-page__subtotal">
            <span>Subtotal</span>
            <span>₹{cartSummary.subtotal.toLocaleString()}</span>
          </div>
          <div className="checkout-page__summary-row">
            <span><MdLocalShipping /> Shipping</span>
            <span className="checkout-page__free-shipping-text">FREE</span>
          </div>
          <div className="checkout-page__summary-row checkout-page__tax">
            <span>Tax (GST {TAX_RATE}%)</span>
            <span>₹{cartSummary.tax.toLocaleString()}</span>
          </div>
          <div className="checkout-page__summary-divider"></div>
          <div className="checkout-page__summary-row checkout-page__total">
            <span>Total Amount</span>
            <span className="checkout-page__total-amount">₹{cartSummary.total.toLocaleString()}</span>
          </div>
          <div className="checkout-page__tax-note">
            ✅ {TAX_RATE}% GST included in Subtotal
          </div>
          <div className="checkout-page__free-shipping-badge">
            🚚 FREE Shipping on all orders!
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="checkout-page__step">
      <div className="checkout-page__step-header">
        <h2>Select Delivery Address</h2>
        <p className="checkout-page__step-subtitle">Choose where you want your order to be delivered</p>
      </div>

      {selectedAddress && (
        <div className="checkout-page__selected-address-preview">
          <div className="checkout-page__preview-header">
            <MdCheckCircle />
            <span>Selected Address</span>
          </div>
          <div className="checkout-page__address-preview">
            <div className="checkout-page__address-name">
              <strong>{selectedAddress.fullName}</strong>
              {selectedAddress.isDefault && <span className="checkout-page__default-badge">Default</span>}
            </div>
            <p className="checkout-page__address-contact">
              📱 {selectedAddress.mobile}
              {selectedAddress.email && ` | ✉️ ${selectedAddress.email}`}
            </p>
            <div className="checkout-page__address-full">
              <p>{selectedAddress.addressLine1}</p>
              {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
              {selectedAddress.landmark && <p>📍 Landmark: {selectedAddress.landmark}</p>}
              <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
              {selectedAddress.instructions && (
                <div className="checkout-page__address-instructions">📝 {selectedAddress.instructions}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="checkout-page__address-options-section">
        <h3>Your Saved Addresses</h3>

        {addresses.length === 0 ? (
          <div className="checkout-page__no-addresses">
            <div className="checkout-page__empty-state">
              <MdLocationOn className="checkout-page__empty-icon" />
              <p>No addresses saved yet</p>
              <button className="checkout-page__add-first-btn" onClick={() => setShowAddressForm(true)}>
                <MdAdd /> Add Your First Address
              </button>
            </div>
          </div>
        ) : (
          <div className="checkout-page__address-grid">
            {addresses.map(address => (
              <div
                key={address.addressId}
                className={`checkout-page__address-card ${selectedAddress?.addressId === address.addressId ? 'selected' : ''}`}
                onClick={() => handleSelectAddress(address)}
              >
                <div className="checkout-page__address-card-radio">
                  <div className={`checkout-page__radio-btn ${selectedAddress?.addressId === address.addressId ? 'checked' : ''}`}>
                    {selectedAddress?.addressId === address.addressId && <MdCheckCircle />}
                  </div>
                </div>
                <div className="checkout-page__address-card-content">
                  <div className="checkout-page__address-card-header">
                    <div className="checkout-page__address-type">
                      {getAddressIcon(address.addressType)}
                      <span>{address.addressType === 'home' ? 'Home' : address.addressType === 'work' ? 'Work' : 'Other'}</span>
                    </div>
                    {address.isDefault && <span className="checkout-page__default-badge">Default</span>}
                  </div>
                  <div className="checkout-page__address-card-name">{address.fullName}</div>
                  <p className="checkout-page__address-card-contact">📱 {address.mobile}</p>
                  <div className="checkout-page__address-card-details">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div className="checkout-page__address-card-actions">
                    <button className="checkout-page__edit-btn" onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}>
                      <MdEdit /> Edit
                    </button>
                    <button className="checkout-page__delete-btn" onClick={(e) => handleDeleteAddress(address.addressId, e)}>
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="checkout-page__add-address-section">
          <button className="checkout-page__add-address-btn" onClick={() => setShowAddressForm(true)} disabled={saving}>
            <MdAdd /> Add New Address
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="checkout-page__step two-column">
      <div className="checkout-page__step-left">
        <div className="checkout-page__step-header">
          <h2>Payment Method</h2>
          <p className="checkout-page__step-subtitle">Choose how you want to pay</p>
        </div>

        <div className="checkout-page__payment-methods">
          <div className="checkout-page__payment-card selected">
            <div className="checkout-page__payment-card-radio">
              <div className="checkout-page__radio-btn checked">
                <MdCheckCircle />
              </div>
            </div>
            <div className="checkout-page__payment-card-icon">
              <MdMoney />
            </div>
            <div className="checkout-page__payment-card-info">
              <div className="checkout-page__payment-card-name">Cash on Delivery</div>
              <div className="checkout-page__payment-card-desc">Pay when you receive your order</div>
            </div>
          </div>

          <div className="checkout-page__payment-card disabled">
            <div className="checkout-page__payment-card-radio">
              <div className="checkout-page__radio-btn"></div>
            </div>
            <div className="checkout-page__payment-card-icon">
              <MdCreditCard />
            </div>
            <div className="checkout-page__payment-card-info">
              <div className="checkout-page__payment-card-name">Credit/Debit Card</div>
              <div className="checkout-page__payment-card-desc">Coming Soon</div>
            </div>
          </div>

          <div className="checkout-page__payment-card disabled">
            <div className="checkout-page__payment-card-radio">
              <div className="checkout-page__radio-btn"></div>
            </div>
            <div className="checkout-page__payment-card-icon">
              <MdQrCode />
            </div>
            <div className="checkout-page__payment-card-info">
              <div className="checkout-page__payment-card-name">UPI / QR Code</div>
              <div className="checkout-page__payment-card-desc">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>

      <div className="checkout-page__step-right">
        <div className="checkout-page__order-confirmation">
          <h3>Confirm Your Order</h3>
          <div className="checkout-page__confirmation-details">
            <div className="checkout-page__delivery-summary">
              <div className="checkout-page__summary-item">
                <MdLocationOn />
                <div>
                  <strong>Delivery Address</strong>
                  {selectedAddress ? (
                    <>
                      <p>{selectedAddress.fullName}, {selectedAddress.mobile}</p>
                      <p>{selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                    </>
                  ) : (
                    <p className="checkout-page__error">No address selected</p>
                  )}
                </div>
              </div>
              <div className="checkout-page__summary-item">
                <MdShoppingBag />
                <div>
                  <strong>Order Summary</strong>
                  <p>{cartSummary.totalItems} items • ₹{cartSummary.total.toLocaleString()}</p>
                  <p className="checkout-page__tax-note-small">✅ {TAX_RATE}% GST included</p>
                  <p className="checkout-page__shipping-note-small">🚚 FREE Shipping</p>
                </div>
              </div>
            </div>

            <div className="checkout-page__order-total-final">
              <div className="checkout-page__total-row">
                <span>Total Amount</span>
                <span className="checkout-page__total-price">₹{cartSummary.total.toLocaleString()}</span>
              </div>
              <div className="checkout-page__payment-note">
                <p>💰 Pay ₹{cartSummary.total.toLocaleString()} when your order arrives</p>
                <p>📦 Estimated delivery: 3-7 business days</p>
                <p className="checkout-page__tax-included-note">✅ {TAX_RATE}% GST included in total amount</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  if (!token || !userId) {
    return (
      <div className="checkout-page__wrapper">
        <div className="checkout-page__login-required">
          <div className="checkout-page__login-icon">🔒</div>
          <h2>Login Required</h2>
          <p>Please login to proceed with checkout.</p>
          <button onClick={() => navigate('/login')} className="checkout-page__auth-btn">Go to Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page__wrapper">
        <div className="checkout-page__loading-container">
          <div className="checkout-page__spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page__wrapper">
        <div className="checkout-page__empty-cart">
          <div className="checkout-page__empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout.</p>
          <button onClick={() => navigate('/products')} className="checkout-page__continue-btn">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page__wrapper">
      <ToastContainer position="top-center" autoClose={3000} theme="light" />

      <div className="checkout-page__progress">
        {steps.map((step, index) => (
          <div key={step.number} className={`checkout-page__progress-step ${currentStep >= step.number ? 'active' : ''}`}>
            <div className={`checkout-page__step-circle ${currentStep > step.number ? 'completed' : ''}`}>
              {currentStep > step.number ? <MdCheckCircle /> : step.number}
            </div>
            <div className="checkout-page__step-info">
              <span className="checkout-page__step-name">{step.name}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`checkout-page__step-line ${currentStep > step.number ? 'active' : ''}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="checkout-page__content" ref={contentRef}>
        {currentStep === 1 && renderReviewStep()}
        {currentStep === 2 && renderAddressStep()}
        {currentStep === 3 && renderPaymentStep()}
      </div>

      <div className="checkout-page__navigation">
        <button className="checkout-page__nav-btn checkout-page__back-btn" onClick={goToPrevStep}>
          <MdArrowBack /> {currentStep === 1 ? 'Back to Cart' : 'Back'}
        </button>
        {currentStep < 3 ? (
          <button className="checkout-page__nav-btn checkout-page__next-btn" onClick={goToNextStep}>
            Continue <MdArrowForward />
          </button>
        ) : (
          <button className="checkout-page__nav-btn checkout-page__place-order-btn" onClick={handlePlaceOrder} disabled={saving}>
            {saving ? <><span className="checkout-page__spinner-small"></span> Processing...</> : 'Place Order'}
          </button>
        )}
      </div>

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