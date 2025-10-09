import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle } from 'lucide-react';
import { getSellerOrders } from '../../services/sellerService';

interface SellerOrdersProps {
  sellerId: string;
}

const SellerOrders: React.FC<SellerOrdersProps> = ({ sellerId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerOrders(sellerId);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet for your products</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((orderItem) => {
            const order = orderItem.orders;
            return (
              <div key={orderItem.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{getStatusText(order.status)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={orderItem.products.image_url}
                      alt={orderItem.products.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{orderItem.products.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {orderItem.quantity} × ₹{orderItem.price}
                      </p>
                      {orderItem.selected_size && (
                        <p className="text-sm text-gray-600">Size: {orderItem.selected_size}</p>
                      )}
                      {orderItem.selected_color && (
                        <p className="text-sm text-gray-600">Color: {orderItem.selected_color}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-pink-600">₹{orderItem.price * orderItem.quantity}</p>
                    </div>
                  </div>
                </div>

                {order.users && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                    <p className="text-sm text-gray-600">Name: {order.users.name}</p>
                    <p className="text-sm text-gray-600">Phone: {order.users.phone}</p>
                  </div>
                )}

                {order.addresses && (
                  <div className="mt-2">
                    <h4 className="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                    <p className="text-sm text-gray-600">
                      {order.addresses.street}, {order.addresses.city}, {order.addresses.state} - {order.addresses.pincode}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
