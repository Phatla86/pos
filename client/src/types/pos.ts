export interface TableItem {
  id?: number;
  name?: string;
  product_name?: string;
  price?: number;
  unit_price?: number;
  qty?: number;
  quantity?: number;
  notes?: string;
}

export interface DiningTable {
  id: number;
  name: string;
  status: 'empty' | 'occupied';
  start_time: string | null;
  current_items: TableItem[];
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  category_id: string;
  category_name?: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: number;
  order_code: string;
  table_id: number;
  table_name: string;
  total_amount: number;
  payment_method: 'CASH' | 'TRANSFER';
  status: string;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface ShopSettings {
  id?: number;
  name: string;
  address: string;
  phone: string;
  footer: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  qr_template: string;
  email_enabled: boolean;
  email_method: 'GMAIL_SMTP' | 'RESEND_API';
  receiver_email?: string;
  sender_email?: string;
  sender_password?: string;
  resend_api_key?: string;
  updated_at?: string;
}

export interface RevenueSummary {
  today_revenue: number;
  today_orders: number;
  month_revenue: number;
  month_orders: number;
  year_revenue: number;
  year_orders: number;
  all_time_revenue: number;
  all_time_orders: number;
}

export interface RevenuePeriodRecord {
  period_label: string;
  order_count: number;
  total_revenue: number;
  cash_revenue: number;
  transfer_revenue: number;
}

export interface TopProductRecord {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export interface RevenueReportData {
  summary: RevenueSummary;
  daily: RevenuePeriodRecord[];
  monthly: RevenuePeriodRecord[];
  yearly: RevenuePeriodRecord[];
  topProducts: TopProductRecord[];
}
