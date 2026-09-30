import React from 'react';
import { Product, Category } from '../../types';
import { Hero } from '../Hero';
import { Marketplace } from '../Marketplace';

interface RedeemCodeViewProps {
  products: Product[];
  categories: Category[];
  onBuyNow: (product: Product) => void;
  isLoading?: boolean;
}

export const RedeemCodeView: React.FC<RedeemCodeViewProps> = ({
  products,
  categories,
  onBuyNow,
  isLoading = false
}) => {
  const scrollToMarketplace = () => {
    const el = document.getElementById('marketplace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fadeIn">
      <Hero onExploreCards={scrollToMarketplace} />
      <Marketplace
        products={products}
        categories={categories}
        onBuyNow={onBuyNow}
        isLoading={isLoading}
      />
    </div>
  );
};
