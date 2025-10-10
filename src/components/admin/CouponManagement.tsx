import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, X, Save } from 'lucide-react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/couponService';

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.description || !formData.discount_value) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData);
        alert('Coupon updated successfully!');
      } else {
        await createCoupon(couponData);
        alert('Coupon created successfully!');
      }

      resetForm();
      fetchCoupons();
    } catch (error) {
      alert('Error saving coupon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
      usage_limit: coupon.usage_limit?.toString() || '',
      is_active: coupon.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await deleteCoupon(couponId);
      alert('Coupon deleted successfully!');
      fetchCoupons();
    } catch (error) {
      alert('Error deleting coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      is_active: true
    });
    setEditingCoupon(null);
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
          <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
          <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Coupon</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., SAVE20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Get 20% off on your first order"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Order (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="No limit"
                    />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Unlimited"
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

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all"
                  >
                    <Save className="h-5 w-5" />
                    <span>{isSubmitting ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}</span>
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

      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No coupons created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white rounded-lg shadow-sm p-6 ${
                !coupon.is_active || isExpired(coupon.valid_until) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-pink-600">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `₹${coupon.discount_value}`}
                  </span>
                </div>
                {coupon.min_order_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Order:</span>
                    <span className="font-medium">₹{coupon.min_order_amount}</span>
                  </div>
                )}
                {coupon.max_discount_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Discount:</span>
                    <span className="font-medium">₹{coupon.max_discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage:</span>
                  <span className="font-medium">
                    {coupon.usage_count} / {coupon.usage_limit || '∞'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className={`font-medium ${isExpired(coupon.valid_until) ? 'text-red-600' : ''}`}>
                    {new Date(coupon.valid_until).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  coupon.is_active && !isExpired(coupon.valid_until)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {!coupon.is_active ? 'Inactive' : isExpired(coupon.valid_until) ? 'Expired' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
