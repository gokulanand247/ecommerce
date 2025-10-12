import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface ProductFiltersProps {
  categories: { id: string; name: string }[];
  selectedCategory: string;
  priceRange: [number, number];
  sortBy: string;
  minRating: number;
  onCategoryChange: (category: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onSortChange: (sort: string) => void;
  onRatingChange: (rating: number) => void;
  onReset: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategory,
  priceRange,
  sortBy,
  minRating,
  onCategoryChange,
  onPriceRangeChange,
  onSortChange,
  onRatingChange,
  onReset
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4 lg:mb-0">
        <h3 className="text-lg font-semibold flex items-center">
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-pink-600 hover:text-pink-700"
        >
          {isOpen ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
        </button>
      </div>

      <div className={`space-y-4 ${isOpen ? 'block' : 'hidden'} lg:block lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 10000])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Discount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="0">All Ratings</option>
            <option value="4">4★ & Above</option>
            <option value="3">3★ & Above</option>
            <option value="2">2★ & Above</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onReset}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilters;
