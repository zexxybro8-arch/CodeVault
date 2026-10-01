import React from 'react';
import { Product, Category } from '../../types';
import { Marketplace } from '../Marketplace';

interface RedeemCodeViewProps {
  products: Product[];
  categories: Category[];
  onBuyNow: (product: Product) => void;
  isLoading?: boolean;
  onRedeemModalOpen?: () => void;
}

export const RedeemCodeView: React.FC<RedeemCodeViewProps> = ({
  products,
  categories,
  onBuyNow,
  isLoading = false,
  onRedeemModalOpen
}) => {
  return (
    <div className="animate-fadeIn">
      <Marketplace
        products={products}
        categories={categories}
        onBuyNow={onBuyNow}
        isLoading={isLoading}
      />
    </div>
  );
};
