import React, { useState, useEffect } from 'react';
import { Clock, Flame } from 'lucide-react';
import { TodaysDeal } from '../types';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';

const TodaysDealSection: React.FC = () => {
  const [deals, setDeals] = useState<TodaysDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase.rpc('get_todays_active_deals');

      if (error) throw error;

      const dealsArray = data || [];
      setDeals(dealsArray.slice(0, 4));
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) return 'Expired';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {};
      deals.forEach((deal) => {
        newTimeRemaining[deal.id] = calculateTimeRemaining(deal.ends_at);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [deals]);

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (deals.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-8">
          <Flame className="h-8 w-8 text-orange-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Today's Deals</h2>
          <Flame className="h-8 w-8 text-orange-600 ml-3" />
        </div>

        <p className="text-center text-gray-600 mb-8">
          Limited time offers - Grab them before they're gone!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal) => {
            if (!deal.product) return null;

            const dealProduct = {
              ...deal.product,
              price: deal.deal_price,
              mrp: deal.original_price,
              discount: Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100)
            };

            return (
              <div key={deal.id} className="relative">
                <div className="absolute top-2 left-2 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1 shadow-lg">
                  <Clock className="h-4 w-4" />
                  <span>{timeRemaining[deal.id] || 'Calculating...'}</span>
                </div>
                <ProductCard product={dealProduct} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TodaysDealSection;
