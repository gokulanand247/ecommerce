import React, { useState, useEffect } from 'react';
import { Package, User, MapPin, Calendar, CreditCard, Truck } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../../services/adminService';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const orderStatuses = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'processing', label: 'Processing', color: 'indigo' },
    { value: 'shipped', label: 'Shipped', color: 'purple' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'orange' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus});
      }
      alert('Order status updated successfully!');
    } catch (error) {
      alert('Error updating order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = orderStatuses.find(s => s.value === status);
    return statusConfig?.color || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = orderStatuses.find(s => s.value === status);
    return statusConfig?.label || status;
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
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <p className="text-gray-600">Total Orders: {orders.length}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4 max-h-[800px] overflow-y-auto">
          {orders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all ${
                selectedOrder?.id === order.id ? 'ring-2 ring-pink-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">{order.users?.name || 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-4 w-4" />
                  <span>₹{order.total_amount}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {order.order_items?.length || 0} items
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Details */}
        {selectedOrder ? (
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 max-h-[800px] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Details</h3>

            {/* Status Update */}
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Order Status
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                disabled={updatingStatus}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                {orderStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {updatingStatus && (
                <p className="text-sm text-gray-600 mt-2">Updating status...</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-pink-600" />
                Customer Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedOrder.users?.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {selectedOrder.users?.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {selectedOrder.users?.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.addresses && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-pink-600" />
                  Delivery Address
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{selectedOrder.addresses.name}</p>
                  <p>{selectedOrder.addresses.street}</p>
                  <p>{selectedOrder.addresses.city}, {selectedOrder.addresses.state}</p>
                  <p>PIN: {selectedOrder.addresses.pincode}</p>
                  <p>Phone: {selectedOrder.addresses.phone}</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2 text-pink-600" />
                Order Items
              </h4>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {item.products?.image_url && (
                      <img
                        src={item.products.image_url}
                        alt={item.products?.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.products?.name || 'Product'}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.selected_size && (
                        <p className="text-sm text-gray-600">Size: {item.selected_size}</p>
                      )}
                      {item.selected_color && (
                        <p className="text-sm text-gray-600">Color: {item.selected_color}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.price}</p>
                      {item.mrp && item.mrp > item.price && (
                        <p className="text-sm text-gray-500 line-through">₹{item.mrp}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-pink-600" />
                Payment Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal || selectedOrder.total_amount}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{selectedOrder.discount_amount}</span>
                    </div>
                    {selectedOrder.coupons && (
                      <p className="text-xs text-gray-500">
                        Coupon: {selectedOrder.coupons.code}
                      </p>
                    )}
                  </>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-pink-600">₹{selectedOrder.total_amount}</span>
                </div>
                <p className="text-gray-600">
                  Payment Status: <span className={`font-semibold ${selectedOrder.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedOrder.payment_status || 'Pending'}
                  </span>
                </p>
                {selectedOrder.payment_id && (
                  <p className="text-gray-600">Payment ID: {selectedOrder.payment_id}</p>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {selectedOrder.tracking_number && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Truck className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Tracking Number</p>
                    <p className="text-sm">{selectedOrder.tracking_number}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center text-gray-500">
            Select an order to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
