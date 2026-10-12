'use client';

import React, { useState } from 'react';
import { Product, Category } from '@/types/pos';
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES } from '@/lib/defaults';
import { formatVND } from '@/lib/vietqr';
import { Plus, Edit2, Trash2, UtensilsCrossed, Check, X, Search } from 'lucide-react';

interface MenuStudioProps {
  products: Product[];
  categories: Category[];
  onSaveProduct: (productData: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: number) => Promise<boolean>;
  onToggleStock: (id: number, isAvailable: boolean) => Promise<boolean>;
  onRefresh: () => void;
}

export function MenuStudio({
  products,
  categories,
  onSaveProduct,
  onDeleteProduct,
  onToggleStock,
  onRefresh,
}: MenuStudioProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // BẢO VỆ TUYỆT ĐỐI: NẾU THỰC ĐƠN BỊ RỖNG THÌ LUÔN HIỂN THỊ 14 MÓN CAFE CHERRY
  const displayProducts = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
  const displayCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  // Form state
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('coffee');
  const [formPrice, setFormPrice] = useState<number>(25000);
  const [formImage, setFormImage] = useState<string>('');

  const filtered = displayProducts.filter(p => {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('coffee');
    setFormPrice(25000);
    setFormImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category_id);
    setFormPrice(p.price);
    setFormImage(p.image_url || '');
    setIsModalOpen(true);
  };

  const handleToggle = async (p: Product) => {
    await onToggleStock(p.id, !p.is_available);
    showToast(p.is_available ? `Đã đánh dấu "${p.name}" TẠM HẾT HÀNG` : `Đã mở bán lại món "${p.name}"`);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa món "${name}" khỏi thực đơn?`)) {
      await onDeleteProduct(id);
      showToast(`Đã xóa món "${name}" khỏi thực đơn`);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: Partial<Product> = {
      name: formName.trim(),
      category_id: formCategory,
      price: Number(formPrice),
      image_url: formImage.trim() || null,
    };

    if (editingProduct) {
      payload.id = editingProduct.id;
    }

    // LƯU NGAY LẬP TỨC VÀO STATE, LOCALSTORAGE & SYNC LÊN SERVER RENDER
    await onSaveProduct(payload);
    setIsModalOpen(false);
    showToast(`✅ Đã lưu món "${formName}" thành công! Giá mới: ${formatVND(Number(formPrice))}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* TOAST THÔNG BÁO THÀNH CÔNG */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Check className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER QUẢN LÝ THỰC ĐƠN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <UtensilsCrossed className="w-6 h-6 text-rose-700 dark:text-rose-400" />
            <span>Studio Quản Lý Thực Đơn & Giá Bán</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng cộng: <strong>{displayProducts.length} món</strong> &bull; Tự động lưu bền vững và đồng bộ Render Cloud 24/24
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md shadow-rose-900/20 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên món..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCat === 'all'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tất cả ({displayProducts.length})
          </button>
          {displayCategories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCat === c.id
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* BẢNG THỰC ĐƠN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Ảnh</th>
                <th className="py-3.5 px-4">Tên Món</th>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-4 text-right">Giá Bán</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 w-16">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          ☕
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                    {product.category_name || product.category_id}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-rose-700 dark:text-rose-400 text-base">
                    {formatVND(product.price)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggle(product)}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                        product.is_available
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      {product.is_available ? '● Đang mở bán' : '✕ Tạm hết'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Sửa món"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA MÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {editingProduct ? 'Sửa Món Ăn / Đồ Uống' : 'Thêm Món Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Tên món:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Cà phê Muối"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Danh mục:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {displayCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Giá bán (VNĐ):</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-extrabold text-rose-700 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Đường dẫn ảnh (URL):</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md shadow-rose-900/20 active:scale-98 transition-all"
                >
                  {editingProduct ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
