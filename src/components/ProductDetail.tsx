import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, ShoppingCart, Truck, Shield, RotateCcw, MessageSquare } from 'lucide-react';
import { useProduct, useReviews } from '../hooks/useSupabase';
import { Product, User } from '../types';
import ReviewForm from './ReviewForm';
import { supabase } from '../lib/supabase';

interface ProductDetailProps {
  productId: string;
  onAddToCart: (product: Product) => void;
  onBack: () => void;
  user?: User | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onAddToCart, onBack, user }) => {
  const { product, loading: productLoading } = useProduct(productId);
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(productId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    if (product?.seller_id) {
      fetchSeller(product.seller_id);
    }
  }, [product]);

  useEffect(() => {
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `product_id=eq.${productId}`
        },
        () => {
          refetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, refetchReviews]);

  const fetchSeller = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('shop_name')
        .eq('id', sellerId)
        .maybeSingle();

      if (!error && data) {
        setSeller(data);
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onBack();
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={handleBack}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const calculateTimeLeft = () => {
    if (!product.offer_ends_at) return '';
    
    const now = new Date().getTime();
    const offerEnd = new Date(product.offer_ends_at).getTime();
    const difference = offerEnd - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else {
        return `${hours}h ${minutes}m`;
      }
    }
    return 'Expired';
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined
    };
    onAddToCart(cartItem);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedImage === index ? 'border-pink-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600">
                {product.description}
                {product.stock <= 3 && product.stock > 0 && (
                  <span className="text-red-600 font-semibold ml-2">
                    Only {product.stock} left in stock!
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="text-red-600 font-semibold ml-2">
                    Out of Stock
                  </span>
                )}
              </p>
              {seller && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Seller:</span> {seller.shop_name}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex">
                {renderStars(averageRating)}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-pink-600">₹{product.price}</span>
                <span className="text-xl text-gray-500 line-through">₹{product.mrp}</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                  {product.discount}% OFF
                </span>
              </div>
              {product.offer_ends_at && (
                <div className="flex items-center text-red-600 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Offer ends in: {calculateTimeLeft()}</span>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
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
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
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

            {/* Expected Delivery */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Truck className="h-5 w-5" />
                <span className="font-medium">Expected Delivery: {expectedDelivery}</span>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </span>
            </button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Free Delivery</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">7 Day Returns</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Write a Review</span>
              </button>
            )}
          </div>
          {reviewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {review.user?.name || `User ${review.user?.phone.slice(-4)}`}
                        </span>
                        {review.is_verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mb-4">{review.comment}</p>
                  )}
                  {review.images.length > 0 && (
                    <div className="flex space-x-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>

      {showReviewForm && user && (
        <ReviewForm
          productId={productId}
          userId={user.id}
          onReviewAdded={refetchReviews}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;