import React, { useState } from 'react';
import { X, MapPin, Plus, CreditCard } from 'lucide-react';
import { User, CartItem, Address } from '../types';
import { useAddresses } from '../hooks/useSupabase';
import { createOrder, updateOrderPayment } from '../services/orderService';

interface CheckoutModalProps {
  user: User;
  cartItems: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onOrderComplete: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
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
  const [newAddress, setNewAddress] = useState({
    name: user.name || '',
    phone: user.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleAddAddress = async () => {
    // Validate all required fields
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

    setError('');
    setIsProcessing(true);

    try {
      const order = await createOrder(user.id, cartItems, selectedAddr, totalPrice);

      const options = {
        key: 'rzp_live_RPqf3ZMoQBXot7',
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        name: 'DressHub',
        description: `Order #${order.id.substring(0, 8)}`,
        image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200',
        handler: async function (response: any) {
          try {
            await updateOrderPayment(order.id, response.razorpay_payment_id, 'completed');
            setIsProcessing(false);
            alert('Payment successful! Your order has been placed.');
            onOrderComplete();
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: selectedAddr.name,
          email: user.email || '',
          contact: selectedAddr.phone
        },
        notes: {
          order_id: order.id,
          address: `${selectedAddr.street}, ${selectedAddr.city}`
        },
        theme: {
          color: '#EC4899'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setError('Payment cancelled. Please try again.');
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any){
        setIsProcessing(false);
        setError('Payment failed: ' + response.error.description);
      });
      razorpay.open();
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage + '. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {step === 'address' ? 'Select Delivery Address' : 'Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
              {/* Existing Addresses */}
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAddress === address.id
                      ? 'border-pink-600 bg-pink-50'
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

              {/* Add New Address */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 text-pink-600 hover:text-pink-700"
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
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                        className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-md"
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
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-semibold">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Payment Method</h3>
                <div className="flex items-center space-x-3 p-4 border-2 border-pink-600 bg-pink-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-pink-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-pink-900">Secure Payment via Razorpay</p>
                    <p className="text-sm text-pink-700">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                    <p className="text-xs text-pink-600 mt-1">100% Secure & Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          {step === 'address' ? (
            <button
              onClick={() => setStep('payment')}
              disabled={!selectedAddress}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors"
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
                className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors"
              >
                {isProcessing ? 'Processing...' : `Pay ₹${totalPrice}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;