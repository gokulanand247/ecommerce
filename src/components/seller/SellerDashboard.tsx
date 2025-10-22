import React, { useState, useEffect } from 'react';
import { LogOut, Package, ShoppingBag, Store, AlertCircle, CheckCircle } from 'lucide-react';
import { Seller, updateSellerProfile, requestVerification } from '../../services/sellerService';
import SellerProfileSetup from './SellerProfileSetup';
import SellerProducts from './SellerProducts';
import SellerOrders from './SellerOrders';

interface SellerDashboardProps {
  seller: Seller;
  onLogout: () => void;
}

type TabType = 'products' | 'orders';

const SellerDashboard: React.FC<SellerDashboardProps> = ({ seller, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [currentSeller, setCurrentSeller] = useState(seller);

  const handleProfileComplete = (updatedSeller: Seller) => {
    setCurrentSeller(updatedSeller);
  };

  if (!currentSeller.profile_completed) {
    return (
      <SellerProfileSetup
        seller={currentSeller}
        onComplete={handleProfileComplete}
        onLogout={onLogout}
      />
    );
  }

  if (!currentSeller.is_verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
          <p className="text-gray-600 mb-6">
            Your seller account is awaiting admin verification. You'll be able to access the dashboard once your account is approved.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This usually takes 24-48 hours. We'll notify you once verified.
          </p>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Store className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Seller Dashboard</h1>
              </div>
              <p className="text-red-100">
                {currentSeller.shop_name} ({currentSeller.username})
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span className="text-sm text-green-100">Verified Seller</span>
              </div>
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

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
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
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="font-medium">Orders</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && <SellerProducts sellerId={currentSeller.seller_id} />}
        {activeTab === 'orders' && <SellerOrders sellerId={currentSeller.seller_id} />}
      </div>
    </div>
  );
};

export default SellerDashboard;
