import React, { useState } from 'react';
import { X, Plus, CreditCard, Tag } from 'lucide-react';
import { User, CartItem } from '../types';
import { useAddresses } from '../hooks/useSupabase';
import { createOrder, updateOrderPayment } from '../services/orderService';
import { applyCoupon } from '../services/couponService';
import { showToast } from './Toast';

interface CheckoutModalProps {
  user: User;
  cartItems: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onOrderComplete: () => void;
}

const EnhancedCheckoutModal: React.FC<CheckoutModalProps> = ({
  user,
  cartItems,
  totalPrice,
  onClose,
  onOrderComplete
}) => {
  const { addresses, addAddress } = useAddresses(user.id);
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user.name || '',
    phone: user.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const subtotal = totalPrice;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setError('');

    try {
      const result = await applyCoupon(couponCode.toUpperCase(), subtotal);

      if (result.coupon_id) {
        setAppliedCoupon(result);
        setDiscountAmount(result.discount_amount);
        setError('');
        showToast('Coupon applied successfully!', 'success');
      } else {
        setError(result.message);
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch (err) {
      setError('Invalid or expired coupon code');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setError('');
  };

  const handleAddAddress = async () => {
    const errors = [];
    if (!newAddress.name.trim()) errors.push('Name is required');
    if (!newAddress.phone.trim()) errors.push('Phone number is required');
    if (!newAddress.street.trim()) errors.push('Street address is required');
    if (!newAddress.city.trim()) errors.push('City is required');
    if (!newAddress.state.trim()) errors.push('State is required');
    if (!newAddress.pincode.trim()) errors.push('Pincode is required');
    if (newAddress.phone.length !== 10) errors.push('Phone number must be 10 digits');
    if (newAddress.pincode.length !== 6) errors.push('Pincode must be 6 digits');

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setError('');
      const addressData = {
        user_id: user.id,
        ...newAddress,
        is_default: addresses.length === 0
      };

      const address = await addAddress(addressData);
      setSelectedAddress(address.id);
      setShowAddressForm(false);
      setNewAddress({
        name: user.name || '',
        phone: user.phone || '',
        street: '',
        city: '',
        state: '',
        pincode: ''
      });
    } catch (err) {
      setError('Failed to add address. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    if (!selectedAddr) {
      setError('Selected address not found');
      return;
    }

    const itemsWithSizeColor = cartItems.filter(item =>
      item.selectedSize && item.selectedColor
    );

    if (itemsWithSizeColor.length !== cartItems.length) {
      setError('Please select size and color for all items');
      return;
    }

    setError('');
    setIsProcessing(true);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey || razorpayKey === 'your_razorpay_key_id') {
      showToast('Razorpay not configured. Creating order in test mode...', 'info');
      try {
        const order = await createOrder(
          user.id,
          cartItems,
          selectedAddr,
          finalTotal,
          appliedCoupon?.coupon_id,
          discountAmount,
          subtotal
        );
        await updateOrderPayment(order.id, 'test_payment_' + Date.now(), 'completed');
        setIsProcessing(false);
        showToast('Order placed successfully in test mode!', 'success');
        onOrderComplete();
      } catch (err) {
        console.error('Order creation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
        setError(errorMessage);
        setIsProcessing(false);
      }
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: Math.round(finalTotal * 100),
        currency: 'INR',
        name: 'DressHub',
        description: 'Order Payment',
        image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200',
        handler: async function (response: any) {
          try {
            const order = await createOrder(
              user.id,
              cartItems,
              selectedAddr,
              finalTotal,
              appliedCoupon?.coupon_id,
              discountAmount,
              subtotal
            );
            await updateOrderPayment(order.id, response.razorpay_payment_id, 'completed');
            setIsProcessing(false);
            showToast('Payment successful! Your order has been placed.', 'success');
            onOrderComplete();
          } catch (err) {
            setError('Order creation failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            setIsProcessing(false);
          }
        },
        prefill: {
          name: selectedAddr.name,
          email: user.email || '',
          contact: selectedAddr.phone
        },
        notes: {
          address: `${selectedAddr.street}, ${selectedAddr.city}`,
          coupon_code: appliedCoupon?.code || 'none'
        },
        theme: {
          color: '#dc2626'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            showToast('Payment cancelled', 'info');
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any){
        setIsProcessing(false);
        setError('Payment failed: ' + response.error.description);
        showToast('Payment failed', 'error');
      });
      razorpay.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {step === 'address' ? 'Select Delivery Address' : 'Payment'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="overflow-y-auto max-h-96 p-4">
          {step === 'address' ? (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAddress === address.id
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedAddress(address.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={selectedAddress === address.id}
                        onChange={() => setSelectedAddress(address.id)}
                        className="mt-1"
                      />
                      <div>
                        <h3 className="font-semibold">{address.name}</h3>
                        <p className="text-sm text-gray-600">{address.phone}</p>
                        <p className="text-sm text-gray-600">
                          {address.street}, {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add New Address</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold mb-3">Add New Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAddress}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
                      >
                        Add Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount Applied</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold mt-2">
                      <span>Total</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Apply Coupon</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Coupon Applied!</p>
                        <p className="text-sm text-green-700">You saved ₹{discountAmount}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Payment Method</h3>
                <div className="flex items-center space-x-3 p-4 border-2 border-red-600 bg-red-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Secure Payment via Razorpay</p>
                    <p className="text-sm text-red-700">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                    <p className="text-xs text-red-600 mt-1">100% Secure & Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          {step === 'address' ? (
            <button
              onClick={() => setStep('payment')}
              disabled={!selectedAddress}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors"
            >
              Continue to Payment
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('address')}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${finalTotal}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutModal;
