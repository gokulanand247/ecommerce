import React from 'react';
import { categories } from '../data/mockProducts';

interface CategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ selectedCategory, onCategoryChange }) => {
  const handleCategoryChange = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onCategoryChange(categoryId);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={(e) => handleCategoryChange(e, category.id)}
              className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-full font-semibold transition-all text-sm sm:text-base ${
                selectedCategory === category.id
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg sm:text-xl">{category.icon}</span>
              <span className="whitespace-nowrap">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;