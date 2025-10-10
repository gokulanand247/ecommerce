import React, { useState, useEffect } from 'react';
import { Store, CheckCircle, XCircle, Clock, Eye, Ban } from 'lucide-react';
import { getAllSellers, verifySeller, toggleSellerStatus } from '../../services/sellerService';

const SellerManagement: React.FC = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const data = await getAllSellers();
      setSellers(data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (sellerId: string) => {
    if (!confirm('Are you sure you want to verify this seller?')) return;

    try {
      const adminId = 'admin-id-placeholder';
      await verifySeller(sellerId, adminId);
      alert('Seller verified successfully!');
      fetchSellers();
    } catch (error) {
      alert('Error verifying seller');
    }
  };

  const handleToggleStatus = async (sellerId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this seller?`)) return;

    try {
      await toggleSellerStatus(sellerId, !currentStatus);
      alert(`Seller ${action}d successfully!`);
      fetchSellers();
    } catch (error) {
      alert(`Error ${action}ing seller`);
    }
  };

  const getVerificationBadge = (seller: any) => {
    if (!seller.profile_completed) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          Profile Incomplete
        </span>
      );
    }
    if (seller.verification_requested_at && !seller.is_verified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </span>
      );
    }
    if (seller.is_verified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </span>
      );
    }
    return null;
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Seller Management</h2>
        <p className="text-gray-600 mt-1">Manage seller accounts and verification requests</p>
      </div>

      {sellers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No sellers registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div key={seller.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{seller.shop_name}</h3>
                      {getVerificationBadge(seller)}
                      {!seller.is_active && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Ban className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Username:</strong> {seller.username}</p>
                      <p><strong>Email:</strong> {seller.email}</p>
                      <p><strong>Phone:</strong> {seller.phone}</p>
                      {seller.address && (
                        <p><strong>Address:</strong> {seller.address}, {seller.city}, {seller.state} - {seller.pincode}</p>
                      )}
                      <p><strong>Joined:</strong> {new Date(seller.created_at).toLocaleDateString('en-IN')}</p>
                      {seller.verified_at && (
                        <p><strong>Verified:</strong> {new Date(seller.verified_at).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedSeller(seller);
                      setShowDetails(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>

                  {seller.profile_completed && !seller.is_verified && (
                    <button
                      onClick={() => handleVerify(seller.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Verify Seller</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStatus(seller.id, seller.is_active)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      seller.is_active
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {seller.is_active ? (
                      <>
                        <Ban className="h-4 w-4" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetails && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Seller Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                    <p className="text-gray-900">{selectedSeller.shop_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <p className="text-gray-900">{selectedSeller.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedSeller.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedSeller.phone}</p>
                  </div>
                </div>

                {selectedSeller.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                    <p className="text-gray-900">
                      {selectedSeller.address}<br />
                      {selectedSeller.city}, {selectedSeller.state} - {selectedSeller.pincode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                    <p className="text-gray-900">{new Date(selectedSeller.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  {selectedSeller.last_login && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                      <p className="text-gray-900">{new Date(selectedSeller.last_login).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {selectedSeller.verified_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verified On</label>
                      <p className="text-gray-900">{new Date(selectedSeller.verified_at).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completed:</span>
                    {selectedSeller.profile_completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Verified:</span>
                    {selectedSeller.is_verified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Active:</span>
                    {selectedSeller.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {selectedSeller.profile_completed && !selectedSeller.is_verified && (
                  <button
                    onClick={() => {
                      handleVerify(selectedSeller.id);
                      setShowDetails(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Verify Now
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagement;
