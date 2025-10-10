import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Zap, X, Save } from 'lucide-react';
import { getAllDeals, createDeal, updateDeal, deleteDeal } from '../../services/dealsService';
import { useProducts } from '../../hooks/useSupabase';

const DealsManagement: React.FC = () => {
  const { products } = useProducts();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    discount_percentage: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
    sort_order: '0'
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await getAllDeals();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.discount_percentage) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const dealData = {
        product_id: formData.product_id,
        discount_percentage: parseInt(formData.discount_percentage),
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0
      };

      if (editingDeal) {
        await updateDeal(editingDeal.id, dealData);
        alert('Deal updated successfully!');
      } else {
        await createDeal(dealData);
        alert('Deal created successfully!');
      }

      resetForm();
      fetchDeals();
    } catch (error) {
      alert('Error saving deal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormData({
      product_id: deal.product_id,
      discount_percentage: deal.discount_percentage.toString(),
      valid_from: new Date(deal.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(deal.valid_until).toISOString().slice(0, 16),
      is_active: deal.is_active,
      sort_order: deal.sort_order.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await deleteDeal(dealId);
      alert('Deal deleted successfully!');
      fetchDeals();
    } catch (error) {
      alert('Error deleting deal');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      discount_percentage: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
      sort_order: '0'
    });
    setEditingDeal(null);
    setShowForm(false);
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Today's Deals</h2>
          <p className="text-gray-600 mt-1">Create and manage special deals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Deal</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingDeal ? 'Edit Deal' : 'Add New Deal'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount % *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({...formData, sort_order: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex items-center pt-8">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all"
                  >
                    <Save className="h-5 w-5" />
                    <span>{isSubmitting ? 'Saving...' : editingDeal ? 'Update' : 'Create'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No deals created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                !deal.is_active || isExpired(deal.valid_until) ? 'opacity-60' : ''
              }`}
            >
              {deal.products && (
                <img
                  src={deal.products.image_url}
                  alt={deal.products.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-pink-600">{deal.discount_percentage}% OFF</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(deal)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {deal.products && (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2">{deal.products.name}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{Math.round(deal.products.price * (1 - deal.discount_percentage / 100))}
                      </span>
                      <span className="text-sm text-gray-500 line-through">₹{deal.products.price}</span>
                    </div>
                  </>
                )}

                <div className="text-sm text-gray-600 mb-3">
                  <p>Valid until: {new Date(deal.valid_until).toLocaleDateString('en-IN')}</p>
                </div>

                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  deal.is_active && !isExpired(deal.valid_until)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {!deal.is_active ? 'Inactive' : isExpired(deal.valid_until) ? 'Expired' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealsManagement;
