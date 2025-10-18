import { useState } from 'react';
import { X, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { CartItem, PromoCode } from '../types';
import { supabase } from '../lib/supabase';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClose,
  onCheckout
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMRP = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const savings = totalMRP - subtotal;

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setPromoError('Invalid promo code');
        setIsApplyingPromo(false);
        return;
      }

      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = new Date(data.valid_until);

      if (now < validFrom || now > validUntil) {
        setPromoError('This promo code has expired');
        setIsApplyingPromo(false);
        return;
      }

      if (subtotal < data.min_order_amount) {
        setPromoError(`Minimum order amount of ₹${data.min_order_amount} required`);
        setIsApplyingPromo(false);
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setPromoError('This promo code has reached its usage limit');
        setIsApplyingPromo(false);
        return;
      }

      setAppliedPromo(data);
      setPromoError('');
    } catch (error) {
      console.error('Error applying promo code:', error);
      setPromoError('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;

    let discount = 0;
    if (appliedPromo.discount_type === 'percentage') {
      discount = (subtotal * appliedPromo.discount_value) / 100;
      if (appliedPromo.max_discount_amount) {
        discount = Math.min(discount, appliedPromo.max_discount_amount);
      }
    } else {
      discount = appliedPromo.discount_value;
    }

    return Math.min(discount, subtotal);
  };

  const discount = calculateDiscount();
  const totalPrice = subtotal - discount;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart ({items.length})</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 max-h-96">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 border-b pb-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    {(item.selectedSize || item.selectedColor) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        {item.selectedSize && item.selectedColor && <span> | </span>}
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <p className="text-pink-600 font-semibold">₹{item.price}</p>
                      {item.mrp > item.price && (
                        <p className="text-gray-400 line-through text-sm">₹{item.mrp}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal (MRP)</span>
                <span className="line-through text-gray-400">₹{totalMRP.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Discount on MRP</span>
                  <span className="text-green-600">-₹{savings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price Total</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-3">
              {!appliedPromo ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a promo code?
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={applyPromoCode}
                      disabled={isApplyingPromo}
                      className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {isApplyingPromo ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-red-500 text-xs mt-1">{promoError}</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {appliedPromo.code} applied!
                      </p>
                      <p className="text-xs text-green-600">
                        {appliedPromo.description}
                      </p>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-green-600">Promo Discount</span>
                    <span className="text-green-600 font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-lg font-bold text-pink-600">₹{totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-md transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;