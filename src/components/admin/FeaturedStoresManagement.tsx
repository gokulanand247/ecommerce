import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Seller {
  id: string;
  shop_name: string;
  email: string;
  phone: string;
  city: string;
  is_verified: boolean;
}

interface FeaturedStore {
  id: string;
  seller_id: string;
  sort_order: number;
  is_active: boolean;
  sellers: Seller;
}

const FeaturedStoresManagement: React.FC = () => {
  const [featuredStores, setFeaturedStores] = useState<FeaturedStore[]>([]);
  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [featuredRes, sellersRes] = await Promise.all([
        supabase
          .from('featured_stores')
          .select(`
            *,
            sellers (
              id,
              shop_name,
              email,
              phone,
              city,
              is_verified
            )
          `)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('sellers')
          .select('id, shop_name, email, phone, city, is_verified')
          .eq('is_verified', true)
          .eq('is_active', true)
      ]);

      if (featuredRes.error) throw featuredRes.error;
      if (sellersRes.error) throw sellersRes.error;

      setFeaturedStores(featuredRes.data || []);
      setAllSellers(sellersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeatured = async () => {
    if (!selectedSellerId) {
      alert('Please select a seller');
      return;
    }

    if (featuredStores.length >= 4) {
      alert('You can only feature up to 4 stores on the homepage');
      return;
    }

    const alreadyFeatured = featuredStores.some(
      fs => fs.seller_id === selectedSellerId
    );

    if (alreadyFeatured) {
      alert('This store is already featured');
      return;
    }

    try {
      const nextSortOrder = featuredStores.length + 1;

      const { error } = await supabase
        .from('featured_stores')
        .insert([{
          seller_id: selectedSellerId,
          sort_order: nextSortOrder,
          is_active: true
        }]);

      if (error) throw error;

      alert('Store added to featured successfully!');
      setShowAddModal(false);
      setSelectedSellerId('');
      fetchData();
    } catch (error) {
      alert('Error adding featured store: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRemoveFeatured = async (featuredId: string) => {
    if (!confirm('Remove this store from featured list?')) return;

    try {
      const { error } = await supabase
        .from('featured_stores')
        .delete()
        .eq('id', featuredId);

      if (error) throw error;

      alert('Store removed from featured successfully!');
      fetchData();
    } catch (error) {
      alert('Error removing featured store');
    }
  };

  const handleMoveFeatured = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= featuredStores.length) return;

    const updatedStores = [...featuredStores];
    [updatedStores[index], updatedStores[newIndex]] = [updatedStores[newIndex], updatedStores[index]];

    try {
      const updates = updatedStores.map((store, idx) => ({
        id: store.id,
        sort_order: idx + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('featured_stores')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      fetchData();
    } catch (error) {
      alert('Error reordering stores');
    }
  };

  const availableSellers = allSellers.filter(
    seller => !featuredStores.some(fs => fs.seller_id === seller.id)
  );

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Stores</h2>
          <p className="text-gray-600 mt-1">
            Manage top 4 stores displayed on the homepage ({featuredStores.length}/4)
          </p>
        </div>
        {featuredStores.length < 4 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Featured Store
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {featuredStores.map((featured, index) => (
          <div
            key={featured.id}
            className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
          >
            <div className="flex items-center flex-1">
              <div className="bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {featured.sellers.shop_name}
                  </h3>
                </div>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    Email: {featured.sellers.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {featured.sellers.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location: {featured.sellers.city}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleMoveFeatured(index, 'up')}
                disabled={index === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleMoveFeatured(index, 'down')}
                disabled={index === featuredStores.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleRemoveFeatured(featured.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Remove"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {featuredStores.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No featured stores yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add stores to feature them on the homepage
            </p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Add Featured Store</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Store
              </label>
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Choose a store...</option>
                {availableSellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.shop_name} - {seller.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedSellerId('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeatured}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Add Featured
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedStoresManagement;
