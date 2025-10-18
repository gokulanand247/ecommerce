import React, { useState, useEffect } from 'react';
import { Store, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface StorePageProps {
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (productId: string) => void;
  initialSearchQuery?: string;
}

interface Seller {
  id: string;
  shop_name: string;
  shop_logo: string;
  description: string;
  phone: string;
  created_at: string;
}

const StorePage: React.FC<StorePageProps> = ({ onBack, onAddToCart, onProductClick, initialSearchQuery = '' }) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = sellers.filter(seller =>
        seller.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSellers(filtered);
    } else {
      setFilteredSellers(sellers);
    }
  }, [searchQuery, sellers]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
      setFilteredSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellerProducts(data || []);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    }
  };

  const handleSellerClick = (seller: Seller) => {
    setSelectedSeller(seller);
    fetchSellerProducts(seller.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStores = () => {
    setSelectedSeller(null);
    setSellerProducts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedSellers = showMore ? filteredSellers : filteredSellers.slice(0, 4);

  if (selectedSeller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToStores}
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Stores</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-4">
              <img
                src={selectedSeller.shop_logo || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                alt={selectedSeller.shop_name}
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-600"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedSeller.shop_name}</h1>
                <p className="text-gray-600 mt-1">{selectedSeller.description}</p>
                <p className="text-sm text-gray-500 mt-1">Contact: {selectedSeller.phone}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Products from {selectedSeller.shop_name}</h2>

          {sellerProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products available from this seller</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sellerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onProductClick={onProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop by Store</h1>
          <p className="text-gray-600">Discover amazing products from our verified sellers</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search for stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No stores found matching your search' : 'No stores available'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {displayedSellers.map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => handleSellerClick(seller)}
                  className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-pink-100">
                      <img
                        src={seller.shop_logo || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                        alt={seller.shop_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{seller.shop_name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{seller.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredSellers.length > 4 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {showMore ? 'Show Less' : 'See More Stores'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StorePage;
