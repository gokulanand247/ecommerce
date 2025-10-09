import React, { useState } from 'react';
import { Store, LogOut } from 'lucide-react';
import { Seller, updateSellerProfile, requestVerification, SellerProfile } from '../../services/sellerService';

interface SellerProfileSetupProps {
  seller: Seller;
  onComplete: (seller: Seller) => void;
  onLogout: () => void;
}

const SellerProfileSetup: React.FC<SellerProfileSetupProps> = ({ seller, onComplete, onLogout }) => {
  const [profile, setProfile] = useState<SellerProfile>({
    shop_name: seller.shop_name || '',
    email: seller.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = [];
    if (!profile.shop_name.trim()) errors.push('Shop name is required');
    if (!profile.email.trim()) errors.push('Email is required');
    if (!profile.phone.trim()) errors.push('Phone is required');
    if (!profile.address.trim()) errors.push('Address is required');
    if (!profile.city.trim()) errors.push('City is required');
    if (!profile.state.trim()) errors.push('State is required');
    if (!profile.pincode.trim()) errors.push('Pincode is required');
    if (profile.phone.length !== 10) errors.push('Phone must be 10 digits');
    if (profile.pincode.length !== 6) errors.push('Pincode must be 6 digits');

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSellerProfile(seller.seller_id, profile);
      await requestVerification(seller.seller_id);

      const updatedSeller = {
        ...seller,
        profile_completed: true,
        shop_name: profile.shop_name,
        email: profile.email
      };

      onComplete(updatedSeller);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Complete Your Seller Profile</h1>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Your Shop</h2>
            <p className="text-gray-600">
              Please provide your shop details. Your account will be sent for admin verification once you submit.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name *
              </label>
              <input
                type="text"
                value={profile.shop_name}
                onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter your shop name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="10-digit phone"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Address *
              </label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter complete shop address"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="State"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={profile.pincode}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="6-digit"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> After submission, your account will be reviewed by the admin.
              You'll receive verification within 24-48 hours. Once verified, you can start adding and managing your products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfileSetup;
