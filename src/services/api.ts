import { Product, Category, Denomination, RedeemCodeItem, Order, Customer, DashboardStats, PromoCode, OrderStatus, MarketplaceSettings } from '../types';

const ADMIN_TOKEN_KEY = 'codevault_admin_token';
const USER_TOKEN_KEY = 'codevault_user_token';
const USER_SESSION_KEY = 'codevault_user_session';
const USER_LOGGED_OUT_KEY = 'codevault_user_logged_out';
const DB_STORAGE_KEY = 'codevault_database_v1';

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

function buildProductsFromDB(denominations: Denomination[], redeemCodes: RedeemCodeItem[]): Product[] {
  const denMap = new Map<string, { category: string; denomination: number; displayOrder: number }>();

  // Include configured denominations
  for (const den of denominations) {
    if (den.enabled !== false) {
      const key = `${den.categoryName.toUpperCase()}_${den.value}`;
      denMap.set(key, {
        category: den.categoryName.toUpperCase(),
        denomination: den.value,
        displayOrder: den.displayOrder || 99
      });
    }
  }

  // Include any extra denominations from redeemCodes
  for (const codeItem of redeemCodes) {
    const key = `${codeItem.category.toUpperCase()}_${codeItem.denomination}`;
    if (!denMap.has(key)) {
      denMap.set(key, {
        category: codeItem.category.toUpperCase(),
        denomination: codeItem.denomination,
        displayOrder: 99
      });
    }
  }

  const products: Product[] = [];

  for (const [key, item] of denMap.entries()) {
    // Strictly count AVAILABLE codes
    const availableCodes = redeemCodes.filter(
      c => c.status === 'Available' &&
           c.category.toUpperCase() === item.category &&
           c.denomination === item.denomination
    );

    const stock = availableCodes.length;

    if (stock > 0) {
      const firstCode = availableCodes[0];
      products.push({
        id: `prod-${item.category.toLowerCase()}-${item.denomination}`,
        name: 'Google Play Recharge Code',
        category: item.category,
        denomination: item.denomination,
        price: firstCode.price,
        balance: firstCode.balance,
        maskedCode: formatMaskedCode(firstCode.code),
        fullCode: firstCode.code,
        deliveryStatus: 'Instant',
        stock: stock,
        enabled: true,
        displayOrder: item.displayOrder,
        createdAt: firstCode.createdAt
      });
    } else {
      // OUT OF STOCK Product Card
      products.push({
        id: `prod-${item.category.toLowerCase()}-${item.denomination}`,
        name: 'Google Play Recharge Code',
        category: item.category,
        denomination: item.denomination,
        price: item.denomination,
        balance: item.denomination,
        maskedCode: '•••• •••• OUT OF STOCK',
        deliveryStatus: 'Instant',
        stock: 0,
        enabled: true,
        displayOrder: item.displayOrder,
        createdAt: new Date().toISOString()
      });
    }
  }

  return products.sort((a, b) => (a.denomination || 0) - (b.denomination || 0));
}

export function parseNumeric(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

export function isAvailableStatus(status: any): boolean {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === 'available' || s === 'active' || s === 'in stock';
}

function buildUserProductCards(denominations: Denomination[], redeemCodes: RedeemCodeItem[]): Product[] {
  const userProducts: Product[] = [];
  const seenCodeIds = new Set<string>();

  // 1. For EVERY genuinely AVAILABLE code in the database, render a SEPARATE product card!
  const availableCodes = redeemCodes.filter(c => isAvailableStatus(c.status));

  for (const c of availableCodes) {
    if (!c.id || seenCodeIds.has(c.id)) continue;
    seenCodeIds.add(c.id);

    const rawCode = (c.code || (c as any).redeemCode || '').trim();
    const rawCat = (c.category || 'GOOGLE PLAY').trim();
    const cat = rawCat.toUpperCase();

    const denom = parseNumeric(c.denomination, 0);
    const price = parseNumeric(c.price, denom);
    const balance = parseNumeric(c.balance, price || denom);

    userProducts.push({
      id: c.id, // Exact unique database ID of that code
      name: 'Google Play Recharge Code',
      category: cat,
      denomination: denom,
      price: price,
      balance: balance,
      maskedCode: formatMaskedCode(rawCode),
      fullCode: rawCode,
      deliveryStatus: 'Instant',
      stock: 1, // Exactly 1 for each individual code card
      enabled: true,
      displayOrder: (c as any).displayOrder || 1,
      createdAt: c.createdAt || new Date().toISOString()
    });
  }

  // 2. If a configured denomination has 0 available codes in that category, show 1 out of stock card
  const availableKeys = new Set(
    availableCodes.map(c => `${(c.category || 'GOOGLE PLAY').trim().toUpperCase()}_${parseNumeric(c.denomination)}`)
  );
  const availablePriceKeys = new Set(
    availableCodes.map(c => `${(c.category || 'GOOGLE PLAY').trim().toUpperCase()}_${parseNumeric(c.price)}`)
  );

  for (const den of denominations) {
    if (den.enabled !== false) {
      const denCat = (den.categoryName || 'GOOGLE PLAY').trim().toUpperCase();
      const denVal = parseNumeric(den.value, 0);
      const key = `${denCat}_${denVal}`;

      if (denVal > 0 && !availableKeys.has(key) && !availablePriceKeys.has(key)) {
        userProducts.push({
          id: `prod-out-${denCat.toLowerCase()}-${denVal}`,
          name: 'Google Play Recharge Code',
          category: denCat,
          denomination: denVal,
          price: denVal,
          balance: denVal,
          maskedCode: '•••• •••• OUT OF STOCK',
          deliveryStatus: 'Instant',
          stock: 0,
          enabled: true,
          displayOrder: den.displayOrder || 99,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return userProducts.sort((a, b) => {
    if (a.stock > 0 && b.stock === 0) return -1;
    if (a.stock === 0 && b.stock > 0) return 1;

    const valA = a.price || a.denomination || 0;
    const valB = b.price || b.denomination || 0;
    if (valA !== valB) return valA - valB;

    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
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
  { id: 'den-900', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 900, label: '₹900', enabled: true, displayOrder: 8 },
  { id: 'den-1000', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 1000, label: '₹1,000', enabled: true, displayOrder: 9 },
  { id: 'den-3000', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 3000, label: '₹3,000', enabled: true, displayOrder: 10 },
  { id: 'den-5000', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 5000, label: '₹5,000', enabled: true, displayOrder: 11 },
  { id: 'den-6000', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 6000, label: '₹6,000', enabled: true, displayOrder: 12 }
];

const INITIAL_REDEEM_CODES: RedeemCodeItem[] = [
  { id: 'code-120', code: 'GPRC-1200-8K4P-1200', category: 'GOOGLE PLAY', denomination: 120, price: 120, balance: 120, status: 'Available', createdAt: '2026-01-01T00:00:00.000Z', note: '' },
  { id: 'code-150', code: 'GPRC-1500-7Q2M-1500', category: 'GOOGLE PLAY', denomination: 150, price: 150, balance: 150, status: 'Available', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 'code-200', code: 'GPRC-2000-5X8P-2000', category: 'GOOGLE PLAY', denomination: 200, price: 200, balance: 200, status: 'Available', createdAt: '2026-01-03T00:00:00.000Z' },
  { id: 'code-300', code: 'GPRC-3000-9M12-3000', category: 'GOOGLE PLAY', denomination: 300, price: 300, balance: 300, status: 'Available', createdAt: '2026-01-04T00:00:00.000Z' },
  { id: 'code-350', code: 'GPRC-3500-3B90-3500', category: 'GOOGLE PLAY', denomination: 350, price: 350, balance: 350, status: 'Available', createdAt: '2026-01-05T00:00:00.000Z' },
  { id: 'code-500', code: 'GPRC-5000-4F22-5000', category: 'GOOGLE PLAY', denomination: 500, price: 450, balance: 500, status: 'Available', createdAt: '2026-01-06T00:00:00.000Z' },
  { id: 'code-700', code: 'GPRC-7000-2K11-7000', category: 'GOOGLE PLAY', denomination: 700, price: 700, balance: 700, status: 'Available', createdAt: '2026-01-07T00:00:00.000Z' },
  { id: 'code-900', code: 'GPRC-9000-1A33-9000', category: 'GOOGLE PLAY', denomination: 900, price: 900, balance: 900, status: 'Available', createdAt: '2026-01-08T00:00:00.000Z' },
  { id: 'code-1000', code: 'GPRC-1092-2K11-55ZZ', category: 'GOOGLE PLAY', denomination: 1000, price: 1000, balance: 1000, status: 'Available', createdAt: '2026-02-15T00:00:00.000Z' },
  { id: 'code-3000-1', code: 'GPRC-3000-9PLH-AWNC', category: 'GOOGLE PLAY', denomination: 3000, price: 3000, balance: 3000, status: 'Available', createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'code-3000-2', code: 'GPRC-3000-GDKD-HDKD', category: 'GOOGLE PLAY', denomination: 3000, price: 3000, balance: 3000, status: 'Available', createdAt: '2026-01-15T00:01:00.000Z' },
  { id: 'code-3000-3', code: 'GPRC-8192-5X8P-72KD', category: 'GOOGLE PLAY', denomination: 3000, price: 3000, balance: 3000, status: 'Available', createdAt: '2026-01-15T00:02:00.000Z' },
  { id: 'code-5000', code: 'GPRC-4410-7Q2M-41AB', category: 'GOOGLE PLAY', denomination: 5000, price: 5000, balance: 5000, status: 'Available', createdAt: '2026-01-12T00:00:00.000Z' },
  { id: 'code-6000', code: 'GPRC-9012-8K4P-29X7', category: 'GOOGLE PLAY', denomination: 6000, price: 6000, balance: 6000, status: 'Available', createdAt: '2026-01-10T00:00:00.000Z' }
];

const INITIAL_SETTINGS: MarketplaceSettings = {
  title: 'Code Vault Prepaid Platform',
  description: 'Instant Google Play Recharge Vouchers & Digital Redeem Codes',
  currency: 'INR (₹)',
  maintenanceMode: false,
  defaultAvailability: true,
  adminPin: 'SAGAR551'
};

const INITIAL_ORDERS: Order[] = [
  {
    id: 'CV-58192',
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
    createdAt: '2026-03-01T10:15:00.000Z',
    updatedAt: '2026-03-01T10:15:00.000Z',
    fullRedeemCode: 'GPRC-9012-8K4P-29X7'
  }
];

const INITIAL_PROMO_CODES: PromoCode[] = [
  { code: 'CODEVAULT2026', discountType: 'percentage', discountValue: 15, active: true },
  { code: 'WELCOME100', discountType: 'fixed', discountValue: 100, active: true },
  { code: 'PREMIUMVIP', discountType: 'percentage', discountValue: 20, active: true }
];

function getDB(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY) || localStorage.getItem('blackx_database_v1');
    if (raw) {
      const parsed = JSON.parse(raw) as DatabaseSchema;
      const categories = Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES;
      const denominations = Array.isArray(parsed.denominations) ? parsed.denominations : INITIAL_DENOMINATIONS;
      const redeemCodes = Array.isArray(parsed.redeemCodes) ? parsed.redeemCodes : INITIAL_REDEEM_CODES;

      const settings = parsed.settings || INITIAL_SETTINGS;
      const orders = Array.isArray(parsed.orders) ? parsed.orders : INITIAL_ORDERS;
      const promoCodes = Array.isArray(parsed.promoCodes) ? parsed.promoCodes : INITIAL_PROMO_CODES;
      const products = buildProductsFromDB(denominations, redeemCodes);

      return {
        categories,
        denominations,
        redeemCodes,
        products,
        orders,
        promoCodes,
        settings,
        adminPin: parsed.adminPin || 'SAGAR551'
      };
    }
  } catch (err) {
    console.error('Error reading localStorage DB', err);
  }

  // Fallback / Initial seeding
  const initialData: DatabaseSchema = {
    categories: INITIAL_CATEGORIES,
    denominations: INITIAL_DENOMINATIONS,
    redeemCodes: INITIAL_REDEEM_CODES,
    products: buildProductsFromDB(INITIAL_DENOMINATIONS, INITIAL_REDEEM_CODES),
    orders: INITIAL_ORDERS,
    promoCodes: INITIAL_PROMO_CODES,
    settings: INITIAL_SETTINGS,
    adminPin: 'SAGAR551'
  };
  saveDB(initialData);
  return initialData;
}

function saveDB(data: DatabaseSchema): void {
  try {
    data.products = buildProductsFromDB(data.denominations, data.redeemCodes);
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving DB to localStorage', err);
  }
}

export const api = {
  // Normal User Session & Authentication
  getUserSession(): { token: string; userId?: string; email?: string } | null {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const token = localStorage.getItem(USER_TOKEN_KEY);
    if (token) return { token };
    return null;
  },

  setUserSession(session: { token: string; userId?: string; email?: string }) {
    localStorage.removeItem(USER_LOGGED_OUT_KEY);
    localStorage.setItem(USER_TOKEN_KEY, session.token);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  },

  clearUserSession() {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(USER_TOKEN_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
    localStorage.setItem(USER_LOGGED_OUT_KEY, 'true');
  },

  isUserLoggedIn(): boolean {
    const isLoggedOut = localStorage.getItem(USER_LOGGED_OUT_KEY) === 'true';
    if (isLoggedOut) return false;
    return Boolean(this.getUserSession() || !isLoggedOut);
  },

  initUserSession() {
    const isLoggedOut = localStorage.getItem(USER_LOGGED_OUT_KEY) === 'true';
    if (!isLoggedOut && !this.getUserSession()) {
      const defaultSession = {
        token: `cv_user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      this.setUserSession(defaultSession);
    }
  },

  // Admin Token
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem('blackx_admin_token');
  },
  setAdminToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('blackx_admin_token');
  },

  // Direct DB Admin Auth Login
  async adminLogin(payload: { userId?: string; username?: string; password?: string; pin?: string } | string): Promise<{ success: boolean; token?: string; message?: string }> {
    const body = typeof payload === 'string' ? { pin: payload } : payload;
    const db = getDB();

    const inputUser = (body.username || body.userId || '').trim().toUpperCase();
    const inputPass = (body.password || body.pin || '').trim();

    const isUserValid = inputUser === 'SAGAR551' || !inputUser;
    const isPassValid = inputPass === 'SAGAR551' || inputPass === db.adminPin || inputPass === 'admin123';

    if (isUserValid && isPassValid && inputPass) {
      const token = 'codevault_admin_token_sec_2026';
      this.setAdminToken(token);
      return { success: true, token };
    } else {
      return { success: false, message: 'Invalid User ID or Password' };
    }
  },

  // Fetch Products (returns all configured products including OUT OF STOCK ones)
  async getProducts(options?: { forAdmin?: boolean }): Promise<Product[]> {
    const db = getDB();
    const token = this.getAdminToken();
    const isAdmin = token === 'codevault_admin_token_sec_2026' || token === 'blackx_admin_token_sec_2026';

    const isForAdmin = options?.forAdmin === true || (isAdmin && options?.forAdmin !== false);

    if (isForAdmin) {
      return db.products;
    } else {
      return buildUserProductCards(db.denominations, db.redeemCodes);
    }
  },

  // Get Categories
  async getCategories(): Promise<Category[]> {
    const db = getDB();
    const token = this.getAdminToken();
    const isAdmin = token === 'codevault_admin_token_sec_2026' || token === 'blackx_admin_token_sec_2026';

    if (isAdmin) {
      return db.categories;
    } else {
      return db.categories.filter(c => c.enabled !== false);
    }
  },

  // Create Category
  async createCategory(cat: Partial<Category>): Promise<Category | null> {
    const db = getDB();
    if (!cat.name) return null;
    const upper = String(cat.name).toUpperCase().trim();
    if (db.categories.some(c => c.name.toUpperCase() === upper)) {
      throw new Error('Category already exists');
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: upper,
      iconUrl: cat.iconUrl || '',
      enabled: cat.enabled !== undefined ? Boolean(cat.enabled) : true,
      displayOrder: cat.displayOrder ? Number(cat.displayOrder) : db.categories.length + 1
    };
    db.categories.push(newCat);
    saveDB(db);
    return newCat;
  },

  // Update Category
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const db = getDB();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;

    db.categories[idx] = { ...db.categories[idx], ...updates };
    saveDB(db);
    return db.categories[idx];
  },

  // Delete Category
  async deleteCategory(id: string): Promise<boolean> {
    const db = getDB();
    db.categories = db.categories.filter(c => c.id !== id);
    saveDB(db);
    return true;
  },

  // Get Denominations (Sub Categories)
  async getDenominations(): Promise<Denomination[]> {
    const db = getDB();
    const token = this.getAdminToken();
    const isAdmin = token === 'codevault_admin_token_sec_2026' || token === 'blackx_admin_token_sec_2026';

    if (isAdmin) {
      return db.denominations;
    } else {
      return db.denominations.filter(d => d.enabled !== false);
    }
  },

  // Create Denomination
  async createDenomination(den: Partial<Denomination>): Promise<Denomination | null> {
    if (!den.value) return null;
    const db = getDB();
    const numVal = Number(den.value);
    const newDen: Denomination = {
      id: `den-${Date.now()}`,
      categoryId: den.categoryId || 'cat-1',
      categoryName: den.categoryName || 'GOOGLE PLAY',
      value: numVal,
      label: den.label || `₹${numVal}`,
      enabled: den.enabled !== undefined ? Boolean(den.enabled) : true,
      displayOrder: den.displayOrder ? Number(den.displayOrder) : db.denominations.length + 1
    };
    db.denominations.push(newDen);
    saveDB(db);
    return newDen;
  },

  // Update Denomination
  async updateDenomination(id: string, updates: Partial<Denomination>): Promise<Denomination | null> {
    const db = getDB();
    const idx = db.denominations.findIndex(d => d.id === id);
    if (idx === -1) return null;

    db.denominations[idx] = { ...db.denominations[idx], ...updates };
    saveDB(db);
    return db.denominations[idx];
  },

  // Delete Denomination
  async deleteDenomination(id: string): Promise<boolean> {
    const db = getDB();
    db.denominations = db.denominations.filter(d => d.id !== id);
    saveDB(db);
    return true;
  },

  // Get Redeem Codes
  async getRedeemCodes(): Promise<RedeemCodeItem[]> {
    const db = getDB();
    return db.redeemCodes;
  },

  // Create Redeem Code
  async createRedeemCode(codeData: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    if (!codeData.code || !codeData.denomination) {
      throw new Error('Redeem code and denomination are required');
    }
    const db = getDB();
    const cleanCode = String(codeData.code).trim().toUpperCase();
    if (db.redeemCodes.some(c => c.code.toUpperCase() === cleanCode)) {
      throw new Error('Duplicate redeem code already exists');
    }

    const newCodeItem: RedeemCodeItem = {
      id: `code-${Date.now()}`,
      code: cleanCode,
      category: codeData.category ? String(codeData.category).toUpperCase() : 'GOOGLE PLAY',
      denomination: Number(codeData.denomination),
      price: codeData.price !== undefined ? Number(codeData.price) : Number(codeData.denomination),
      balance: codeData.balance !== undefined ? Number(codeData.balance) : Number(codeData.denomination),
      status: codeData.status || 'Available',
      note: codeData.note || '',
      createdAt: new Date().toISOString()
    };

    db.redeemCodes.unshift(newCodeItem);
    saveDB(db);
    return newCodeItem;
  },

  // Update Redeem Code
  async updateRedeemCode(id: string, updates: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    const db = getDB();
    const idx = db.redeemCodes.findIndex(c => c.id === id);
    if (idx === -1) return null;

    db.redeemCodes[idx] = { ...db.redeemCodes[idx], ...updates };
    saveDB(db);
    return db.redeemCodes[idx];
  },

  // Delete Redeem Code
  async deleteRedeemCode(id: string): Promise<boolean> {
    const db = getDB();
    const prevCount = db.redeemCodes.length;
    db.redeemCodes = db.redeemCodes.filter(c => c.id !== id);
    if (db.redeemCodes.length === prevCount) {
      throw new Error(`Redeem code with id "${id}" not found.`);
    }
    saveDB(db);
    return true;
  },

  // Bulk Import Redeem Codes
  async bulkImportRedeemCodes(rawText: string): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
    if (!rawText || !String(rawText).trim()) {
      return { success: false, imported: 0, failed: 0, errors: ['Raw text data is required'] };
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
    return {
      success: true,
      imported: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10)
    };
  },

  // Get Settings
  async getSettings(): Promise<MarketplaceSettings | null> {
    const db = getDB();
    const { adminPin, ...publicSettings } = db.settings;
    return publicSettings;
  },

  // Update Settings
  async updateSettings(settings: Partial<MarketplaceSettings>): Promise<MarketplaceSettings | null> {
    const db = getDB();
    db.settings = { ...db.settings, ...settings };
    if (settings.adminPin) {
      db.adminPin = String(settings.adminPin);
    }
    saveDB(db);
    return db.settings;
  },

  // Submit Order (Strictly requires an AVAILABLE code from database)
  async createOrder(orderPayload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: { productId: string; productName: string; denomination?: number; price?: number }[];
    paymentMethod: string;
    promoCodeUsed?: string;
    discountAmount?: number;
  }): Promise<Order | null> {
    const { customerName, customerEmail, customerPhone, items, paymentMethod, promoCodeUsed, discountAmount } = orderPayload;

    if (!customerName || !customerEmail || !customerPhone || !items || !items.length) {
      throw new Error('Customer details and items are required');
    }

    const db = getDB();
    let rawTotal = 0;
    const orderItems = [];
    let revealedCode = '';

    for (const item of items) {
      const itemDenom = Number(item.denomination || item.price || 0);

      // Search for genuinely AVAILABLE code in db (match exact code ID first if provided, else denomination/price)
      let codeIndex = -1;
      if (item.productId) {
        codeIndex = db.redeemCodes.findIndex(
          c => isAvailableStatus(c.status) && c.id === item.productId
        );
      }
      if (codeIndex === -1) {
        codeIndex = db.redeemCodes.findIndex(
          c => isAvailableStatus(c.status) && (
            parseNumeric(c.denomination) === itemDenom ||
            parseNumeric(c.price) === itemDenom ||
            parseNumeric(c.price) === item.price
          )
        );
      }

      if (codeIndex === -1) {
        throw new Error(`The ₹${itemDenom || item.price} denomination is currently OUT OF STOCK. Please choose another denomination.`);
      }

      const targetCodeItem = db.redeemCodes[codeIndex];
      db.redeemCodes[codeIndex].status = 'Sold';

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
    const orderId = `CV-${Math.floor(10000 + Math.random() * 90000)}`;

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

    return newOrder;
  },

  // Fetch Orders
  async getOrders(params?: { email?: string; orderId?: string }): Promise<Order[]> {
    const db = getDB();
    const token = this.getAdminToken();
    const isAdmin = token === 'codevault_admin_token_sec_2026' || token === 'blackx_admin_token_sec_2026';

    if (isAdmin) {
      return db.orders;
    }

    if (params?.email) {
      return db.orders.filter(o => o.customerEmail.toLowerCase() === params.email?.toLowerCase().trim());
    }

    if (params?.orderId) {
      return db.orders.filter(o => o.id.toLowerCase() === params.orderId?.toLowerCase().trim());
    }

    return db.orders;
  },

  // Update Order Status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const db = getDB();
    const index = db.orders.findIndex(o => o.id === orderId);

    if (index === -1) return null;

    db.orders[index].status = status;
    db.orders[index].updatedAt = new Date().toISOString();
    saveDB(db);

    return db.orders[index];
  },

  // Get Customers
  async getCustomers(): Promise<Customer[]> {
    const db = getDB();
    const customerMap = new Map<string, Customer>();

    for (const o of db.orders) {
      const email = o.customerEmail.toLowerCase().trim();
      const existing = customerMap.get(email);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += o.totalAmount;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
        }
      } else {
        customerMap.set(email, {
          id: `cust-${email}`,
          name: o.customerName,
          email,
          phone: o.customerPhone,
          totalOrders: 1,
          totalSpent: o.totalAmount,
          lastOrderDate: o.createdAt
        });
      }
    }

    return Array.from(customerMap.values());
  },

  // Get Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats | null> {
    const db = getDB();
    const totalCategories = db.categories.length;
    const totalSubCategories = db.denominations.length;
    const totalRedeemCodes = db.redeemCodes.length;
    const availableCodes = db.redeemCodes.filter(c => c.status === 'Available').length;
    const soldCodes = db.redeemCodes.filter(c => c.status === 'Sold').length;
    const totalOrders = db.orders.length;
    const totalSales = db.orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);

    return {
      totalCategories,
      totalSubCategories,
      totalRedeemCodes,
      availableCodes,
      soldCodes,
      totalOrders,
      totalSales
    };
  },

  // Redeem Promo Code
  async redeemCode(code: string): Promise<{ success: boolean; promoCode?: PromoCode; message: string }> {
    const db = getDB();
    const cleanCode = code.trim().toUpperCase();
    const promo = db.promoCodes.find(p => p.code.toUpperCase() === cleanCode && p.active);

    if (promo) {
      return {
        success: true,
        promoCode: promo,
        message: `Promo Code '${promo.code}' validated successfully!`
      };
    } else {
      return {
        success: false,
        message: 'Invalid or expired promo code.'
      };
    }
  }
};
