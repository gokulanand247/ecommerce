import React, { useState, useEffect } from 'react';
import { Store, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreCategoriesProps {
  onStoreClick: (sellerId: string) => void;
}

interface Seller {
  id: string;
  shop_name: string;
  shop_logo: string;
  description: string;
}

const StoreCategories: React.FC<StoreCategoriesProps> = ({ onStoreClick }) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, shop_name, shop_logo, description')
        .eq('is_active', true)
        .limit(4)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-200 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sellers.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Store</h2>
          <button
            onClick={() => onStoreClick('')}
            className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 font-semibold transition-colors"
          >
            <span className="hidden sm:inline">See All Stores</span>
            <span className="sm:hidden">More</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => onStoreClick(seller.id)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110">
                  <img
                    src={seller.shop_logo || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt={seller.shop_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-pink-600 rounded-full p-2 shadow-lg">
                  <Store className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-center group-hover:text-pink-600 transition-colors">
                {seller.shop_name}
              </h3>
              <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2 px-2">
                {seller.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreCategories;
