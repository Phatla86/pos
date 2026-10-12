-- ==========================================================
-- CAFE CHERRY POS - POSTGRESQL DATABASE SCHEMA
-- ==========================================================

-- 1. BẢNG DANH MỤC MÓN (CATEGORIES)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0
);

-- 2. BẢNG MÓN ĂN / ĐỒ UỐNG (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    price NUMERIC(12, 0) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG BÀN ĂN (TABLES - 10 BÀN)
CREATE TABLE IF NOT EXISTS dining_tables (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'empty' CHECK (status IN ('empty', 'occupied')),
    start_time TIMESTAMPTZ,
    current_items JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG ĐƠN HÀNG ĐÃ THANH TOÁN (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    table_id INT REFERENCES dining_tables(id) ON DELETE SET NULL,
    table_name VARCHAR(50),
    total_amount NUMERIC(12, 0) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER')),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 0) NOT NULL,
    subtotal NUMERIC(12, 0) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG CÀI ĐẶT QUÁN, VIETQR & EMAIL (SETTINGS - SINGLETON ROW)
CREATE TABLE IF NOT EXISTS shop_settings (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(150) DEFAULT 'Cafe Cherry',
    address TEXT DEFAULT '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    phone VARCHAR(50) DEFAULT '0901 234 567',
    footer TEXT DEFAULT 'Cảm ơn quý khách & Hẹn gặp lại!',
    bank_id VARCHAR(20) DEFAULT 'MB',
    account_no VARCHAR(50) DEFAULT '868688286',
    account_name VARCHAR(100) DEFAULT 'LA PHAT',
    qr_template VARCHAR(50) DEFAULT 'compact2',
    email_enabled BOOLEAN DEFAULT FALSE,
    email_method VARCHAR(20) DEFAULT 'GMAIL_SMTP',
    receiver_email VARCHAR(150),
    sender_email VARCHAR(150),
    sender_password VARCHAR(150),
    resend_api_key VARCHAR(150),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_single_row CHECK (id = 1)
);

-- CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
