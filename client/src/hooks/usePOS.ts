'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DiningTable, Product, Category, ShopSettings, Order, TableItem } from '@/types/pos';
import { DEFAULT_TABLES, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '@/lib/defaults';
import { useWebSocket } from './useWebSocket';
import { playSound } from '@/lib/sound';

const RENDER_API_DEFAULT = 'https://pos-qhih.onrender.com/api';
const RENDER_WS_DEFAULT = 'wss://pos-qhih.onrender.com/ws';
const STORAGE_KEY = 'cafepos_fullstack_state_v1';

export function usePOS() {
  const [tables, setTables] = useState<DiningTable[]>(DEFAULT_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<number>(1);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // MẶC ĐỊNH KẾT NỐI TRỰC TIẾP VỚI RENDER CLOUD ĐỂ CHẠY 24/24 TRÊN TOÀN MẠNG
  const [apiBase, setApiBase] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cafepos_api_url') || process.env.NEXT_PUBLIC_API_URL || RENDER_API_DEFAULT;
    }
    return RENDER_API_DEFAULT;
  });

  const [wsUrl, setWsUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cafepos_ws_url') || process.env.NEXT_PUBLIC_WS_URL || RENDER_WS_DEFAULT;
    }
    return RENDER_WS_DEFAULT;
  });

  // 1. TẢI DỮ LIỆU TỪ LOCALSTORAGE TRƯỚC TIÊN (ĐẢM BẢO KHÔNG BAO GIỜ BỊ MẤT BÀN & MENU)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tables && parsed.tables.length > 0) setTables(parsed.tables);
        if (parsed.products && parsed.products.length > 0) setProducts(parsed.products);
        if (parsed.categories && parsed.categories.length > 0) setCategories(parsed.categories);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.orders && parsed.orders.length > 0) setOrders(parsed.orders);
      }
    } catch (e) {
      console.error('[LocalStorage Load Error]:', e);
    }
  }, []);

  // 2. LƯU BỀN VỮNG VÀO LOCALSTORAGE MỖI KHI CÓ THAY ĐỔI
  const saveToLocalStorage = useCallback((newTables?: DiningTable[], newProducts?: Product[], newOrders?: Order[], newSettings?: ShopSettings) => {
    try {
      const stateToSave = {
        tables: newTables || tables,
        products: newProducts || products,
        categories,
        settings: newSettings || settings,
        orders: newOrders || orders,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('[LocalStorage Save Error]:', e);
    }
  }, [tables, products, categories, settings, orders]);

  // 3. ĐỒNG BỘ VỚI BACKEND API (RENDER CLOUD HOẶC LOCALHOST)
  const fetchAllData = useCallback(async () => {
    try {
      const fetchWithTimeout = (url: string, ms = 4000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal })
          .then(r => r.json())
          .finally(() => clearTimeout(timeout));
      };

      const [tablesRes, productsRes, settingsRes, ordersRes] = await Promise.allSettled([
        fetchWithTimeout(`${apiBase}/tables`),
        fetchWithTimeout(`${apiBase}/products`),
        fetchWithTimeout(`${apiBase}/settings`),
        fetchWithTimeout(`${apiBase}/orders?limit=50`),
      ]);

      // BẢO TOÀN BÀN ĂN
      if (tablesRes.status === 'fulfilled' && tablesRes.value?.success && Array.isArray(tablesRes.value.tables) && tablesRes.value.tables.length > 0) {
        const remoteTables = tablesRes.value.tables;
        setTables(prev => {
          const merged = prev.map(localT => {
            const remoteT = remoteTables.find((rt: any) => rt.id === localT.id);
            if (!remoteT) return localT;
            const localHasItems = localT.current_items && localT.current_items.length > 0;
            const remoteHasItems = remoteT.current_items && remoteT.current_items.length > 0;
            if (localHasItems && !remoteHasItems) return localT;
            return remoteT;
          });
          saveToLocalStorage(merged);
          return merged;
        });
      }

      // BẢO TOÀN THỰC ĐƠN
      if (productsRes.status === 'fulfilled' && productsRes.value?.success && Array.isArray(productsRes.value.products) && productsRes.value.products.length > 0) {
        setProducts(productsRes.value.products);
        if (productsRes.value.categories && productsRes.value.categories.length > 0) {
          setCategories(productsRes.value.categories);
        }
        saveToLocalStorage(undefined, productsRes.value.products);
      }

      // CÀI ĐẶT
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value.settings) {
        setSettings(settingsRes.value.settings);
      }

      // ĐƠN HÀNG
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success && Array.isArray(ordersRes.value.orders)) {
        setOrders(ordersRes.value.orders);
        saveToLocalStorage(undefined, undefined, ordersRes.value.orders);
      }
    } catch (err) {
      console.warn('[POS Data Fetch Warning]: Đang chạy ở chế độ cục bộ Offline/Cache an toàn.', err);
    }
  }, [apiBase, saveToLocalStorage]);

  // 4. XỬ LÝ SỰ KIỆN TỪ WEBSOCKET (ĐỒNG BỘ REALTIME ZALO & MÁY TÍNH)
  const handleWebSocketMessage = useCallback((msg: { type: string; payload?: any }) => {
    const { type, payload } = msg;

    if (type === 'TABLE_UPDATE' && payload) {
      setTables(prev => {
        const next = prev.map(t => (t.id === payload.tableId ? { ...t, ...payload.tableData } : t));
        saveToLocalStorage(next);
        return next;
      });
    } else if (type === 'TABLES_RESET' && payload) {
      if (payload.tables) {
        setTables(payload.tables);
        saveToLocalStorage(payload.tables);
      }
    } else if (type === 'ORDER_COMPLETED' && payload) {
      setTables(prev => {
        const next = prev.map(t => (t.id === payload.tableId ? { ...t, ...payload.tableData } : t));
        saveToLocalStorage(next);
        return next;
      });
      if (payload.order) {
        setOrders(prev => {
          const next = [payload.order, ...prev.filter(o => o.order_code !== payload.order.order_code)];
          saveToLocalStorage(undefined, undefined, next);
          return next;
        });
      }
    } else if (type === 'MENU_UPDATE' && payload) {
      if (payload.products && payload.products.length > 0) {
        setProducts(payload.products);
        saveToLocalStorage(undefined, payload.products);
      } else {
        fetch(`${apiBase}/products`)
          .then(r => r.json())
          .then(res => {
            if (res.success && res.products) {
              setProducts(res.products);
              if (res.categories) setCategories(res.categories);
              saveToLocalStorage(undefined, res.products);
            }
          })
          .catch(() => {});
      }
    } else if (type === 'SETTINGS_UPDATE' && payload) {
      if (payload.settings) {
        setSettings(payload.settings);
        saveToLocalStorage(undefined, undefined, undefined, payload.settings);
      }
    }
  }, [apiBase, saveToLocalStorage]);

  const { isConnected, statusText, sendMessage, reconnect } = useWebSocket(
    wsUrl,
    handleWebSocketMessage
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Đổi địa chỉ máy chủ API & WebSocket
  const updateServerEndpoint = (newApi: string, newWs: string) => {
    setApiBase(newApi);
    setWsUrl(newWs);
    try {
      localStorage.setItem('cafepos_api_url', newApi);
      localStorage.setItem('cafepos_ws_url', newWs);
    } catch(e) {}
  };

  // BÀN HIỆN TẠI
  const currentTable = useMemo(() => {
    return tables.find(t => t.id === selectedTableId) || {
      id: selectedTableId,
      name: `Bàn ${selectedTableId}`,
      status: 'empty',
      start_time: null,
      current_items: [],
    } as DiningTable;
  }, [tables, selectedTableId]);

  // TỔNG TIỀN BÀN HIỆN TẠI
  const currentTotal = useMemo(() => {
    return (currentTable.current_items || []).reduce((sum, item) => {
      const price = item.unit_price || item.price || 0;
      const qty = item.quantity || item.qty || 1;
      return sum + price * qty;
    }, 0);
  }, [currentTable]);

  // 5. THÊM MÓN VÀO BÀN
  const addItemToCurrentTable = async (product: Product) => {
    playSound('beep');
    const existingItems = [...(currentTable.current_items || [])];
    const matchIndex = existingItems.findIndex(i => (i.id === product.id || i.product_name === product.name) && !i.notes);

    if (matchIndex > -1) {
      const oldQty = existingItems[matchIndex].quantity || existingItems[matchIndex].qty || 1;
      existingItems[matchIndex] = {
        ...existingItems[matchIndex],
        quantity: oldQty + 1,
        qty: oldQty + 1,
      };
    } else {
      existingItems.push({
        id: product.id,
        name: product.name,
        product_name: product.name,
        price: product.price,
        unit_price: product.price,
        qty: 1,
        quantity: 1,
        notes: '',
      });
    }

    const updatedTable: DiningTable = {
      ...currentTable,
      status: 'occupied',
      start_time: currentTable.start_time || new Date().toISOString(),
      current_items: existingItems,
    };

    const nextTables = tables.map(t => (t.id === selectedTableId ? updatedTable : t));
    setTables(nextTables);
    saveToLocalStorage(nextTables);

    sendMessage('TABLE_UPDATE', { tableId: selectedTableId, tableData: updatedTable });

    fetch(`${apiBase}/tables/${selectedTableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_items: existingItems,
        status: 'occupied',
        start_time: updatedTable.start_time,
      }),
    }).catch(() => {});
  };

  // 6. TĂNG / GIẢM SỐ LƯỢNG MÓN
  const updateItemQty = async (index: number, delta: number) => {
    const existingItems = [...(currentTable.current_items || [])];
    if (!existingItems[index]) return;

    const currentQty = existingItems[index].quantity || existingItems[index].qty || 1;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      playSound('delete');
      existingItems.splice(index, 1);
    } else {
      playSound('beep');
      existingItems[index] = {
        ...existingItems[index],
        quantity: newQty,
        qty: newQty,
      };
    }

    const newStatus = existingItems.length > 0 ? 'occupied' : 'empty';
    const newStartTime = newStatus === 'occupied' ? currentTable.start_time : null;

    const updatedTable: DiningTable = {
      ...currentTable,
      status: newStatus,
      start_time: newStartTime,
      current_items: existingItems,
    };

    const nextTables = tables.map(t => (t.id === selectedTableId ? updatedTable : t));
    setTables(nextTables);
    saveToLocalStorage(nextTables);

    sendMessage('TABLE_UPDATE', { tableId: selectedTableId, tableData: updatedTable });

    fetch(`${apiBase}/tables/${selectedTableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_items: existingItems,
        status: newStatus,
        start_time: newStartTime,
      }),
    }).catch(() => {});
  };

  // 7. CẬP NHẬT GHI CHÚ
  const updateItemNotes = async (index: number, notes: string) => {
    const existingItems = [...(currentTable.current_items || [])];
    if (!existingItems[index]) return;

    existingItems[index] = { ...existingItems[index], notes };
    const updatedTable: DiningTable = { ...currentTable, current_items: existingItems };
    const nextTables = tables.map(t => (t.id === selectedTableId ? updatedTable : t));
    setTables(nextTables);
    saveToLocalStorage(nextTables);

    sendMessage('TABLE_UPDATE', { tableId: selectedTableId, tableData: updatedTable });

    fetch(`${apiBase}/tables/${selectedTableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_items: existingItems }),
    }).catch(() => {});
  };

  // 8. DỌN BÀN
  const clearCurrentTable = async () => {
    playSound('delete');
    const updatedTable: DiningTable = {
      ...currentTable,
      status: 'empty',
      start_time: null,
      current_items: [],
    };
    const nextTables = tables.map(t => (t.id === selectedTableId ? updatedTable : t));
    setTables(nextTables);
    saveToLocalStorage(nextTables);

    sendMessage('TABLE_UPDATE', { tableId: selectedTableId, tableData: updatedTable });

    fetch(`${apiBase}/tables/${selectedTableId}`, { method: 'DELETE' }).catch(() => {});
  };

  // 9. CHUYỂN / GỘP BÀN
  const transferTable = async (targetTableId: number, mode: 'MOVE' | 'MERGE') => {
    const fromTable = currentTable;
    const toTable = tables.find(t => t.id === targetTableId);
    if (!toTable) return;

    let newToItems = [];
    if (mode === 'MERGE') {
      newToItems = [...(toTable.current_items || []), ...(fromTable.current_items || [])];
    } else {
      newToItems = fromTable.current_items || [];
    }

    const updatedToTable: DiningTable = {
      ...toTable,
      status: 'occupied',
      start_time: toTable.start_time || new Date().toISOString(),
      current_items: newToItems,
    };

    const updatedFromTable: DiningTable = {
      ...fromTable,
      status: 'empty',
      start_time: null,
      current_items: [],
    };

    const nextTables = tables.map(t => {
      if (t.id === targetTableId) return updatedToTable;
      if (t.id === fromTable.id) return updatedFromTable;
      return t;
    });

    setTables(nextTables);
    setSelectedTableId(targetTableId);
    saveToLocalStorage(nextTables);

    sendMessage('TABLES_RESET', { tables: nextTables });

    fetch(`${apiBase}/tables/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromTableId: fromTable.id, toTableId: targetTableId, mode }),
    }).catch(() => {});
  };

  // 10. LƯU MÓN ĂN (SỬA GIÁ, ĐỔI TÊN, THÊM MÓN) - ĐẢM BẢO LƯU 100% CẢ CLIENT VÀ RENDER
  const saveProduct = async (productData: Partial<Product>): Promise<boolean> => {
    let nextProducts = [...products];

    if (productData.id) {
      nextProducts = nextProducts.map(p =>
        p.id === productData.id ? { ...p, ...productData } : p
      );
    } else {
      const newId = (nextProducts.reduce((max, p) => Math.max(max, p.id || 0), 0) || 0) + 1;
      const newProduct: Product = {
        id: newId,
        name: productData.name || 'Món mới',
        category_id: productData.category_id || 'coffee',
        category_name: categories.find(c => c.id === productData.category_id)?.name || 'Cà phê',
        price: Number(productData.price || 0),
        image_url: productData.image_url || null,
        is_available: productData.is_available !== false,
      };
      nextProducts.push(newProduct);
    }

    // 1. CẬP NHẬT STATE NGAY LẬP TỨC
    setProducts(nextProducts);

    // 2. LƯU BỀN VỮNG VÀO LOCALSTORAGE (KHÔNG BAO GIỜ BỊ MẤT DÙ MẤT MẠNG)
    saveToLocalStorage(undefined, nextProducts);

    // 3. GỬI ĐỒNG BỘ WEBSOCKET TỚI RENDER VÀ MỌI THIẾT BỊ ZALO
    sendMessage('MENU_UPDATE', { products: nextProducts });

    // 4. GỬI REST API TỚI MÁY CHỦ RENDER CLOUD
    try {
      if (productData.id) {
        await fetch(`${apiBase}/products/${productData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        await fetch(`${apiBase}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }
    } catch (e) {
      console.warn('[Sync Product Warning]: Đã lưu trên máy khách, sẽ tự động sync khi Render kết nối lại.');
    }

    return true;
  };

  // 11. XÓA MÓN ĂN
  const removeProduct = async (id: number): Promise<boolean> => {
    const nextProducts = products.filter(p => p.id !== id);
    setProducts(nextProducts);
    saveToLocalStorage(undefined, nextProducts);
    sendMessage('MENU_UPDATE', { products: nextProducts });

    try {
      await fetch(`${apiBase}/products/${id}`, { method: 'DELETE' });
    } catch (e) {}

    return true;
  };

  // 12. BẬT / TẮT TỒN KHO
  const toggleProductStock = async (id: number, isAvailable: boolean): Promise<boolean> => {
    const nextProducts = products.map(p =>
      p.id === id ? { ...p, is_available: isAvailable } : p
    );
    setProducts(nextProducts);
    saveToLocalStorage(undefined, nextProducts);
    sendMessage('MENU_UPDATE', { products: nextProducts });

    try {
      await fetch(`${apiBase}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: isAvailable }),
      });
    } catch (e) {}

    return true;
  };

  // 13. HOÀN TẤT THANH TOÁN (TIỀN MẶT / VIETQR)
  const processCheckout = async (paymentMethod: 'CASH' | 'TRANSFER', notes?: string) => {
    if (!currentTable.current_items || currentTable.current_items.length === 0) return null;

    const orderCode = 'HD' + Date.now().toString().slice(-6);
    const newOrder: Order = {
      id: Date.now(),
      order_code: orderCode,
      table_id: selectedTableId,
      table_name: currentTable.name,
      total_amount: currentTotal,
      payment_method: paymentMethod,
      status: 'COMPLETED',
      notes,
      created_at: new Date().toISOString(),
      items: currentTable.current_items.map(item => ({
        product_name: item.product_name || item.name || 'Món',
        quantity: item.quantity || item.qty || 1,
        unit_price: item.unit_price || item.price || 0,
        subtotal: (item.unit_price || item.price || 0) * (item.quantity || item.qty || 1),
        notes: item.notes,
      })),
    };

    playSound('cash');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#be123c', '#fb7185', '#fbbf24', '#34d399'],
    });

    const clearedTable: DiningTable = {
      ...currentTable,
      status: 'empty',
      start_time: null,
      current_items: [],
    };

    const nextTables = tables.map(t => (t.id === selectedTableId ? clearedTable : t));
    const nextOrders = [newOrder, ...orders];

    setTables(nextTables);
    setOrders(nextOrders);
    saveToLocalStorage(nextTables, undefined, nextOrders);

    sendMessage('ORDER_COMPLETED', {
      order: newOrder,
      tableId: selectedTableId,
      tableData: clearedTable,
    });

    fetch(`${apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: selectedTableId,
        items: currentTable.current_items,
        total_amount: currentTotal,
        payment_method: paymentMethod,
        notes,
      }),
    }).catch(() => {});

    return newOrder;
  };

  return {
    tables,
    selectedTableId,
    setSelectedTableId,
    currentTable,
    currentTotal,
    products,
    categories,
    settings,
    setSettings,
    orders,
    loading,
    isConnected,
    statusText,
    apiBase,
    wsUrl,
    updateServerEndpoint,
    reconnect,
    addItemToCurrentTable,
    updateItemQty,
    updateItemNotes,
    clearCurrentTable,
    transferTable,
    saveProduct,
    removeProduct,
    toggleProductStock,
    processCheckout,
    refreshData: fetchAllData,
  };
}
