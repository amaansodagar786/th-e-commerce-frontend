// Checkout.jsx
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
        setCartSummary(response.data.summary);
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
        calculateCartSummary(response.data.cartItems, response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const calculateCartSummary = (items, apiSummary) => {
    const subtotal = apiSummary?.subtotal || items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalSavings = apiSummary?.totalSavings || items.reduce((sum, item) => {
      if (item.hasOffer && item.offerDetails?.savedAmount) {
        return sum + item.offerDetails.savedAmount;
      }
      return sum;
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 50;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    setCartSummary({ subtotal, totalSavings, shipping, tax, total, totalItems });
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

      const itemsWithGST = cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        finalPrice: item.finalPrice,
        taxSlab: item.taxSlab || 18,
        totalPrice: item.totalPrice,
        discount: item.discount || 0,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedModel: item.selectedModel,
        thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage,
        hasOffer: item.hasOffer,
        offerDetails: item.offerDetails
      }));

      let subtotal = 0, tax = 0, totalDiscount = 0;
      itemsWithGST.forEach(item => {
        subtotal += (item.unitPrice * item.quantity);
        tax += (item.finalPrice * item.quantity) * (item.taxSlab / 100);
        totalDiscount += (item.unitPrice - item.finalPrice) * item.quantity;
      });

      const shipping = subtotal > 1000 ? 0 : 50;
      const total = subtotal - totalDiscount + shipping + tax;

      const orderData = {
        userId,
        checkoutMode,
        items: itemsWithGST,
        address: selectedAddress,
        paymentMethod: 'cod',
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
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
    <div className="checkout-step two-column">
      {/* Left Column - Order Items */}
      <div className="step-left">
        <div className="step-header">
          <h2>Review Your Order</h2>
          <p className="step-subtitle">Please review your items before proceeding</p>
        </div>

        <div className="order-items">
          {cartItems.map((item, idx) => (
            <div key={idx} className="order-item">
              <div className="item-image">
                <img
                  src={item.selectedColor?.images?.[0] || item.thumbnailImage || "https://via.placeholder.com/80x80"}
                  alt={item.productName}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/80x80"; }}
                />
              </div>
              <div className="item-details">
                <h4 className="item-name">{item.productName}</h4>
                <div className="item-variants">
                  {item.selectedModel && item.selectedModel.modelName !== "Default" && (
                    <span className="variant-chip">{item.selectedModel.modelName}</span>
                  )}
                  {item.selectedColor && (
                    <span className="variant-chip color-chip">
                      <span className="color-dot" style={{ backgroundColor: item.selectedColor.colorCode || '#ccc' }}></span>
                      {item.selectedColor.colorName}
                    </span>
                  )}
                  {item.selectedSize && (
                    <span className="variant-chip">Size: {item.selectedSize}</span>
                  )}
                  <span className="variant-chip tax-chip">GST: {item.taxSlab || 18}%</span>
                </div>
                <div className="item-quantity-price">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <div className="price-info">
                    <span className="price">₹{(item.finalPrice * item.quantity).toLocaleString()}</span>
                    {item.hasOffer && (
                      <span className="original-price">₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="step-right">
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal ({cartSummary.totalItems} items)</span>
            <span>₹{cartSummary.subtotal.toLocaleString()}</span>
          </div>
          {cartSummary.totalSavings > 0 && (
            <div className="summary-row discount">
              <span><MdLocalOffer /> Total Savings</span>
              <span className="savings">-₹{cartSummary.totalSavings.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row">
            <span><MdLocalShipping /> Shipping</span>
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
    </div>
  );

  const renderAddressStep = () => (
    <div className="checkout-step">
      <div className="step-header">
        <h2>Select Delivery Address</h2>
        <p className="step-subtitle">Choose where you want your order to be delivered</p>
      </div>

      {selectedAddress && (
        <div className="selected-address-preview">
          <div className="preview-header">
            <MdCheckCircle />
            <span>Selected Address</span>
          </div>
          <div className="address-preview">
            <div className="address-name">
              <strong>{selectedAddress.fullName}</strong>
              {selectedAddress.isDefault && <span className="default-badge">Default</span>}
            </div>
            <p className="address-contact">
              📱 {selectedAddress.mobile}
              {selectedAddress.email && ` | ✉️ ${selectedAddress.email}`}
            </p>
            <div className="address-full">
              <p>{selectedAddress.addressLine1}</p>
              {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
              {selectedAddress.landmark && <p>📍 Landmark: {selectedAddress.landmark}</p>}
              <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
              {selectedAddress.instructions && (
                <div className="address-instructions">📝 {selectedAddress.instructions}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="address-options-section">
        <h3>Your Saved Addresses</h3>

        {addresses.length === 0 ? (
          <div className="no-addresses">
            <div className="empty-state">
              <MdLocationOn className="empty-icon" />
              <p>No addresses saved yet</p>
              <button className="add-first-btn" onClick={() => setShowAddressForm(true)}>
                <MdAdd /> Add Your First Address
              </button>
            </div>
          </div>
        ) : (
          <div className="address-grid">
            {addresses.map(address => (
              <div
                key={address.addressId}
                className={`address-card ${selectedAddress?.addressId === address.addressId ? 'selected' : ''}`}
                onClick={() => handleSelectAddress(address)}
              >
                <div className="address-card__radio">
                  <div className={`radio-btn ${selectedAddress?.addressId === address.addressId ? 'checked' : ''}`}>
                    {selectedAddress?.addressId === address.addressId && <MdCheckCircle />}
                  </div>
                </div>
                <div className="address-card__content">
                  <div className="address-card__header">
                    <div className="address-type">
                      {getAddressIcon(address.addressType)}
                      <span>{address.addressType === 'home' ? 'Home' : address.addressType === 'work' ? 'Work' : 'Other'}</span>
                    </div>
                    {address.isDefault && <span className="default-badge">Default</span>}
                  </div>
                  <div className="address-card__name">{address.fullName}</div>
                  <p className="address-card__contact">📱 {address.mobile}</p>
                  <div className="address-card__details">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                  </div>
                  <div className="address-card__actions">
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}>
                      <MdEdit /> Edit
                    </button>
                    <button className="delete-btn" onClick={(e) => handleDeleteAddress(address.addressId, e)}>
                      <MdDelete /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="add-address-section">
          <button className="add-address-btn" onClick={() => setShowAddressForm(true)} disabled={saving}>
            <MdAdd /> Add New Address
          </button>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="checkout-step two-column">
      {/* Left Column - Payment Methods */}
      <div className="step-left">
        <div className="step-header">
          <h2>Payment Method</h2>
          <p className="step-subtitle">Choose how you want to pay</p>
        </div>

        <div className="payment-methods">
          <div className="payment-card selected">
            <div className="payment-card__radio">
              <div className="radio-btn checked">
                <MdCheckCircle />
              </div>
            </div>
            <div className="payment-card__icon">
              <MdMoney />
            </div>
            <div className="payment-card__info">
              <div className="payment-card__name">Cash on Delivery</div>
              <div className="payment-card__desc">Pay when you receive your order</div>
            </div>
          </div>

          <div className="payment-card disabled">
            <div className="payment-card__radio">
              <div className="radio-btn"></div>
            </div>
            <div className="payment-card__icon">
              <MdCreditCard />
            </div>
            <div className="payment-card__info">
              <div className="payment-card__name">Credit/Debit Card</div>
              <div className="payment-card__desc">Coming Soon</div>
            </div>
          </div>

          <div className="payment-card disabled">
            <div className="payment-card__radio">
              <div className="radio-btn"></div>
            </div>
            <div className="payment-card__icon">
              <MdQrCode />
            </div>
            <div className="payment-card__info">
              <div className="payment-card__name">UPI / QR Code</div>
              <div className="payment-card__desc">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Order Confirmation */}
      <div className="step-right">
        <div className="order-confirmation">
          <h3>Confirm Your Order</h3>
          <div className="confirmation-details">
            <div className="delivery-summary">
              <div className="summary-item">
                <MdLocationOn />
                <div>
                  <strong>Delivery Address</strong>
                  {selectedAddress ? (
                    <>
                      <p>{selectedAddress.fullName}, {selectedAddress.mobile}</p>
                      <p>{selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                    </>
                  ) : (
                    <p className="error">No address selected</p>
                  )}
                </div>
              </div>
              <div className="summary-item">
                <MdShoppingBag />
                <div>
                  <strong>Order Summary</strong>
                  <p>{cartSummary.totalItems} items • ₹{cartSummary.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="order-total-final">
              <div className="total-row">
                <span>Total Amount</span>
                <span className="total-price">₹{cartSummary.total.toLocaleString()}</span>
              </div>
              <div className="payment-note">
                <p>💰 Pay ₹{cartSummary.total.toLocaleString()} when your order arrives</p>
                <p>📦 Estimated delivery: 3-7 business days</p>
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
      <div className="checkout-container">
        <div className="login-required">
          <div className="login-icon">🔒</div>
          <h2>Login Required</h2>
          <p>Please login to proceed with checkout.</p>
          <button onClick={() => navigate('/login')} className="auth-btn">Go to Login</button>
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
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout.</p>
          <button onClick={() => navigate('/products')} className="continue-btn">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <ToastContainer position="top-center" autoClose={3000} theme="light" />

      <div className="checkout-progress">
        {steps.map((step, index) => (
          <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}>
            <div className={`step-circle ${currentStep > step.number ? 'completed' : ''}`}>
              {currentStep > step.number ? <MdCheckCircle /> : step.number}
            </div>
            <div className="step-info">
              <span className="step-name">{step.name}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-line ${currentStep > step.number ? 'active' : ''}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="checkout-content" ref={contentRef}>
        {currentStep === 1 && renderReviewStep()}
        {currentStep === 2 && renderAddressStep()}
        {currentStep === 3 && renderPaymentStep()}
      </div>

      <div className="checkout-navigation">
        <button className="nav-btn back-btn" onClick={goToPrevStep}>
          <MdArrowBack /> {currentStep === 1 ? 'Back to Cart' : 'Back'}
        </button>
        {currentStep < 3 ? (
          <button className="nav-btn next-btn" onClick={goToNextStep}>
            Continue <MdArrowForward />
          </button>
        ) : (
          <button className="nav-btn place-order-btn" onClick={handlePlaceOrder} disabled={saving}>
            {saving ? <><span className="spinner-small"></span> Processing...</> : 'Place Order'}
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