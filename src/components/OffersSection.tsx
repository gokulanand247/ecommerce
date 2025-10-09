import React from 'react';
import { Percent, Gift, Truck, CreditCard } from 'lucide-react';

const OffersSection: React.FC = () => {
  const offers = [
    {
      icon: <Percent className="h-8 w-8" />,
      title: 'Up to 50% Off',
      description: 'On selected items'
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: 'Free Gift',
      description: 'On orders above ₹2999'
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Free Delivery',
      description: 'On orders above ₹999'
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'Easy Returns',
      description: '7 day return policy'
    }
  ];

  return (
    <section className="py-8 bg-gradient-to-r from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {offers.map((offer, index) => (
            <div key={index} className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-pink-600 flex justify-center mb-3">
                {offer.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
              <p className="text-sm text-gray-600">{offer.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersSection;