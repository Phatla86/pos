const express = require('express');
const router = express.Router();

const tableCtrl = require('../controllers/tableController');
const productCtrl = require('../controllers/productController');
const orderCtrl = require('../controllers/orderController');
const reportCtrl = require('../controllers/reportController');
const settingCtrl = require('../controllers/settingController');

// 1. Dining Tables
router.get('/tables', tableCtrl.getTables);
router.put('/tables/:id', tableCtrl.updateTable);
router.post('/tables/transfer', tableCtrl.transferTable);
router.delete('/tables/:id', tableCtrl.clearTable);

// 2. Products & Menu
router.get('/products', productCtrl.getProducts);
router.post('/products', productCtrl.createProduct);
router.put('/products/:id', productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);

// 3. Orders
router.get('/orders', orderCtrl.getOrders);
router.post('/orders', orderCtrl.createOrder);

// 4. Reports
router.get('/reports/revenue', reportCtrl.getRevenueReport);

// 5. Settings & Test Email
router.get('/settings', settingCtrl.getSettings);
router.put('/settings', settingCtrl.updateSettings);
router.post('/settings/test-email', settingCtrl.testEmail);

module.exports = router;
