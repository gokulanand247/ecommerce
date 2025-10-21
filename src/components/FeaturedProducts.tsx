import React, { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  onAddToCart: (product: Product) => void;
  onProductClick: (productId: string) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ onAddToCart, onProductClick }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products_view')
        .select('*')
        .limit(6);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 h-96 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-red-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-8">
          <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Star className="h-8 w-8 text-yellow-500 ml-3 fill-yellow-500" />
        </div>

        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Handpicked collection of our most popular and trending styles
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <div key={product.id} className="relative group">
              <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-red-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Featured
              </div>
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onProductClick={onProductClick}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
