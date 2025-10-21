import React, { useState } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>(priceRange);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [tempMinRating, setTempMinRating] = useState(minRating);

  const handleApplyFilters = () => {
    onCategoryChange(tempCategory);
    onPriceRangeChange(tempPriceRange);
    onSortChange(tempSortBy);
    onRatingChange(tempMinRating);
    setIsModalOpen(false);
  };

  const handleResetFilters = () => {
    setTempCategory('all');
    setTempPriceRange([0, 10000]);
    setTempSortBy('newest');
    setTempMinRating(0);
    onReset();
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setTempCategory(selectedCategory);
    setTempPriceRange(priceRange);
    setTempSortBy(sortBy);
    setTempMinRating(minRating);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <button
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-md hover:bg-red-700 transition-colors"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="font-medium">Filters & Sort</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-red-600" />
                Filters & Sort
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempPriceRange[0]}
                      onChange={(e) => setTempPriceRange([parseInt(e.target.value) || 0, tempPriceRange[1]])}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <span className="text-gray-500 font-medium">to</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempPriceRange[1]}
                      onChange={(e) => setTempPriceRange([tempPriceRange[0], parseInt(e.target.value) || 10000])}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={tempSortBy}
                  onChange={(e) => setTempSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  value={tempMinRating}
                  onChange={(e) => setTempMinRating(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="0">All Ratings</option>
                  <option value="4">4 stars & Above</option>
                  <option value="3">3 stars & Above</option>
                  <option value="2">2 stars & Above</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium transition-colors"
              >
                <X className="h-4 w-4 inline mr-2" />
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilters;
