const fs = require('fs');
const path = require('path');
try { require('dotenv').config(); } catch(e) {}

const DB_FILE = path.join(__dirname, '../../../database/pos_database.json');

// DỮ LIỆU MẶC ĐỊNH CHUẨN CAFE CHERRY NẾU CHƯA CÓ DATABASE
const DEFAULT_STATE = {
  tables: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Bàn ${i + 1}`,
    status: 'empty',
    start_time: null,
    current_items: [],
  })),
  categories: [
    { id: 'coffee', name: 'Cà phê', sort_order: 1 },
    { id: 'tea', name: 'Trà & Fruit Tea', sort_order: 2 },
    { id: 'smoothie', name: 'Sinh tố & Đá xay', sort_order: 3 },
    { id: 'snack', name: 'Bánh & Đồ ăn', sort_order: 4 },
  ],
  products: [
    { id: 1, name: 'Cà phê Đen đá', category_id: 'coffee', category_name: 'Cà phê', price: 22000, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', is_available: true },
    { id: 2, name: 'Cà phê Sữa đá', category_id: 'coffee', category_name: 'Cà phê', price: 26000, image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80', is_available: true },
    { id: 3, name: 'Bạc xỉu Sài Gòn', category_id: 'coffee', category_name: 'Cà phê', price: 29000, image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', is_available: true },
    { id: 4, name: 'Cà phê Muối Huế', category_id: 'coffee', category_name: 'Cà phê', price: 32000, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&q=80', is_available: true },
    { id: 5, name: 'Trà Đào Cam Sả', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', is_available: true },
    { id: 6, name: 'Trà Vải Hoa Lài', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', is_available: true },
    { id: 7, name: 'Trà Sữa Oolong Nướng', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 38000, image_url: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80', is_available: true },
    { id: 8, name: 'Trà Chanh Giã Tay', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 28000, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', is_available: true },
    { id: 9, name: 'Sinh tố Bơ Đắk Lắk', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 42000, image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', is_available: true },
    { id: 10, name: 'Matcha Đá xay kem Cheese', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 45000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80', is_available: true },
    { id: 11, name: 'Sữa chua Dẻo Cacao', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 32000, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', is_available: true },
    { id: 12, name: 'Croissant Bơ tỏi phô mai', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 32000, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', is_available: true },
    { id: 13, name: 'Bánh Mì Chảo Đặc biệt', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 45000, image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80', is_available: true },
    { id: 14, name: 'Hướng dương ngũ vị', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 15000, image_url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80', is_available: true },
  ],
  orders: [],
  settings: {
    id: 1,
    name: 'Cafe Cherry',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    phone: '0901 234 567',
    footer: 'Cảm ơn quý khách & Hẹn gặp lại!',
    bank_id: 'MB',
    account_no: '868688286',
    account_name: 'LA PHAT',
    qr_template: 'compact2',
    email_enabled: false,
    email_method: 'GMAIL_SMTP',
    receiver_email: '',
    sender_email: '',
    sender_password: '',
    resend_api_key: '',
  },
};

let localState = JSON.parse(JSON.stringify(DEFAULT_STATE));

// Tải dữ liệu từ pos_database.json nếu đã tồn tại
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.tables && parsed.tables.length > 0) localState.tables = parsed.tables;
    if (parsed.products && parsed.products.length > 0) localState.products = parsed.products;
    if (parsed.categories && parsed.categories.length > 0) localState.categories = parsed.categories;
    if (parsed.settings) localState.settings = parsed.settings;
    if (parsed.orders) localState.orders = parsed.orders;
  } else {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(localState, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('[Local DB Load Warning]:', e.message);
}

function saveLocalState() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(localState, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Local DB Save Error]:', e.message);
  }
}

// KHỞI TẠO KẾT NỐI POSTGRESQL (NẾU CÓ)
let pool = null;
let isPostgresConnected = false;

const connectionString = process.env.DATABASE_URL;

if (connectionString && !connectionString.includes('localhost:5432/cafepos')) {
  try {
    const { Pool } = require('pg');
    const requiresSsl = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('supabase.co');
    pool = new Pool({
      connectionString,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 4000,
    });
  } catch (e) {
    // pg not installed or invalid
  }
}

async function initDatabase() {
  if (pool) {
    try {
      const client = await pool.connect();
      console.log('[PostgreSQL] Đang kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL...');
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'dining_tables'
        );
      `);

      if (!checkTable.rows[0].exists) {
        console.log('[PostgreSQL] Đang tự động nạp schema.sql & seed.sql...');
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const seedPath = path.join(__dirname, '../../../database/seed.sql');

        if (fs.existsSync(schemaPath)) await client.query(fs.readFileSync(schemaPath, 'utf-8'));
        if (fs.existsSync(seedPath)) await client.query(fs.readFileSync(seedPath, 'utf-8'));
        console.log('[PostgreSQL] ✅ Đã nạp thành công 10 bàn và 14 món vào PostgreSQL!');
      }

      client.release();
      isPostgresConnected = true;
      console.log('[PostgreSQL] ✅ KẾT NỐI POSTGRESQL THÀNH CÔNG!');
      return;
    } catch (err) {
      console.warn('[PostgreSQL Warning]: Không thể kết nối PostgreSQL:', err.message);
      console.log('[Database Engine] 🛡️ TỰ ĐỘNG CHUYỂN SANG CHẾ ĐỘ FILE DATABASE (pos_database.json) - 10 BÀN & 14 MÓN SẴN SÀNG 100%!');
    }
  } else {
    console.log('[Database Engine] 🛡️ Đang chạy chế độ Embedded Database (pos_database.json) - Đầy đủ 10 bàn & 14 món, hoạt động độc lập!');
  }
}

module.exports = {
  get isPostgresConnected() { return isPostgresConnected; },
  get pool() { return pool; },
  localState,
  saveLocalState,
  initDatabase,
};
