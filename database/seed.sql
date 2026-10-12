-- ==========================================================
-- CAFE CHERRY POS - SEED DATA
-- ==========================================================

-- 1. DANH MỤC MÓN
INSERT INTO categories (id, name, sort_order) VALUES
('coffee', 'Cà phê', 1),
('tea', 'Trà & Fruit Tea', 2),
('smoothie', 'Sinh tố & Đá xay', 3),
('snack', 'Bánh & Đồ ăn', 4)
ON CONFLICT (id) DO NOTHING;

-- 2. THỰC ĐƠN 14 MÓN CHUẨN CAFE CHERRY
INSERT INTO products (name, category_id, price, image_url, is_available) VALUES
('Cà phê Đen đá', 'coffee', 22000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', true),
('Cà phê Sữa đá', 'coffee', 26000, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80', true),
('Bạc xỉu Sài Gòn', 'coffee', 29000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', true),
('Cà phê Muối Huế', 'coffee', 32000, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&q=80', true),
('Trà Đào Cam Sả', 'tea', 35000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', true),
('Trà Vải Hoa Lài', 'tea', 35000, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', true),
('Trà Sữa Oolong Nướng', 'tea', 38000, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80', true),
('Trà Chanh Giã Tay', 'tea', 28000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', true),
('Sinh tố Bơ Đắk Lắk', 'smoothie', 42000, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', true),
('Matcha Đá xay kem Cheese', 'smoothie', 45000, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80', true),
('Sữa chua Dẻo Cacao', 'smoothie', 32000, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', true),
('Croissant Bơ tỏi phô mai', 'snack', 32000, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', true),
('Bánh Mì Chảo Đặc biệt', 'snack', 45000, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80', true),
('Hướng dương ngũ vị', 'snack', 15000, 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80', true)
ON CONFLICT DO NOTHING;

-- 3. KHỞI TẠO 10 BÀN ĂN
INSERT INTO dining_tables (id, name, status, current_items) VALUES
(1, 'Bàn 1', 'empty', '[]'::jsonb),
(2, 'Bàn 2', 'empty', '[]'::jsonb),
(3, 'Bàn 3', 'empty', '[]'::jsonb),
(4, 'Bàn 4', 'empty', '[]'::jsonb),
(5, 'Bàn 5', 'empty', '[]'::jsonb),
(6, 'Bàn 6', 'empty', '[]'::jsonb),
(7, 'Bàn 7', 'empty', '[]'::jsonb),
(8, 'Bàn 8', 'empty', '[]'::jsonb),
(9, 'Bàn 9', 'empty', '[]'::jsonb),
(10, 'Bàn 10', 'empty', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. KHỞI TẠO CẤU HÌNH QUÁN & TÀI KHOẢN VIETQR
INSERT INTO shop_settings (id, name, address, phone, footer, bank_id, account_no, account_name, qr_template)
VALUES (
    1,
    'Cafe Cherry',
    '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    '0901 234 567',
    'Cảm ơn quý khách & Hẹn gặp lại!',
    'MB',
    '868688286',
    'LA PHAT',
    'compact2'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    bank_id = EXCLUDED.bank_id,
    account_no = EXCLUDED.account_no,
    account_name = EXCLUDED.account_name;
