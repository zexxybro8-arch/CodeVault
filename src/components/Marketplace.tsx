import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, Denomination } from '../types';
import { ProductCard } from './ProductCard';
import { api, parseNumeric } from '../services/api';
import { Search, SlidersHorizontal, Sparkles, X, Filter } from 'lucide-react';

interface MarketplaceProps {
  products: Product[];
  categories: Category[];
  onBuyNow: (product: Product) => void;
  isLoading?: boolean;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  categories,
  onBuyNow,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'newest'>('default');
  const [denominations, setDenominations] = useState<Denomination[]>([]);

  useEffect(() => {
    api.getDenominations().then(res => {
      if (res && res.length) {
        setDenominations(res.filter(d => d.enabled !== false));
      }
    });
  }, []);

  // Category List from DB and Products
  const categoryList = useMemo(() => {
    const dbCats = categories.filter(c => c.enabled !== false).map(c => c.name.trim().toUpperCase());
    const prodCats = products.map(p => (p.category || '').trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set(['ALL', ...dbCats, ...prodCats]));
  }, [categories, products]);

  // Denomination Options (Standard Google Play amounts + DB denominations + products)
  const denominationOptions = useMemo(() => {
    const defaultVals = [120, 150, 200, 300, 350, 500, 700, 900, 1000, 3000, 5000, 6000];
    const dbVals = denominations.map(d => parseNumeric(d.value));
    const prodDenoms = products.map(p => parseNumeric(p.denomination));
    const prodPrices = products.map(p => parseNumeric(p.price));
    const prodBalances = products.map(p => parseNumeric(p.balance));

    const combinedVals = Array.from(
      new Set([...defaultVals, ...dbVals, ...prodDenoms, ...prodPrices, ...prodBalances])
    )
      .filter((v): v is number => v > 0)
      .sort((a, b) => a - b);

    return [
      { label: 'ALL VALUES', value: null },
      ...combinedVals.map(v => ({ label: `₹${v.toLocaleString('en-IN')}`, value: v }))
    ];
  }, [denominations, products]);

  // Handle Category Change
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'GOOGLE PLAY' && cat !== 'ALL') {
      setSelectedDenomination(null);
    }
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Category filter
      if (selectedCategory !== 'ALL') {
        const cleanSelectedCat = selectedCategory.trim().toUpperCase();
        const cleanProductCat = (p.category || '').trim().toUpperCase();
        if (cleanSelectedCat !== cleanProductCat) {
          return false;
        }
      }

      // 2. Denomination / Value filter
      if (selectedDenomination !== null) {
        const targetVal = parseNumeric(selectedDenomination);
        const pDenom = parseNumeric(p.denomination);
        const pPrice = parseNumeric(p.price);
        const pBalance = parseNumeric(p.balance);

        const matchesDenom = pDenom === targetVal;
        const matchesPrice = pPrice === targetVal;
        const matchesBalance = pBalance === targetVal;

        if (!matchesDenom && !matchesPrice && !matchesBalance) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const rawQ = searchQuery.toLowerCase().trim();
        const cleanNumQ = rawQ.replace(/[^0-9.]/g, '');

        const matchName = (p.name || '').toLowerCase().includes(rawQ);
        const matchCat = (p.category || '').toLowerCase().includes(rawQ);
        const matchDesc = (p.description || '').toLowerCase().includes(rawQ);
        const matchMasked = (p.maskedCode || '').toLowerCase().includes(rawQ);
        const matchFull = ((p as any).fullCode || '').toLowerCase().includes(rawQ);

        const pDenomStr = (p.denomination ?? '').toString();
        const pPriceStr = (p.price ?? '').toString();
        const pBalanceStr = (p.balance ?? '').toString();

        const matchPrice = cleanNumQ ? pPriceStr.includes(cleanNumQ) : pPriceStr.includes(rawQ);
        const matchDenom = cleanNumQ ? pDenomStr.includes(cleanNumQ) : pDenomStr.includes(rawQ);
        const matchBalance = cleanNumQ ? pBalanceStr.includes(cleanNumQ) : pBalanceStr.includes(rawQ);

        if (!matchName && !matchCat && !matchDesc && !matchPrice && !matchDenom && !matchBalance && !matchMasked && !matchFull) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return (a.price || a.denomination || 0) - (b.price || b.denomination || 0);
    });
  }, [products, searchQuery, selectedCategory, selectedDenomination, sortBy]);

  return (
    <section id="marketplace" className="py-6 sm:py-8 bg-white min-h-[500px] w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Search, Filter & Sort Controls Area */}
        <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 mb-6 sm:mb-8 space-y-3.5">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search Google Play codes or value (e.g. 500)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all min-h-[42px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-w-[36px] min-h-[36px] justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="md:col-span-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs min-h-[42px]"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

          </div>

          {/* Primary Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-b border-slate-200/60 pb-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            {categoryList.map(cat => {
              const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* SECOND-LEVEL DENOMINATION / VALUE FILTER */}
          <div className="pt-1 animate-fadeIn space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Select Recharge Amount / Denomination:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {denominationOptions.map(denom => {
                const isSelected = selectedDenomination === denom.value;
                return (
                  <button
                    key={denom.label}
                    onClick={() => setSelectedDenomination(denom.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-extrabold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {denom.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-slate-100 rounded-2xl h-56 border border-slate-200" />
            ))}
          </div>
        )}

        {/* Product Cards Grid: 2 columns on desktop, 1 on mobile */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              No products found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
              Try resetting your search query or switching category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDenomination(null);
                setSortBy('default');
              }}
              className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors min-h-[40px]"
            >
              Reset Filters / View All Values
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
