import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Category, Denomination, RedeemCodeItem, Order, DashboardStats, PromoCode, OrderStatus, MarketplaceSettings } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface DatabaseSchema {
  categories: Category[];
  denominations: Denomination[];
  redeemCodes: RedeemCodeItem[];
  products: Product[];
  orders: Order[];
  promoCodes: PromoCode[];
  settings: MarketplaceSettings;
  adminPin: string;
}

// Helper to mask code into "•••• •••• XXXX YYYY"
function formatMaskedCode(fullCode: string): string {
  const clean = fullCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length < 8) {
    return '•••• •••• 8K4P 29X7';
  }
  const last8 = clean.slice(-8);
  const part1 = last8.slice(0, 4);
  const part2 = last8.slice(4, 8);
  return `•••• •••• ${part1} ${part2}`;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'GOOGLE PLAY', enabled: true, displayOrder: 1, iconUrl: 'https://i.ibb.co/ns82P174/google-play-store-logo-png-transparent-png-logos-10.png' }
];

const INITIAL_DENOMINATIONS: Denomination[] = [
  { id: 'den-120', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 120, label: '₹120', enabled: true, displayOrder: 1 },
  { id: 'den-150', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 150, label: '₹150', enabled: true, displayOrder: 2 },
  { id: 'den-200', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 200, label: '₹200', enabled: true, displayOrder: 3 },
  { id: 'den-300', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 300, label: '₹300', enabled: true, displayOrder: 4 },
  { id: 'den-350', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 350, label: '₹350', enabled: true, displayOrder: 5 },
  { id: 'den-500', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 500, label: '₹500', enabled: true, displayOrder: 6 },
  { id: 'den-700', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 700, label: '₹700', enabled: true, displayOrder: 7 },
  { id: 'den-900', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 900, label: '₹900', enabled: true, displayOrder: 8 }
];

const INITIAL_REDEEM_CODES: RedeemCodeItem[] = [
  { id: 'code-120', code: 'GPRC-1200-8K4P-1200', category: 'GOOGLE PLAY', denomination: 120, price: 120, balance: 120, status: 'Available', createdAt: new Date('2026-01-01').toISOString() },
  { id: 'code-150', code: 'GPRC-1500-7Q2M-1500', category: 'GOOGLE PLAY', denomination: 150, price: 150, balance: 150, status: 'Available', createdAt: new Date('2026-01-02').toISOString() },
  { id: 'code-200', code: 'GPRC-2000-5X8P-2000', category: 'GOOGLE PLAY', denomination: 200, price: 200, balance: 200, status: 'Available', createdAt: new Date('2026-01-03').toISOString() },
  { id: 'code-300', code: 'GPRC-3000-9M12-3000', category: 'GOOGLE PLAY', denomination: 300, price: 300, balance: 300, status: 'Available', createdAt: new Date('2026-01-04').toISOString() },
  { id: 'code-350', code: 'GPRC-3500-3B90-3500', category: 'GOOGLE PLAY', denomination: 350, price: 350, balance: 350, status: 'Available', createdAt: new Date('2026-01-05').toISOString() },
  { id: 'code-500', code: 'GPRC-5000-4F22-5000', category: 'GOOGLE PLAY', denomination: 500, price: 450, balance: 500, status: 'Available', createdAt: new Date('2026-01-06').toISOString() },
  { id: 'code-700', code: 'GPRC-7000-2K11-7000', category: 'GOOGLE PLAY', denomination: 700, price: 700, balance: 700, status: 'Available', createdAt: new Date('2026-01-07').toISOString() },
  { id: 'code-900', code: 'GPRC-9000-1A33-9000', category: 'GOOGLE PLAY', denomination: 900, price: 900, balance: 900, status: 'Available', createdAt: new Date('2026-01-08').toISOString() },
  { id: 'code-1000', code: 'GPRC-1092-2K11-55ZZ', category: 'GOOGLE PLAY', denomination: 1000, price: 1000, balance: 1000, status: 'Available', createdAt: new Date('2026-02-15').toISOString() },
  { id: 'code-3000', code: 'GPRC-8192-5X8P-72KD', category: 'GOOGLE PLAY', denomination: 3000, price: 3000, balance: 3000, status: 'Available', createdAt: new Date('2026-01-15').toISOString() },
  { id: 'code-5000', code: 'GPRC-4410-7Q2M-41AB', category: 'GOOGLE PLAY', denomination: 5000, price: 5000, balance: 5000, status: 'Available', createdAt: new Date('2026-01-12').toISOString() },
  { id: 'code-6000', code: 'GPRC-9012-8K4P-29X7', category: 'GOOGLE PLAY', denomination: 6000, price: 6000, balance: 6000, status: 'Available', createdAt: new Date('2026-01-10').toISOString() }
];

const INITIAL_SETTINGS: MarketplaceSettings = {
  title: 'BLACK X Prepaid Platform',
  description: 'Instant Google Play Recharge Vouchers & Digital Redeem Codes',
  currency: 'INR (₹)',
  maintenanceMode: false,
  defaultAvailability: true,
  adminPin: 'SAGAR551'
};

function buildProductsFromCodes(redeemCodes: RedeemCodeItem[]): Product[] {
  const activeCodes = redeemCodes.filter(c => c.status === 'Available');
  return activeCodes.map((codeItem) => ({
    id: `prod-${codeItem.id}`,
    name: 'Google Play Recharge Code',
    category: codeItem.category,
    denomination: codeItem.denomination,
    price: codeItem.price,
    balance: codeItem.balance,
    maskedCode: formatMaskedCode(codeItem.code),
    fullCode: codeItem.code,
    deliveryStatus: 'Instant',
    stock: 1,
    enabled: true,
    createdAt: codeItem.createdAt
  }));
}

function getDB(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      categories: INITIAL_CATEGORIES,
      denominations: INITIAL_DENOMINATIONS,
      redeemCodes: INITIAL_REDEEM_CODES,
      products: buildProductsFromCodes(INITIAL_REDEEM_CODES),
      orders: [
        {
          id: 'BX-58192',
          customerName: 'Alex Mercer',
          customerEmail: 'alex.mercer@example.com',
          customerPhone: '+91 98765 43210',
          items: [
            {
              productId: 'prod-code-6000',
              productName: 'Google Play Recharge Code',
              category: 'GOOGLE PLAY',
              denomination: 6000,
              price: 6000,
              maskedCode: '•••• •••• 8K4P 29X7'
            }
          ],
          totalAmount: 6000,
          status: 'Completed',
          paymentMethod: 'UPI QR Code',
          createdAt: new Date('2026-03-01T10:15:00Z').toISOString(),
          updatedAt: new Date('2026-03-01T10:15:00Z').toISOString(),
          fullRedeemCode: 'GPRC-9012-8K4P-29X7'
        }
      ],
      promoCodes: [
        { code: 'BLACKX2026', discountType: 'percentage', discountValue: 15, active: true },
        { code: 'WELCOME100', discountType: 'fixed', discountValue: 100, active: true }
      ],
      settings: INITIAL_SETTINGS,
      adminPin: 'SAGAR551'
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;

    const categories = parsed.categories && parsed.categories.length ? parsed.categories : INITIAL_CATEGORIES;
    const denominations = parsed.denominations && parsed.denominations.length ? parsed.denominations : INITIAL_DENOMINATIONS;
    const redeemCodes = parsed.redeemCodes && parsed.redeemCodes.length ? parsed.redeemCodes : INITIAL_REDEEM_CODES;
    const settings = parsed.settings || INITIAL_SETTINGS;

    const products = buildProductsFromCodes(redeemCodes);

    return {
      categories,
      denominations,
      redeemCodes,
      products,
      orders: parsed.orders || [],
      promoCodes: parsed.promoCodes || [],
      settings,
      adminPin: 'SAGAR551'
    };
  } catch (err) {
    console.error('Error reading DB, returning initial data', err);
    return {
      categories: INITIAL_CATEGORIES,
      denominations: INITIAL_DENOMINATIONS,
      redeemCodes: INITIAL_REDEEM_CODES,
      products: buildProductsFromCodes(INITIAL_REDEEM_CODES),
      orders: [],
      promoCodes: [],
      settings: INITIAL_SETTINGS,
      adminPin: 'SAGAR551'
    };
  }
}

function saveDB(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  data.products = buildProductsFromCodes(data.redeemCodes);
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Admin Login Endpoint (Authenticates SAGAR551 / SAGAR551)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, userId, password, pin } = req.body;
    const db = getDB();

    const inputUser = (username || userId || '').trim().toUpperCase();
    const inputPass = (password || pin || '').trim();

    // Valid check: SAGAR551 / SAGAR551 or PIN SAGAR551 / admin123
    const isUserValid = inputUser === 'SAGAR551' || !inputUser;
    const isPassValid = inputPass === 'SAGAR551' || inputPass === db.adminPin || inputPass === 'admin123';

    if (isUserValid && isPassValid && inputPass) {
      res.json({ success: true, token: 'blackx_admin_token_sec_2026' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid User ID or Password' });
    }
  });

  // 2. GET Categories
  app.get('/api/categories', (req: Request, res: Response) => {
    const db = getDB();
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (isAdmin) {
      res.json(db.categories);
    } else {
      res.json(db.categories.filter(c => c.enabled !== false));
    }
  });

  // POST / PUT / DELETE Category (Admin)
  app.post('/api/categories', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { name, iconUrl, enabled, displayOrder } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }
    const db = getDB();
    const upper = String(name).toUpperCase().trim();
    if (db.categories.some(c => c.name.toUpperCase() === upper)) {
      res.status(400).json({ message: 'Category already exists' });
      return;
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: upper,
      iconUrl: iconUrl || '',
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      displayOrder: displayOrder ? Number(displayOrder) : db.categories.length + 1
    };
    db.categories.push(newCat);
    saveDB(db);
    res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    db.categories[idx] = { ...db.categories[idx], ...req.body };
    saveDB(db);
    res.json(db.categories[idx]);
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    db.categories = db.categories.filter(c => c.id !== id);
    saveDB(db);
    res.json({ success: true, id });
  });

  // 3. GET / POST / PUT / DELETE Denominations (Sub Categories)
  app.get('/api/denominations', (req: Request, res: Response) => {
    const db = getDB();
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (isAdmin) {
      res.json(db.denominations);
    } else {
      res.json(db.denominations.filter(d => d.enabled !== false));
    }
  });

  app.post('/api/denominations', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { categoryId, categoryName, value, label, enabled, displayOrder } = req.body;
    if (!value) {
      res.status(400).json({ message: 'Denomination value is required' });
      return;
    }
    const db = getDB();
    const numVal = Number(value);
    const newDen: Denomination = {
      id: `den-${Date.now()}`,
      categoryId: categoryId || 'cat-1',
      categoryName: categoryName || 'GOOGLE PLAY',
      value: numVal,
      label: label || `₹${numVal}`,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      displayOrder: displayOrder ? Number(displayOrder) : db.denominations.length + 1
    };
    db.denominations.push(newDen);
    saveDB(db);
    res.status(201).json(newDen);
  });

  app.put('/api/denominations/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    const idx = db.denominations.findIndex(d => d.id === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Denomination not found' });
      return;
    }
    db.denominations[idx] = { ...db.denominations[idx], ...req.body };
    saveDB(db);
    res.json(db.denominations[idx]);
  });

  app.delete('/api/denominations/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    db.denominations = db.denominations.filter(d => d.id !== id);
    saveDB(db);
    res.json({ success: true, id });
  });

  // 4. GET / POST / PUT / DELETE Redeem Codes
  app.get('/api/redeem-codes', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const db = getDB();
    res.json(db.redeemCodes);
  });

  app.post('/api/redeem-codes', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { code, category, denomination, price, balance, status, note } = req.body;
    if (!code || !denomination) {
      res.status(400).json({ message: 'Redeem code and denomination are required' });
      return;
    }
    const db = getDB();
    const cleanCode = String(code).trim().toUpperCase();
    if (db.redeemCodes.some(c => c.code.toUpperCase() === cleanCode)) {
      res.status(400).json({ message: 'Duplicate redeem code already exists' });
      return;
    }
    const newCodeItem: RedeemCodeItem = {
      id: `code-${Date.now()}`,
      code: cleanCode,
      category: category ? String(category).toUpperCase() : 'GOOGLE PLAY',
      denomination: Number(denomination),
      price: price !== undefined ? Number(price) : Number(denomination),
      balance: balance !== undefined ? Number(balance) : Number(denomination),
      status: status || 'Available',
      note: note || '',
      createdAt: new Date().toISOString()
    };
    db.redeemCodes.unshift(newCodeItem);
    saveDB(db);
    res.status(201).json(newCodeItem);
  });

  app.put('/api/redeem-codes/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    const idx = db.redeemCodes.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ message: 'Redeem code not found' });
      return;
    }
    db.redeemCodes[idx] = { ...db.redeemCodes[idx], ...req.body };
    saveDB(db);
    res.json(db.redeemCodes[idx]);
  });

  app.delete('/api/redeem-codes/:id', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const db = getDB();
    db.redeemCodes = db.redeemCodes.filter(c => c.id !== id);
    saveDB(db);
    res.json({ success: true, id });
  });

  // 5. BULK IMPORT REDEEM CODES
  app.post('/api/redeem-codes/bulk-import', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { rawText } = req.body;
    if (!rawText || !String(rawText).trim()) {
      res.status(400).json({ message: 'Raw text data is required' });
      return;
    }

    const db = getDB();
    const lines = String(rawText).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const existingCodes = new Set(db.redeemCodes.map(c => c.code.toUpperCase()));

    for (const line of lines) {
      const parts = line.split(/[|,\t]/).map(p => p.trim());
      if (parts.length < 1) continue;

      const code = parts[0]?.toUpperCase();
      if (!code) {
        failedCount++;
        errors.push(`Empty code on line "${line}"`);
        continue;
      }

      if (existingCodes.has(code)) {
        failedCount++;
        errors.push(`Duplicate code "${code}" skipped`);
        continue;
      }

      const category = parts[1] ? parts[1].toUpperCase() : 'GOOGLE PLAY';
      const denom = parts[2] ? Number(parts[2].replace(/[^0-9]/g, '')) : 500;
      const price = parts[3] ? Number(parts[3].replace(/[^0-9]/g, '')) : (denom || 500);
      const balance = parts[4] ? Number(parts[4].replace(/[^0-9]/g, '')) : (denom || 500);

      const newItem: RedeemCodeItem = {
        id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code,
        category,
        denomination: denom || 500,
        price: price || 500,
        balance: balance || 500,
        status: 'Available',
        createdAt: new Date().toISOString()
      };

      db.redeemCodes.unshift(newItem);
      existingCodes.add(code);
      successCount++;
    }

    saveDB(db);
    res.json({
      success: true,
      imported: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10)
    });
  });

  // 6. GET Products
  app.get('/api/products', (req: Request, res: Response) => {
    const db = getDB();
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';

    const activeCatNames = new Set(db.categories.filter(c => c.enabled !== false).map(c => c.name.toUpperCase()));

    if (isAdmin) {
      res.json(db.products);
    } else {
      const publicProducts = db.products
        .filter(p => p.enabled && activeCatNames.has(p.category.toUpperCase()))
        .map(p => {
          const { fullCode, ...rest } = p;
          return rest;
        });
      res.json(publicProducts);
    }
  });

  // 7. GET / PUT Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    const db = getDB();
    const { adminPin, ...publicSettings } = db.settings;
    res.json(publicSettings);
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const db = getDB();
    db.settings = { ...db.settings, ...req.body };
    if (req.body.adminPin) {
      db.adminPin = String(req.body.adminPin);
    }
    saveDB(db);
    res.json(db.settings);
  });

  // 8. GET Dashboard Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const db = getDB();
    const totalCategories = db.categories.length;
    const totalSubCategories = db.denominations.length;
    const totalRedeemCodes = db.redeemCodes.length;
    const availableCodes = db.redeemCodes.filter(c => c.status === 'Available').length;
    const soldCodes = db.redeemCodes.filter(c => c.status === 'Sold').length;
    const totalOrders = db.orders.length;
    const totalSales = db.orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);

    const stats: DashboardStats = {
      totalCategories,
      totalSubCategories,
      totalRedeemCodes,
      availableCodes,
      soldCodes,
      totalOrders,
      totalSales
    };

    res.json(stats);
  });

  // 9. POST Order
  app.post('/api/orders', (req: Request, res: Response) => {
    const { customerName, customerEmail, customerPhone, items, paymentMethod, promoCodeUsed, discountAmount } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !items || !items.length) {
      res.status(400).json({ message: 'Customer details and items are required' });
      return;
    }

    const db = getDB();
    let rawTotal = 0;
    const orderItems = [];
    let revealedCode = '';

    for (const item of items) {
      const codeIndex = db.redeemCodes.findIndex(
        c => c.status === 'Available' && (c.denomination === item.denomination || c.id === item.productId || c.price === item.price)
      );

      let targetCodeItem: RedeemCodeItem;
      if (codeIndex !== -1) {
        targetCodeItem = db.redeemCodes[codeIndex];
        db.redeemCodes[codeIndex].status = 'Sold';
      } else {
        targetCodeItem = {
          id: `code-${Date.now()}`,
          code: `GPRC-${Math.floor(1000 + Math.random() * 9000)}-8K4P-29X7`,
          category: 'GOOGLE PLAY',
          denomination: Number(item.denomination || item.price || 500),
          price: Number(item.price || 500),
          balance: Number(item.price || 500),
          status: 'Sold',
          createdAt: new Date().toISOString()
        };
      }

      rawTotal += targetCodeItem.price;

      orderItems.push({
        productId: targetCodeItem.id,
        productName: 'Google Play Recharge Code',
        category: targetCodeItem.category,
        denomination: targetCodeItem.denomination,
        price: targetCodeItem.price,
        maskedCode: formatMaskedCode(targetCodeItem.code)
      });

      revealedCode = targetCodeItem.code;
    }

    const finalDiscount = Number(discountAmount || 0);
    const totalAmount = Math.max(0, rawTotal - finalDiscount);
    const orderId = `BX-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone,
      items: orderItems,
      totalAmount,
      discountAmount: finalDiscount,
      promoCodeUsed: promoCodeUsed || undefined,
      status: 'Completed',
      paymentMethod: paymentMethod || 'UPI QR Code',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullRedeemCode: revealedCode
    };

    db.orders.unshift(newOrder);
    saveDB(db);

    res.status(201).json(newOrder);
  });

  // 10. GET Orders
  app.get('/api/orders', (req: Request, res: Response) => {
    const db = getDB();
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    const email = req.query.email as string;
    const orderId = req.query.orderId as string;

    if (isAdmin) {
      res.json(db.orders);
      return;
    }

    if (email) {
      const filtered = db.orders.filter(o => o.customerEmail.toLowerCase() === email.toLowerCase().trim());
      res.json(filtered);
      return;
    }

    if (orderId) {
      const filtered = db.orders.filter(o => o.id.toLowerCase() === orderId.toLowerCase().trim());
      res.json(filtered);
      return;
    }

    res.json([]);
  });

  // 11. PATCH Order Status
  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const isAdmin = req.headers['authorization'] === 'Bearer blackx_admin_token_sec_2026';
    if (!isAdmin) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };
    const db = getDB();
    const index = db.orders.findIndex(o => o.id === id);

    if (index === -1) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    db.orders[index].status = status;
    db.orders[index].updatedAt = new Date().toISOString();
    saveDB(db);

    res.json(db.orders[index]);
  });

  // VITE DEV OR STATIC
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BLACK X Redeem Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
