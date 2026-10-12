const db = require('../config/db');
const { broadcast } = require('../services/socketService');

// Lấy danh sách thực đơn & danh mục
async function getProducts(req, res) {
  try {
    if (db.isPostgresConnected && db.pool) {
      const productsRes = await db.pool.query(`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id ASC
      `);
      const categoriesRes = await db.pool.query('SELECT * FROM categories ORDER BY sort_order ASC');

      if (productsRes.rows && productsRes.rows.length > 0) {
        return res.json({
          success: true,
          products: productsRes.rows,
          categories: categoriesRes.rows,
        });
      }
    }
  } catch (err) {
    console.warn('[Products PG Error]:', err.message);
  }

  // Luôn fallback về localState - Đảm bảo 100% trả về 14 món Cafe Cherry
  res.json({
    success: true,
    products: db.localState.products,
    categories: db.localState.categories,
  });
}

// Thêm món mới
async function createProduct(req, res) {
  const { name, category_id, price, image_url, is_available } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ success: false, message: 'Tên món và giá là bắt buộc' });
  }

  const newId = (db.localState.products.reduce((max, p) => Math.max(max, p.id || 0), 0) || 0) + 1;
  const newProduct = {
    id: newId,
    name: name.trim(),
    category_id: category_id || 'coffee',
    category_name: db.localState.categories.find(c => c.id === category_id)?.name || 'Cà phê',
    price: Number(price),
    image_url: image_url || null,
    is_available: is_available !== false,
  };

  db.localState.products.push(newProduct);
  db.saveLocalState();

  if (db.isPostgresConnected && db.pool) {
    db.pool.query(
      `INSERT INTO products (name, category_id, price, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5)`,
      [newProduct.name, newProduct.category_id, newProduct.price, newProduct.image_url, newProduct.is_available]
    ).catch(e => console.warn('[PG createProduct err]:', e.message));
  }

  broadcast('MENU_UPDATE', { action: 'CREATE', product: newProduct });
  res.status(201).json({ success: true, product: newProduct });
}

// Sửa món (giá, tên, còn/hết hàng)
async function updateProduct(req, res) {
  const id = parseInt(req.params.id, 10);
  const { name, category_id, price, image_url, is_available } = req.body;

  const pIndex = db.localState.products.findIndex(p => p.id === id);
  if (pIndex === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy món' });
  }

  const p = db.localState.products[pIndex];
  if (name !== undefined) p.name = name;
  if (category_id !== undefined) {
    p.category_id = category_id;
    p.category_name = db.localState.categories.find(c => c.id === category_id)?.name || p.category_name;
  }
  if (price !== undefined) p.price = Number(price);
  if (image_url !== undefined) p.image_url = image_url;
  if (is_available !== undefined) p.is_available = is_available;

  db.saveLocalState();

  if (db.isPostgresConnected && db.pool) {
    db.pool.query(
      `UPDATE products SET name = $1, category_id = $2, price = $3, image_url = $4, is_available = $5 WHERE id = $6`,
      [p.name, p.category_id, p.price, p.image_url, p.is_available, id]
    ).catch(e => console.warn('[PG updateProduct err]:', e.message));
  }

  broadcast('MENU_UPDATE', { action: 'UPDATE', product: p });
  res.json({ success: true, product: p });
}

// Xóa món
async function deleteProduct(req, res) {
  const id = parseInt(req.params.id, 10);
  db.localState.products = db.localState.products.filter(p => p.id !== id);
  db.saveLocalState();

  if (db.isPostgresConnected && db.pool) {
    db.pool.query('DELETE FROM products WHERE id = $1', [id]).catch(e => console.warn('[PG deleteProduct err]:', e.message));
  }

  broadcast('MENU_UPDATE', { action: 'DELETE', productId: id });
  res.json({ success: true, message: 'Đã xóa món thành công' });
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
