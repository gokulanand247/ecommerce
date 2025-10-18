import { Product } from '../types';

export const getRelatedProducts = (
  currentProduct: Product,
  allProducts: Product[],
  limit: number = 4
): Product[] => {
  const relatedProducts = allProducts.filter(p => {
    if (p.id === currentProduct.id) return false;

    let score = 0;

    if (p.category === currentProduct.category) score += 3;

    if (p.colors.some(color => currentProduct.colors.includes(color))) score += 2;

    const priceDiff = Math.abs(p.price - currentProduct.price);
    const priceRange = currentProduct.price * 0.3;
    if (priceDiff <= priceRange) score += 1;

    return score > 0;
  });

  relatedProducts.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.category === currentProduct.category) scoreA += 3;
    if (b.category === currentProduct.category) scoreB += 3;

    if (a.colors.some(color => currentProduct.colors.includes(color))) scoreA += 2;
    if (b.colors.some(color => currentProduct.colors.includes(color))) scoreB += 2;

    const priceDiffA = Math.abs(a.price - currentProduct.price);
    const priceDiffB = Math.abs(b.price - currentProduct.price);

    if (priceDiffA < priceDiffB) scoreA += 1;
    if (priceDiffB < priceDiffA) scoreB += 1;

    return scoreB - scoreA;
  });

  return relatedProducts.slice(0, limit);
};
