'use client';

import React, { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { Header } from '@/components/Header';
import { TableGrid } from '@/components/TableGrid';
import { ProductCatalog } from '@/components/ProductCatalog';
import { OrderPanel } from '@/components/OrderPanel';
import { VietQRModal } from '@/components/VietQRModal';
import { TransferTableModal } from '@/components/TransferTableModal';
import { MenuStudio } from '@/components/MenuStudio';
import { RevenueReports } from '@/components/RevenueReports';
import { SettingsView } from '@/components/SettingsView';

export default function POSPage() {
  const {
    tables,
    selectedTableId,
    setSelectedTableId,
    currentTable,
    currentTotal,
    products,
    categories,
    settings,
    setSettings,
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
    refreshData,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'pos' | 'menu' | 'reports' | 'settings'>('pos');
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);

  const handlePayCash = async () => {
    if (confirm(`Xác nhận thanh toán TIỀN MẶT cho ${currentTable.name} (Tổng: ${currentTotal.toLocaleString('vi-VN')} đ)?`)) {
      await processCheckout('CASH');
    }
  };

  const handleConfirmVietQR = async () => {
    await processCheckout('TRANSFER');
    setIsQRModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-16 md:pb-6">
      {/* 1. THANH ĐIỀU HƯỚNG HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shopName={settings.name}
        isConnected={isConnected}
        statusText={statusText}
        onReconnect={reconnect}
      />

      {/* 2. NỘI DUNG CHÍNH THEO TAB */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
            {/* SƠ ĐỒ 10 BÀN ĂN */}
            <TableGrid
              tables={tables}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
            />

            {/* KHU VỰC THỰC ĐƠN & HÓA ĐƠN BÀN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* THỰC ĐƠN MÓN ĂN (7 CỘT) */}
              <div className="lg:col-span-7 xl:col-span-8">
                <ProductCatalog
                  products={products}
                  categories={categories}
                  onSelectProduct={addItemToCurrentTable}
                  selectedTableName={currentTable.name}
                />
              </div>

              {/* HÓA ĐƠN & GỌI MÓN (5 CỘT) */}
              <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
                <OrderPanel
                  currentTable={currentTable}
                  currentTotal={currentTotal}
                  onUpdateQty={updateItemQty}
                  onUpdateNote={updateItemNotes}
                  onClearTable={clearCurrentTable}
                  onOpenTransferModal={() => setIsTransferModalOpen(true)}
                  onPayCash={handlePayCash}
                  onPayVietQR={() => setIsQRModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <MenuStudio
            products={products}
            categories={categories}
            onSaveProduct={saveProduct}
            onDeleteProduct={removeProduct}
            onToggleStock={toggleProductStock}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'reports' && (
          <RevenueReports />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={setSettings}
            wsUrl={wsUrl}
            onSetWsUrl={(url) => updateServerEndpoint(url.replace('/ws', '/api'), url)}
            onReconnectWs={reconnect}
          />
        )}
      </main>

      {/* 3. CÁC MODAL TIỆN ÍCH */}
      <VietQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onConfirm={handleConfirmVietQR}
        tableName={currentTable.name}
        amount={currentTotal}
        settings={settings}
      />

      <TransferTableModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentTable={currentTable}
        tables={tables}
        onTransfer={transferTable}
      />
    </div>
  );
}
