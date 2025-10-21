import React, { useState, useEffect } from 'react';
import { LogOut, Package, ShoppingBag, Plus, Edit, Trash2, Image as ImageIcon, X, Save, Store, Tag, Zap } from 'lucide-react';
import { Admin, uploadProductImage } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useSupabase';
import OrderManagement from './OrderManagement';
import SellerManagement from './SellerManagement';
import CouponManagement from './CouponManagement';
import DealsManagement from './DealsManagement';

interface AdminDashboardProps {
  admin: Admin;
  onLogout: () => void;
}

type TabType = 'products' | 'orders' | 'sellers' | 'coupons' | 'deals';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
  const { products, refetch } = useProducts();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    category: 'sarees',
    image_url: '',
    sizes: [] as string[],
    colors: [] as string[],
    stock: '',
    is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const categories = [
    { id: 'sarees', name: 'Sarees' },
    { id: 'western', name: 'Western Wear' },
    { id: 'ethnic', name: 'Ethnic Wear' },
    { id: 'party', name: 'Party Wear' },
    { id: 'casual', name: 'Casual Wear' }
  ];

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const availableColors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange'];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeToggle = (size: string) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (color: string) => {
    setProductForm(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || !productForm.price || !productForm.mrp) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = productForm.image_url;

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        mrp: parseFloat(productForm.mrp),
        category: productForm.category,
        image_url: imageUrl,
        sizes: productForm.sizes,
        colors: productForm.colors,
        stock: parseInt(productForm.stock) || 0,
        is_active: productForm.is_active
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        alert('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        alert('Product created successfully!');
      }

      resetForm();
      refetch();
    } catch (error) {
      alert('Error saving product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      mrp: product.mrp.toString(),
      category: product.category,
      image_url: product.image_url,
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock?.toString() || '0',
      is_active: product.is_active
    });
    setImagePreview(product.image_url);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      alert('Product deleted successfully!');
      refetch();
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      mrp: '',
      category: 'sarees',
      image_url: '',
      sizes: [],
      colors: [],
      stock: '',
      is_active: true
    });
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
    setShowProductForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100">Welcome, {admin.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Products</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="font-medium">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sellers'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Store className="h-5 w-5" />
              <span className="font-medium">Sellers</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'coupons'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag className="h-5 w-5" />
              <span className="font-medium">Coupons</span>
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'deals'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap className="h-5 w-5" />
              <span className="font-medium">Deals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <div>
            {/* Add Product Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              <button
                onClick={() => setShowProductForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-purple-700 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen p-4">
                  <div className="bg-white rounded-lg max-w-4xl w-full my-8">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <button
                        onClick={resetForm}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitProduct} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                          </label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* MRP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            MRP (₹) *
                          </label>
                          <input
                            type="number"
                            value={productForm.mrp}
                            onChange={(e) => setProductForm({...productForm, mrp: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                        </div>

                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selling Price (₹) *
                          </label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                        </div>

                        {/* Stock */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Quantity
                          </label>
                          <input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={productForm.is_active}
                            onChange={(e) => setProductForm({...productForm, is_active: e.target.checked})}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Product Active
                          </label>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Image
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                            <ImageIcon className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-700">Choose Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                          )}
                        </div>
                        {!imagePreview && !editingProduct && (
                          <p className="text-sm text-gray-500 mt-2">Or enter image URL below</p>
                        )}
                        <input
                          type="url"
                          value={productForm.image_url}
                          onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* Sizes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Available Sizes
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map(size => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSizeToggle(size)}
                              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                productForm.sizes.includes(size)
                                  ? 'border-red-600 bg-red-50 text-red-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colors */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Available Colors
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorToggle(color)}
                              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                productForm.colors.includes(color)
                                  ? 'border-red-600 bg-red-50 text-red-600'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all"
                        >
                          <Save className="h-5 w-5" />
                          <span>{isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}</span>
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
              </div>
            )}

            {/* Products List */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-red-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500 line-through">₹{product.mrp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Category: {product.category}</p>
                    <p className="text-sm text-gray-600 mb-4">Stock: {product.stock || 0}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderManagement />
        )}

        {activeTab === 'sellers' && (
          <SellerManagement />
        )}

        {activeTab === 'coupons' && (
          <CouponManagement />
        )}

        {activeTab === 'deals' && (
          <DealsManagement />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
