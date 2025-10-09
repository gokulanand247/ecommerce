import React, { useState, useEffect } from 'react';
import { Star, Clock, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onProductClick }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const offerEnd = product.offer_ends_at ? new Date(product.offer_ends_at).getTime() : 0;
      const difference = offerEnd - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      } else {
        setTimeLeft('Expired');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [product.offer_ends_at]);

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
  
  const isDress = ['sarees', 'ethnic', 'western', 'party'].includes(product.category);
  
  const handleAddToCart = () => {
    if (isDress && product.sizes.length > 0 && !selectedSize) {
      setShowSizeModal(true);
      return;
    }
    
    const cartItem = {
      ...product,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined
    };
    onAddToCart(cartItem);
    
    // Reset selections
    setSelectedSize('');
    setSelectedColor('');
  };
  
  const handleSizeModalConfirm = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    const cartItem = {
      ...product,
      selectedSize,
      selectedColor: selectedColor || undefined
    };
    onAddToCart(cartItem);
    
    // Reset and close modal
    setSelectedSize('');
    setSelectedColor('');
    setShowSizeModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {/* Product Image */}
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={() => onProductClick(product.id)}
        >
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discount}% OFF
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 md:p-4">
          <h3 
            className="font-semibold text-gray-900 mb-2 text-sm md:text-base line-clamp-2 cursor-pointer hover:text-pink-600"
            onClick={() => onProductClick(product.id)}
          >
            {product.name}
          </h3>
          
          <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>

          {/* Timer */}
          {product.offer_ends_at && (
            <div className="flex items-center text-red-600 text-xs mb-3">
              <Clock className="h-3 w-3 mr-1" />
              <span>Offer ends in: {timeLeft}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-pink-600">₹{product.price}</span>
              <span className="text-sm text-gray-500 line-through ml-2">₹{product.mrp}</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Size Selection Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Select Size & Color</h3>
            
            {/* Size Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-pink-600 bg-pink-50 text-pink-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? 'border-pink-600 bg-pink-50 text-pink-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedSize('');
                  setSelectedColor('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSizeModalConfirm}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-md transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;