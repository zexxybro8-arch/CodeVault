import React, { useState } from 'react';
import { Product } from '../types';
import { ArrowRight, Copy, Check, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { CategoryBrandLogo } from './CategoryIcons';

interface ProductCardProps {
  product: Product;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const [copied, setCopied] = useState(false);
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const codeBalance = product.balance;

  const handleCopyMaskedCode = () => {
    if (isOutOfStock) return;
    navigator.clipboard.writeText(product.maskedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group bg-white rounded-2xl border transition-all duration-300 p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-5 w-full max-w-full ${
      isOutOfStock ? 'border-slate-200/80 bg-slate-50/40 opacity-95' : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300'
    }`}>
      
      {/* TOP SECTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryBrandLogo category={product.category} className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          {/* Stock Status Badge */}
          {!isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              AVAILABLE (1)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-rose-700 bg-rose-50 border border-rose-300 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors pt-0.5">
          {product.name}
        </h3>
      </div>

      {/* CODE DISPLAY SECTION */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            DIGITAL CODE (MASKED)
          </span>
          <div className={`font-mono font-black text-base sm:text-xl tracking-wider sm:tracking-widest mt-0.5 ${
            isOutOfStock ? 'text-slate-400 italic' : 'text-slate-900'
          }`}>
            {product.maskedCode}
          </div>
        </div>

        {!isOutOfStock && (
          <button
            onClick={handleCopyMaskedCode}
            title="Copy masked preview"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* PRICE + BALANCE + REDEEM ACTION */}
      <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        
        {/* PRICE & BALANCE COLUMN PAIR */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-8">
          
          {/* PRICE */}
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              PRICE
            </span>
            <span className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          {/* BALANCE (GREEN GLOWING STYLE) */}
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
              BALANCE
            </span>
            <span className="text-lg sm:text-2xl font-black text-emerald-600 font-mono tracking-tight drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]">
              ₹{codeBalance.toLocaleString('en-IN')}
            </span>
          </div>

        </div>

        {/* RIGHT SIDE: REDEEM NOW or OUT OF STOCK BUTTON */}
        <button
          onClick={() => onBuyNow(product)}
          disabled={isOutOfStock}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 min-h-[44px] ${
            isOutOfStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs hover:shadow-md'
          }`}
        >
          <span>{isOutOfStock ? 'OUT OF STOCK' : 'REDEEM NOW'}</span>
          {!isOutOfStock && <ArrowRight className="w-4 h-4" />}
        </button>

      </div>

      {/* SMALL BOTTOM BADGES */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100/80">
        <span className="inline-flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Instant Delivery</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isOutOfStock ? 'Stock Depleted' : '100% Verified Code'}</span>
        </span>
      </div>

    </div>
  );
};
