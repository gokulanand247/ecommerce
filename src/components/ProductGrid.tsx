import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (productId: string) => void;
  limitDisplay?: boolean;
  maxDisplayCount?: number;
}

const ProductGrid: React.FC<ProductGridProps> = React.memo(({
  products,
  onAddToCart,
  onProductClick,
  limitDisplay = false,
  maxDisplayCount = 5
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayProducts = (limitDisplay && !showAll)
    ? products.slice(0, maxDisplayCount)
    : products;
  if (products.length === 0) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Featured Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onProductClick={onProductClick}
            />
          ))}

          {limitDisplay && !showAll && products.length > maxDisplayCount && (
            <div
              onClick={() => setShowAll(true)}
              className="bg-gradient-to-br from-red-50 to-purple-50 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 hover:border-red-500 group min-h-[300px]"
            >
              <div className="bg-red-600 rounded-full p-3 mb-3 group-hover:scale-110 transition-transform">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">View More</h3>
              <p className="text-gray-600 text-center text-sm">{products.length - maxDisplayCount} more products</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;