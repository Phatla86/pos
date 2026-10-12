'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/types/pos';
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES } from '@/lib/defaults';
import { formatVND } from '@/lib/vietqr';
import { Search, Plus } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  selectedTableName: string;
}

export function ProductCatalog({
  products,
  categories,
  onSelectProduct,
  selectedTableName,
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // BẢO VỆ TUYỆT ĐỐI: NẾU THỰC ĐƠN BỊ RỖNG THÌ LUÔN FALLBACK VỀ 14 MÓN CAFE CHERRY MẶC ĐỊNH
  const displayProducts = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const displayCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  const filteredProducts = useMemo(() => {
    return displayProducts.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchQuery = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [displayProducts, selectedCategory, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      {/* HEADER: TÌM KIẾM & DANH MỤC */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        {/* TÌM KIẾM */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên đồ uống, món ăn..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Gọi món cho: <strong className="text-rose-600 dark:text-rose-400">{selectedTableName}</strong>
        </div>
      </div>

      {/* TABS DANH MỤC */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Tất cả món ({displayProducts.length})
        </button>

        {displayCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* DANH SÁCH MÓN ĂN (CARDS GRID) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[520px] pr-1">
        {filteredProducts.map(product => {
          const isOutOfStock = !product.is_available;

          return (
            <div
              key={product.id}
              onClick={() => {
                if (!isOutOfStock) onSelectProduct(product);
              }}
              className={`group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-2.5 flex flex-col justify-between transition-all duration-200 ${
                isOutOfStock
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900'
                  : 'hover:border-rose-400 hover:shadow-md cursor-pointer active:scale-95'
              }`}
            >
              {/* ẢNH MÓN */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    ☕ Cafe Cherry
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[11px] font-bold">
                    TẠM HẾT
                  </div>
                )}
              </div>

              {/* TÊN & GIÁ MÓN */}
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                  {product.name}
                </h4>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                  {product.category_name || 'Đồ uống'}
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="font-extrabold text-xs sm:text-sm text-rose-700 dark:text-rose-400">
                  {formatVND(product.price)}
                </span>
                {!isOutOfStock && (
                  <span className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-700 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
