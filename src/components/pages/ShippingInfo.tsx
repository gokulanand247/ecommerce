import React from 'react';
import { ArrowLeft, Truck, Package, MapPin, Clock } from 'lucide-react';

interface ShippingInfoProps {
  onBack: () => void;
}

const ShippingInfo: React.FC<ShippingInfoProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Information</h1>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
                <p className="text-gray-600">Free shipping on all orders above ₹999</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Delivery within 5-7 business days</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Secure Packaging</h3>
                <p className="text-gray-600">Products packed securely to prevent damage</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Pan India</h3>
                <p className="text-gray-600">We deliver across all states in India</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Delivery Timeline</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Order Processing</h3>
                <p className="text-gray-600">Orders are processed within 1-2 business days after payment confirmation.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Metro Cities</h3>
                <p className="text-gray-600">Delivery within 3-5 business days for major metro cities.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Other Cities</h3>
                <p className="text-gray-600">Delivery within 5-7 business days for other cities and towns.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Remote Areas</h3>
                <p className="text-gray-600">Delivery may take 7-10 business days for remote or rural areas.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping Charges</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-pink-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Order Value</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Shipping Charge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Below ₹499</td>
                    <td className="border border-gray-300 px-4 py-2">₹99</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">₹499 - ₹998</td>
                    <td className="border border-gray-300 px-4 py-2">₹49</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">₹999 and above</td>
                    <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Order Tracking</h2>
            <p className="text-gray-600 mb-4">
              Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order status in the "My Orders" section of your account.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>Note:</strong> Delivery times are estimates and may vary due to courier partner delays, festivals, or unforeseen circumstances.
              </p>
            </div>
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Questions About Shipping?</h3>
            <p className="text-gray-600">
              If you have any questions about shipping or need to track your order, please contact our customer support team. We're here to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;
