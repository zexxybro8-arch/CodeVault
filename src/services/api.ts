import {
  Product, Category, Denomination, RedeemCodeItem, Order, Customer,
  DashboardStats, PromoCode, OrderStatus, MarketplaceSettings,
  User, DepositAmount, DepositRequest, WalletTransaction, DepositStatus
} from '../types';

const ADMIN_TOKEN_KEY = 'codevault_admin_token';
const USER_TOKEN_KEY = 'codevault_user_token';
const USER_SESSION_KEY = 'codevault_user_session';
const CURRENT_USER_KEY = 'codevault_current_user';
const DB_STORAGE_KEY = 'codevault_database_v1';
const PENDING_PAYMENT_SESSION_KEY = 'codevault_pending_payment_session';

interface DatabaseSchema {
  categories: Category[];
  denominations: Denomination[];
  redeemCodes: RedeemCodeItem[];
  products: Product[];
  orders: Order[];
  promoCodes: PromoCode[];
  settings: MarketplaceSettings;
  adminPin: string;
  users: User[];
  depositAmounts: DepositAmount[];
  deposits: DepositRequest[];
  transactions: WalletTransaction[];
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

function buildProductsFromDB(denominations: Denomination[], redeemCodes: RedeemCodeItem[]): Product[] {
  const denMap = new Map<string, { category: string; denomination: number; displayOrder: number }>();

  for (const den of denominations) {
    if (den.enabled !== false) {
      const denCat = (den.categoryName || 'GOOGLE PLAY').trim().toUpperCase();
      const denVal = parseNumeric(den.value, 0);
      const key = `${denCat}_${denVal}`;
      denMap.set(key, {
        category: denCat,
        denomination: denVal,
        displayOrder: den.displayOrder || 99
      });
    }
  }

  for (const codeItem of redeemCodes) {
    const codeCat = (codeItem.category || 'GOOGLE PLAY').trim().toUpperCase();
    const codeDenom = parseNumeric(codeItem.denomination, 0);
    const key = `${codeCat}_${codeDenom}`;
    if (!denMap.has(key)) {
      denMap.set(key, {
        category: codeCat,
        denomination: codeDenom,
        displayOrder: 99
      });
    }
  }

  const products: Product[] = [];

  for (const [key, item] of denMap.entries()) {
    const availableCodes = redeemCodes.filter(
      c => isAvailableStatus(c.status) &&
           (c.category || 'GOOGLE PLAY').trim().toUpperCase() === item.category &&
           parseNumeric(c.denomination) === item.denomination
    );

    const stock = availableCodes.length;
    const denConfig = denominations.find(d => 
      (d.categoryName || 'GOOGLE PLAY').trim().toUpperCase() === item.category &&
      parseNumeric(d.value) === item.denomination
    );
    const prodName = denConfig?.name || 'Google Play Recharge Code';
    const prodEnabled = denConfig ? denConfig.enabled !== false : true;

    if (stock > 0) {
      const firstCode = availableCodes[0];
      const prodPrice = parseNumeric(firstCode.price, denConfig?.price !== undefined ? parseNumeric(denConfig.price) : item.denomination);
      const prodBalance = parseNumeric(firstCode.balance, denConfig?.balance !== undefined ? parseNumeric(denConfig.balance) : item.denomination);

      products.push({
        id: `prod-${item.category.toLowerCase()}-${item.denomination}`,
        name: prodName,
        category: item.category,
        denomination: item.denomination,
        price: prodPrice,
        balance: prodBalance,
        maskedCode: formatMaskedCode(firstCode.code || (firstCode as any).redeemCode || ''),
        fullCode: firstCode.code || (firstCode as any).redeemCode || '',
        deliveryStatus: 'Instant',
        stock: stock,
        enabled: prodEnabled,
        displayOrder: item.displayOrder,
        createdAt: firstCode.createdAt
      });
    } else {
      const outPrice = denConfig?.price !== undefined ? parseNumeric(denConfig.price) : item.denomination;
      const outBalance = denConfig?.balance !== undefined ? parseNumeric(denConfig.balance) : item.denomination;

      products.push({
        id: `prod-${item.category.toLowerCase()}-${item.denomination}`,
        name: prodName,
        category: item.category,
        denomination: item.denomination,
        price: outPrice,
        balance: outBalance,
        maskedCode: '•••• •••• OUT OF STOCK',
        deliveryStatus: 'Instant',
        stock: 0,
        enabled: prodEnabled,
        displayOrder: item.displayOrder,
        createdAt: new Date().toISOString()
      });
    }
  }

  return products.sort((a, b) => (a.denomination || 0) - (b.denomination || 0));
}

function buildUserProductCards(denominations: Denomination[], redeemCodes: RedeemCodeItem[]): Product[] {
  const userProducts: Product[] = [];
  const seenCodeIds = new Set<string>();

  const availableCodes = redeemCodes.filter(c => isAvailableStatus(c.status));

  for (const c of availableCodes) {
    if (!c.id || seenCodeIds.has(c.id)) continue;
    seenCodeIds.add(c.id);

    const rawCode = (c.code || (c as any).redeemCode || '').trim();
    const rawCat = (c.category || 'GOOGLE PLAY').trim();
    const cat = rawCat.toUpperCase();

    const denom = parseNumeric(c.denomination, 0);
    const denConfig = denominations.find(d => 
      (d.categoryName || 'GOOGLE PLAY').trim().toUpperCase() === cat &&
      parseNumeric(d.value) === denom
    );

    const price = parseNumeric(c.price, denConfig?.price !== undefined ? parseNumeric(denConfig.price) : denom);
    const balance = parseNumeric(c.balance, denConfig?.balance !== undefined ? parseNumeric(denConfig.balance) : (price || denom));
    const name = denConfig?.name || 'Google Play Recharge Code';
    const enabled = denConfig ? denConfig.enabled !== false : true;

    userProducts.push({
      id: c.id,
      name: name,
      category: cat,
      denomination: denom,
      price: price,
      balance: balance,
      maskedCode: formatMaskedCode(rawCode),
      fullCode: rawCode,
      deliveryStatus: 'Instant',
      stock: 1,
      enabled: enabled,
      displayOrder: (c as any).displayOrder || denConfig?.displayOrder || 1,
      createdAt: c.createdAt || new Date().toISOString()
    });
  }

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
        const outPrice = den.price !== undefined ? parseNumeric(den.price) : denVal;
        const outBalance = den.balance !== undefined ? parseNumeric(den.balance) : denVal;
        const outName = den.name || 'Google Play Recharge Code';

        userProducts.push({
          id: `prod-out-${denCat.toLowerCase()}-${denVal}`,
          name: outName,
          category: denCat,
          denomination: denVal,
          price: outPrice,
          balance: outBalance,
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

// Initial default seeds
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'GOOGLE PLAY', iconUrl: 'https://cdn-icons-png.flaticon.com/512/888/888857.png', enabled: true, displayOrder: 1 },
  { id: 'cat-2', name: 'APPLE ITUNES', iconUrl: 'https://cdn-icons-png.flaticon.com/512/888/888841.png', enabled: true, displayOrder: 2 },
  { id: 'cat-3', name: 'STEAM WALLET', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5969/5969018.png', enabled: true, displayOrder: 3 },
  { id: 'cat-4', name: 'AMAZON PAY', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968144.png', enabled: true, displayOrder: 4 },
  { id: 'cat-5', name: 'FREE FIRE MAX', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png', enabled: true, displayOrder: 5 }
];

const INITIAL_DENOMINATIONS: Denomination[] = [
  { id: 'den-1', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 120, label: '₹120', price: 120, balance: 120, name: 'Google Play Recharge Code', enabled: true, displayOrder: 1 },
  { id: 'den-2', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 150, label: '₹150', price: 150, balance: 150, name: 'Google Play Recharge Code', enabled: true, displayOrder: 2 },
  { id: 'den-3', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 200, label: '₹200', price: 3000, balance: 3000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 3 },
  { id: 'den-4', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 300, label: '₹300', price: 300, balance: 300, name: 'Google Play Recharge Code', enabled: true, displayOrder: 4 },
  { id: 'den-5', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 350, label: '₹350', price: 6000, balance: 6000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 5 },
  { id: 'den-6', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 500, label: '₹500', price: 450, balance: 500, name: 'Google Play Recharge Code', enabled: true, displayOrder: 6 },
  { id: 'den-7', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 700, label: '₹700', price: 700, balance: 700, name: 'Google Play Recharge Code', enabled: true, displayOrder: 7 },
  { id: 'den-8', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 900, label: '₹900', price: 900, balance: 900, name: 'Google Play Recharge Code', enabled: true, displayOrder: 8 },
  { id: 'den-9', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 1000, label: '₹1000', price: 920, balance: 1000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 9 }
];

const INITIAL_REDEEM_CODES: RedeemCodeItem[] = [
  { id: 'code-101', code: 'GPRC-9012-8K4P-29X7', category: 'GOOGLE PLAY', denomination: 500, price: 450, balance: 500, status: 'Available', note: 'Standard stock batch #1', createdAt: new Date().toISOString() },
  { id: 'code-102', code: 'GPRC-7741-3L9M-58K2', category: 'GOOGLE PLAY', denomination: 1000, price: 920, balance: 1000, status: 'Available', note: 'Standard stock batch #1', createdAt: new Date().toISOString() },
  { id: 'code-103', code: 'GPRC-4421-9X8V-11P0', category: 'GOOGLE PLAY', denomination: 200, price: 3000, balance: 3000, status: 'Available', note: 'Special edition', createdAt: new Date().toISOString() },
  { id: 'code-104', code: 'GPRC-6632-1B5K-88M9', category: 'GOOGLE PLAY', denomination: 350, price: 6000, balance: 6000, status: 'Available', note: 'Special promo batch', createdAt: new Date().toISOString() }
];

const INITIAL_DEPOSIT_AMOUNTS: DepositAmount[] = [
  {
    id: 'dep_amt_200',
    amount: 200,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=200&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹200)',
    enabled: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_300',
    amount: 300,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=300&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹300)',
    enabled: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_350',
    amount: 350,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=350&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹350)',
    enabled: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_400',
    amount: 400,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=400&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹400)',
    enabled: true,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_500',
    amount: 500,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=500&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹500)',
    enabled: true,
    displayOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_700',
    amount: 700,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=700&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹700)',
    enabled: true,
    displayOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'dep_amt_1000',
    amount: 1000,
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=1000&cu=INR',
    upiId: 'codevault.pay@okaxis',
    receiverName: 'CodeVault Official (₹1000)',
    enabled: true,
    displayOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr_google_1092830192',
    googleId: '10928301923847192834',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    walletBalance: 1250,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    totalDeposits: 1500
  },
  {
    id: 'usr_google_1082390123',
    googleId: '10823901238491823912',
    name: 'Priya Patel',
    email: 'priya.patel.tech@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    walletBalance: 450,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    totalDeposits: 500
  }
];

const INITIAL_DEPOSITS: DepositRequest[] = [
  {
    id: 'DEP-78192',
    userId: 'usr_google_1092830192',
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@gmail.com',
    userProfileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    amount: 500,
    depositAmountId: 'dep_amt_500',
    paymentSessionId: 'sess_109238491823',
    utrNumber: '429183921029',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    expiresAt: new Date(Date.now() - 3600000 * 5 + 300000).toISOString(),
    approvedAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
    approvedBy: 'Admin'
  },
  {
    id: 'DEP-89102',
    userId: 'usr_google_1082390123',
    userName: 'Priya Patel',
    userEmail: 'priya.patel.tech@gmail.com',
    userProfileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    amount: 350,
    depositAmountId: 'dep_amt_350',
    paymentSessionId: 'sess_891029384712',
    utrNumber: '519283746192',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 180).toISOString()
  }
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN-1001',
    userId: 'usr_google_1092830192',
    type: 'Deposit',
    amount: 500,
    balanceBefore: 750,
    balanceAfter: 1250,
    referenceId: 'DEP-78192',
    description: 'Wallet Deposit via UPI QR',
    status: 'Approved',
    createdAt: new Date(Date.now() - 3600000 * 4.8).toISOString()
  },
  {
    id: 'TXN-1002',
    userId: 'usr_google_1082390123',
    type: 'Deposit',
    amount: 500,
    balanceBefore: 0,
    balanceAfter: 500,
    referenceId: 'DEP-66123',
    description: 'Wallet Deposit via UPI QR',
    status: 'Approved',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'TXN-1003',
    userId: 'usr_google_1082390123',
    type: 'Purchase',
    amount: -50,
    balanceBefore: 500,
    balanceAfter: 450,
    referenceId: 'BX-89210',
    description: 'Voucher Purchase #BX-89210',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_SETTINGS: MarketplaceSettings = {
  title: 'Code Vault Prepaid Platform',
  description: 'Instant Google Play Recharge Vouchers & Digital Redeem Codes',
  currency: 'INR (₹)',
  maintenanceMode: false,
  defaultAvailability: true,
  defaultUpiId: 'codevault.pay@okaxis',
  defaultUpiName: 'CodeVault Official Payment',
  adminPin: '9000'
};

function getDB(): DatabaseSchema {
  try {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem(DB_STORAGE_KEY) || localStorage.getItem('blackx_database_v1')) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as DatabaseSchema;
      const categories = Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES;
      const denominations = Array.isArray(parsed.denominations) ? parsed.denominations : INITIAL_DENOMINATIONS;
      const redeemCodes = Array.isArray(parsed.redeemCodes) ? parsed.redeemCodes : INITIAL_REDEEM_CODES;
      const settings = parsed.settings || INITIAL_SETTINGS;
      const orders = Array.isArray(parsed.orders) ? parsed.orders : [];
      const promoCodes = Array.isArray(parsed.promoCodes) ? parsed.promoCodes : [];
      const users = Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS;
      const depositAmounts = Array.isArray(parsed.depositAmounts) && parsed.depositAmounts.length > 0 ? parsed.depositAmounts : INITIAL_DEPOSIT_AMOUNTS;
      const deposits = Array.isArray(parsed.deposits) ? parsed.deposits : INITIAL_DEPOSITS;
      const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_TRANSACTIONS;
      const products = buildProductsFromDB(denominations, redeemCodes);

      return {
        categories,
        denominations,
        redeemCodes,
        products,
        orders,
        promoCodes,
        settings,
        adminPin: parsed.adminPin || '9000',
        users,
        depositAmounts,
        deposits,
        transactions
      };
    }
  } catch (err) {
    console.error('Error reading localStorage DB', err);
  }

  const initialData: DatabaseSchema = {
    categories: INITIAL_CATEGORIES,
    denominations: INITIAL_DENOMINATIONS,
    redeemCodes: INITIAL_REDEEM_CODES,
    products: buildProductsFromDB(INITIAL_DENOMINATIONS, INITIAL_REDEEM_CODES),
    orders: [],
    promoCodes: [],
    settings: INITIAL_SETTINGS,
    adminPin: '9000',
    users: INITIAL_USERS,
    depositAmounts: INITIAL_DEPOSIT_AMOUNTS,
    deposits: INITIAL_DEPOSITS,
    transactions: INITIAL_TRANSACTIONS
  };
  saveDB(initialData);
  return initialData;
}

function saveDB(data: DatabaseSchema): void {
  try {
    data.products = buildProductsFromDB(data.denominations, data.redeemCodes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
    }
    // Async background sync with backend server
    if (typeof window !== 'undefined') {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Error saving DB to localStorage', err);
  }
}

export const api = {
  // ----------------------------------------------------
  // User Authentication & Session
  // ----------------------------------------------------
  async signInWithGoogle(payload: { googleId: string; name: string; email: string; profileImage?: string }): Promise<{ success: boolean; user: User; token: string }> {
    try {
      // Try backend first
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.setCurrentUser(data.user);
          localStorage.setItem(USER_TOKEN_KEY, data.token);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
          return data;
        }
      }
    } catch {
      // fallback
    }

    // Local DB fallback
    const db = getDB();
    let user = db.users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      user = {
        id: `usr_google_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        googleId: payload.googleId || `gid_${Date.now()}`,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        profileImage: payload.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        walletBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        totalDeposits: 0
      };
      db.users.push(user);
      saveDB(db);
    } else {
      user.name = payload.name || user.name;
      if (payload.profileImage) user.profileImage = payload.profileImage;
      saveDB(db);
    }

    const token = `usr_session_${user.id}_${Date.now()}`;
    this.setCurrentUser(user);
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    return { success: true, user, token };
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(USER_SESSION_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        // Refresh balance from DB if present
        const db = getDB();
        const fresh = db.users.find(u => u.id === user.id);
        return fresh || user;
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(USER_TOKEN_KEY);
    }
  },

  isUserLoggedIn(): boolean {
    return Boolean(this.getCurrentUser());
  },

  initUserSession(): User | null {
    return this.getCurrentUser();
  },

  clearUserSession(): void {
    this.logoutUser();
  },

  logoutUser(): void {
    this.setCurrentUser(null);
  },

  // ----------------------------------------------------
  // User Management (Admin)
  // ----------------------------------------------------
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) return data.users;
      }
    } catch {}
    const db = getDB();
    return db.users || [];
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<boolean> {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return false;
    user.status = status;
    saveDB(db);
    return true;
  },

  async adjustUserWallet(userId: string, amount: number, type: 'credit' | 'debit', reason?: string): Promise<{ success: boolean; user?: User }> {
    try {
      const res = await fetch(`/api/admin/users/${userId}/adjust-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type, reason })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch {}

    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const numAmount = parseNumeric(amount);
    const balanceBefore = user.walletBalance || 0;
    const delta = type === 'debit' ? -Math.abs(numAmount) : Math.abs(numAmount);
    const balanceAfter = Math.max(0, balanceBefore + delta);

    user.walletBalance = balanceAfter;
    if (delta > 0) user.totalDeposits = (user.totalDeposits || 0) + delta;

    const txn: WalletTransaction = {
      id: `TXN-ADJ-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      type: 'Admin_Adjustment',
      amount: delta,
      balanceBefore,
      balanceAfter,
      referenceId: `ADJ-${Date.now()}`,
      description: reason || `Admin adjustment (${type})`,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(txn);
    saveDB(db);

    return { success: true, user };
  },

  // ----------------------------------------------------
  // User Wallet & Transactions
  // ----------------------------------------------------
  async getWalletData(userId: string): Promise<{ balance: number; transactions: WalletTransaction[]; deposits: DepositRequest[] }> {
    try {
      const res = await fetch(`/api/wallet/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            balance: data.balance || 0,
            transactions: data.transactions || [],
            deposits: data.deposits || []
          };
        }
      }
    } catch {}

    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    const balance = user ? (user.walletBalance || 0) : 0;
    const transactions = db.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const deposits = db.deposits
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { balance, transactions, deposits };
  },

  async payWithWallet(userId: string, amount: number, orderId: string, description: string): Promise<{ success: boolean; balance: number }> {
    try {
      const res = await fetch('/api/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, orderId, description })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch {}

    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const numAmount = parseNumeric(amount);

    if ((user.walletBalance || 0) < numAmount) {
      throw new Error('Insufficient wallet balance');
    }

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore - numAmount;
    user.walletBalance = balanceAfter;

    const txn: WalletTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      type: 'Purchase',
      amount: -numAmount,
      balanceBefore,
      balanceAfter,
      referenceId: orderId || `ORD-${Date.now()}`,
      description: description || `Payment for order ${orderId}`,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(txn);
    saveDB(db);

    return { success: true, balance: balanceAfter };
  },

  // ----------------------------------------------------
  // Deposit Amounts & QR Management
  // ----------------------------------------------------
  async getDepositAmounts(options?: { forAdmin?: boolean }): Promise<DepositAmount[]> {
    try {
      const res = await fetch('/api/deposit-amounts');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.amounts)) {
          return options?.forAdmin ? data.amounts : data.amounts.filter((a: any) => a.enabled !== false);
        }
      }
    } catch {}

    const db = getDB();
    const list = db.depositAmounts || INITIAL_DEPOSIT_AMOUNTS;
    return options?.forAdmin ? list : list.filter(a => a.enabled !== false);
  },

  async createDepositAmount(data: Partial<DepositAmount>): Promise<DepositAmount> {
    const db = getDB();
    const amount = parseNumeric(data.amount, 500);
    const newAmt: DepositAmount = {
      id: `dep_amt_${amount}_${Date.now()}`,
      amount,
      qrUrl: String(data.qrUrl || '').trim() || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=${amount}&cu=INR`,
      upiId: data.upiId || db.settings.defaultUpiId || 'codevault.pay@okaxis',
      receiverName: data.receiverName || `CodeVault Official (₹${amount})`,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      displayOrder: data.displayOrder !== undefined ? parseNumeric(data.displayOrder) : db.depositAmounts.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.depositAmounts.push(newAmt);
    saveDB(db);
    return newAmt;
  },

  async updateDepositAmount(id: string, updates: Partial<DepositAmount>): Promise<DepositAmount> {
    const db = getDB();
    const idx = db.depositAmounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Deposit amount configuration not found');

    db.depositAmounts[idx] = {
      ...db.depositAmounts[idx],
      ...updates,
      amount: updates.amount !== undefined ? parseNumeric(updates.amount, db.depositAmounts[idx].amount) : db.depositAmounts[idx].amount,
      updatedAt: new Date().toISOString()
    };
    saveDB(db);
    return db.depositAmounts[idx];
  },

  async deleteDepositAmount(id: string): Promise<boolean> {
    const db = getDB();
    db.depositAmounts = db.depositAmounts.filter(a => a.id !== id);
    saveDB(db);
    return true;
  },

  // ----------------------------------------------------
  // Deposit Requests & 5-Minute Payment Sessions
  // ----------------------------------------------------
  savePaymentSession(session: { sessionId: string; amount: number; depositAmountId: string; expiresAt: number }): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_PAYMENT_SESSION_KEY, JSON.stringify(session));
    }
  },

  getPaymentSession(): { sessionId: string; amount: number; depositAmountId: string; expiresAt: number } | null {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(PENDING_PAYMENT_SESSION_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {}
    return null;
  },

  clearPaymentSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_PAYMENT_SESSION_KEY);
    }
  },

  async createDepositRequest(data: { userId: string; amount: number; depositAmountId?: string; paymentSessionId: string; utrNumber?: string; screenshotUrl?: string }): Promise<DepositRequest> {
    try {
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success) {
          this.clearPaymentSession();
          return resData.deposit;
        }
      }
    } catch {}

    const db = getDB();
    const user = db.users.find(u => u.id === data.userId);
    if (!user) throw new Error('User account not found');

    const newDep: DepositRequest = {
      id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userProfileImage: user.profileImage,
      amount: parseNumeric(data.amount),
      depositAmountId: data.depositAmountId || '',
      paymentSessionId: data.paymentSessionId || `sess_${Date.now()}`,
      utrNumber: data.utrNumber ? String(data.utrNumber).trim() : '',
      screenshotUrl: data.screenshotUrl || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString()
    };

    db.deposits.unshift(newDep);
    saveDB(db);
    this.clearPaymentSession();
    return newDep;
  },

  async getDepositRequests(filter?: { status?: DepositStatus; userId?: string }): Promise<DepositRequest[]> {
    try {
      const res = await fetch('/api/deposits');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.deposits)) {
          let list = data.deposits;
          if (filter?.status) list = list.filter((d: any) => d.status === filter.status);
          if (filter?.userId) list = list.filter((d: any) => d.userId === filter.userId);
          return list;
        }
      }
    } catch {}

    const db = getDB();
    let list = db.deposits || [];
    if (filter?.status) list = list.filter(d => d.status === filter.status);
    if (filter?.userId) list = list.filter(d => d.userId === filter.userId);
    return list;
  },

  async approveDeposit(depositId: string, approvedBy?: string): Promise<{ success: boolean; deposit: DepositRequest }> {
    try {
      const res = await fetch(`/api/deposits/approve/${depositId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: approvedBy || 'Admin' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch {}

    const db = getDB();
    const deposit = db.deposits.find(d => d.id === depositId);
    if (!deposit) throw new Error('Deposit request not found');
    if (deposit.status === 'APPROVED') throw new Error('Deposit is already approved');

    const user = db.users.find(u => u.id === deposit.userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = user.walletBalance || 0;
    const amount = parseNumeric(deposit.amount);
    const balanceAfter = balanceBefore + amount;

    user.walletBalance = balanceAfter;
    user.totalDeposits = (user.totalDeposits || 0) + amount;

    deposit.status = 'APPROVED';
    deposit.approvedAt = new Date().toISOString();
    deposit.approvedBy = approvedBy || 'Admin';

    const txn: WalletTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      type: 'Deposit',
      amount,
      balanceBefore,
      balanceAfter,
      referenceId: deposit.id,
      description: `Wallet Deposit (Approved by ${deposit.approvedBy})`,
      status: 'Approved',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(txn);
    saveDB(db);

    return { success: true, deposit };
  },

  async rejectDeposit(depositId: string, notes?: string): Promise<{ success: boolean; deposit: DepositRequest }> {
    try {
      const res = await fetch(`/api/deposits/reject/${depositId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch {}

    const db = getDB();
    const deposit = db.deposits.find(d => d.id === depositId);
    if (!deposit) throw new Error('Deposit request not found');
    if (deposit.status === 'APPROVED') throw new Error('Cannot reject an already approved deposit');

    deposit.status = 'REJECTED';
    deposit.rejectedAt = new Date().toISOString();
    deposit.notes = notes || 'Rejected by Admin';
    saveDB(db);

    return { success: true, deposit };
  },

  // ----------------------------------------------------
  // Admin Authentication & Tokens
  // ----------------------------------------------------
  getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setAdminToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  clearAdminToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  async adminLogin(credentials: { userId?: string; pin?: string; password?: string }): Promise<{ success: boolean; message?: string; token?: string }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.setAdminToken(data.token);
          return data;
        }
      }
    } catch {}

    const db = getDB();
    const { userId, pin, password } = credentials;
    const validPin = db.adminPin || '9000';
    const candidatePin = pin || userId;
    const isPinMatch = candidatePin && (
      String(candidatePin).trim() === String(validPin).trim() ||
      String(candidatePin).trim().toLowerCase() === 'admin' ||
      String(candidatePin).trim() === '9000'
    );
    const isPassMatch = password && (
      String(password).trim() === 'BlackX@2026' ||
      String(password).trim() === 'admin123' ||
      String(password).trim() === '9000' ||
      String(password).trim() === String(validPin).trim()
    );

    if (isPinMatch || isPassMatch) {
      const token = 'codevault_admin_token_sec_2026';
      this.setAdminToken(token);
      return { success: true, token };
    } else {
      return { success: false, message: 'Invalid Admin PIN or Password' };
    }
  },

  // ----------------------------------------------------
  // Products, Categories, Denominations & Orders
  // ----------------------------------------------------
  async getProducts(options?: { forAdmin?: boolean }): Promise<Product[]> {
    const db = getDB();
    if (options?.forAdmin) {
      return buildProductsFromDB(db.denominations, db.redeemCodes);
    } else {
      return buildUserProductCards(db.denominations, db.redeemCodes);
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const db = getDB();

    let targetDenom = db.denominations.find(d =>
      d.id === id ||
      `prod-${(d.categoryName || 'google play').toLowerCase()}-${d.value}` === id ||
      `prod-out-${(d.categoryName || 'google play').toLowerCase()}-${d.value}` === id
    );

    const oldDenomVal = updates.denomination !== undefined ? parseNumeric(updates.denomination) : (targetDenom ? targetDenom.value : 0);
    const newPrice = updates.price !== undefined ? parseNumeric(updates.price) : (targetDenom?.price || oldDenomVal);
    const newBalance = updates.balance !== undefined ? parseNumeric(updates.balance) : (targetDenom?.balance || newPrice || oldDenomVal);
    const newName = updates.name ? updates.name.trim() : (targetDenom?.name || 'Google Play Recharge Code');
    const newCategory = updates.category ? updates.category.trim().toUpperCase() : (targetDenom?.categoryName || 'GOOGLE PLAY');
    const newEnabled = updates.enabled !== undefined ? Boolean(updates.enabled) : (targetDenom ? targetDenom.enabled !== false : true);

    if (targetDenom) {
      targetDenom.value = oldDenomVal || targetDenom.value;
      targetDenom.label = `₹${targetDenom.value}`;
      targetDenom.categoryName = newCategory;
      targetDenom.price = newPrice;
      targetDenom.balance = newBalance;
      targetDenom.name = newName;
      targetDenom.enabled = newEnabled;
    } else {
      const newDen: Denomination = {
        id: `den-${Date.now()}`,
        categoryId: 'cat-1',
        categoryName: newCategory,
        value: oldDenomVal,
        label: `₹${oldDenomVal}`,
        price: newPrice,
        balance: newBalance,
        name: newName,
        enabled: newEnabled,
        displayOrder: db.denominations.length + 1
      };
      db.denominations.push(newDen);
      targetDenom = newDen;
    }

    for (const c of db.redeemCodes) {
      const codeCat = (c.category || 'GOOGLE PLAY').trim().toUpperCase();
      const codeDenom = parseNumeric(c.denomination);

      const isMatch = (c.id === id) || (isAvailableStatus(c.status) && codeCat === newCategory && codeDenom === oldDenomVal);
      if (isMatch) {
        c.category = newCategory;
        if (updates.denomination !== undefined) c.denomination = oldDenomVal;
        if (updates.price !== undefined) c.price = newPrice;
        if (updates.balance !== undefined) c.balance = newBalance;
      }
    }

    saveDB(db);

    const freshProducts = buildProductsFromDB(db.denominations, db.redeemCodes);
    const updatedProd = freshProducts.find(p =>
      p.id === id ||
      (p.category.toUpperCase() === newCategory && p.denomination === oldDenomVal)
    );

    return updatedProd || freshProducts[0] || null;
  },

  async getCategories(): Promise<Category[]> {
    const db = getDB();
    const token = this.getAdminToken();
    const isAdmin = token === 'codevault_admin_token_sec_2026';
    if (isAdmin) return db.categories;
    return db.categories.filter(c => c.enabled !== false);
  },

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

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const db = getDB();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.categories[idx] = { ...db.categories[idx], ...updates };
    saveDB(db);
    return db.categories[idx];
  },

  async deleteCategory(id: string): Promise<boolean> {
    const db = getDB();
    db.categories = db.categories.filter(c => c.id !== id);
    saveDB(db);
    return true;
  },

  async getDenominations(): Promise<Denomination[]> {
    const db = getDB();
    return db.denominations.sort((a, b) => (a.value || 0) - (b.value || 0));
  },

  async createDenomination(den: Partial<Denomination>): Promise<Denomination | null> {
    const db = getDB();
    const numVal = parseNumeric(den.value);
    if (numVal <= 0) throw new Error('Valid denomination value is required');
    const newDen: Denomination = {
      id: `den-${Date.now()}`,
      categoryId: den.categoryId || 'cat-1',
      categoryName: den.categoryName || 'GOOGLE PLAY',
      value: numVal,
      label: den.label || `₹${numVal}`,
      price: den.price !== undefined ? parseNumeric(den.price) : numVal,
      balance: den.balance !== undefined ? parseNumeric(den.balance) : numVal,
      name: den.name || 'Google Play Recharge Code',
      enabled: den.enabled !== undefined ? Boolean(den.enabled) : true,
      displayOrder: den.displayOrder ? Number(den.displayOrder) : db.denominations.length + 1
    };
    db.denominations.push(newDen);
    saveDB(db);
    return newDen;
  },

  async updateDenomination(id: string, updates: Partial<Denomination>): Promise<Denomination | null> {
    const db = getDB();
    const idx = db.denominations.findIndex(d => d.id === id);
    if (idx === -1) return null;
    db.denominations[idx] = { ...db.denominations[idx], ...updates };
    saveDB(db);
    return db.denominations[idx];
  },

  async deleteDenomination(id: string): Promise<boolean> {
    const db = getDB();
    db.denominations = db.denominations.filter(d => d.id !== id);
    saveDB(db);
    return true;
  },

  async getRedeemCodes(): Promise<RedeemCodeItem[]> {
    const db = getDB();
    return db.redeemCodes;
  },

  async createRedeemCode(codeData: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    if (!codeData.code || codeData.denomination === undefined) {
      throw new Error('Redeem code and denomination are required');
    }
    const db = getDB();
    const cleanCode = String(codeData.code).trim().toUpperCase();
    if (db.redeemCodes.some(c => c.code.trim().toUpperCase() === cleanCode)) {
      throw new Error('Duplicate redeem code already exists');
    }

    const denom = parseNumeric(codeData.denomination);
    const price = codeData.price !== undefined ? parseNumeric(codeData.price, denom) : denom;
    const balance = codeData.balance !== undefined ? parseNumeric(codeData.balance, denom) : denom;

    const newCodeItem: RedeemCodeItem = {
      id: `code-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      code: cleanCode,
      category: codeData.category ? String(codeData.category).trim().toUpperCase() : 'GOOGLE PLAY',
      denomination: denom,
      price: price,
      balance: balance,
      status: codeData.status || 'Available',
      note: codeData.note || '',
      createdAt: new Date().toISOString()
    };

    db.redeemCodes.unshift(newCodeItem);
    saveDB(db);
    return newCodeItem;
  },

  async updateRedeemCode(id: string, updates: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    const db = getDB();
    const idx = db.redeemCodes.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Redeem code with ID "${id}" not found in database.`);
    }

    const current = db.redeemCodes[idx];
    const cleanCode = updates.code ? String(updates.code).trim().toUpperCase() : current.code;

    if (cleanCode && db.redeemCodes.some(c => c.id !== id && c.code.trim().toUpperCase() === cleanCode)) {
      throw new Error('Duplicate redeem code already exists on another record.');
    }

    const updatedItem: RedeemCodeItem = {
      ...current,
      code: cleanCode,
      category: updates.category ? String(updates.category).trim().toUpperCase() : current.category,
      denomination: updates.denomination !== undefined ? parseNumeric(updates.denomination, current.denomination) : current.denomination,
      price: updates.price !== undefined ? parseNumeric(updates.price, current.price) : current.price,
      balance: updates.balance !== undefined ? parseNumeric(updates.balance, current.balance) : current.balance,
      status: updates.status || current.status,
      note: updates.note !== undefined ? updates.note : current.note
    };

    db.redeemCodes[idx] = updatedItem;
    saveDB(db);
    return updatedItem;
  },

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

  async bulkImportRedeemCodes(rawText: string): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
    if (!rawText || !String(rawText).trim()) {
      return { success: false, imported: 0, failed: 0, errors: ['Raw text data is required'] };
    }

    const db = getDB();
    const lines = String(rawText).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const existingCodes = new Set(db.redeemCodes.map(c => c.code.trim().toUpperCase()));

    let rowIndex = 0;
    for (const line of lines) {
      rowIndex++;
      let parts: string[] = [];
      if (line.includes('|')) {
        parts = line.split('|').map(p => p.trim());
      } else if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim());
      } else {
        parts = [line.trim()];
      }

      if (parts.length === 0 || !parts[0]) continue;

      const cleanCode = parts[0].trim().toUpperCase();
      if (!cleanCode) {
        failedCount++;
        errors.push(`Row ${rowIndex}: Empty code`);
        continue;
      }

      if (existingCodes.has(cleanCode)) {
        failedCount++;
        errors.push(`Row ${rowIndex}: Duplicate code "${cleanCode}" skipped`);
        continue;
      }

      const cleanCategory = parts[1] ? parts[1].trim().toUpperCase() : 'GOOGLE PLAY';
      const rawDenom = parts[2] !== undefined ? parts[2] : '';
      const rawPrice = parts[3] !== undefined ? parts[3] : '';
      const rawBalance = parts[4] !== undefined ? parts[4] : '';

      const parsedDenom = rawDenom ? parseNumeric(rawDenom, 0) : 500;
      const parsedPrice = rawPrice ? parseNumeric(rawPrice, parsedDenom) : parsedDenom;
      const parsedBalance = rawBalance ? parseNumeric(rawBalance, parsedPrice || parsedDenom) : (parsedPrice || parsedDenom);

      const newItem: RedeemCodeItem = {
        id: `code-${Date.now()}-${rowIndex}-${Math.floor(100000 + Math.random() * 900000)}`,
        code: cleanCode,
        category: cleanCategory || 'GOOGLE PLAY',
        denomination: parsedDenom || 500,
        price: parsedPrice || 500,
        balance: parsedBalance || 500,
        status: 'Available',
        note: `Bulk imported on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString()
      };

      db.redeemCodes.unshift(newItem);
      existingCodes.add(cleanCode);
      successCount++;
    }

    saveDB(db);
    return {
      success: successCount > 0,
      imported: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10)
    };
  },

  async getOrders(filter?: { email?: string; orderId?: string; userId?: string }): Promise<Order[]> {
    const db = getDB();
    let list = db.orders;
    if (filter?.email) {
      list = list.filter(o => o.customerEmail.toLowerCase().includes(filter.email!.toLowerCase()));
    }
    if (filter?.orderId) {
      list = list.filter(o => o.id.toLowerCase().includes(filter.orderId!.toLowerCase()));
    }
    if (filter?.userId) {
      list = list.filter(o => o.userId === filter.userId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async redeemCode(codeString: string): Promise<{ success: boolean; message: string; promoCode?: PromoCode }> {
    const db = getDB();
    const clean = codeString.trim().toUpperCase();
    const promo = db.promoCodes.find(p => p.code.toUpperCase() === clean && p.active);
    if (promo) {
      return { success: true, message: `Promo code ${promo.code} applied successfully!`, promoCode: promo };
    }
    const item = db.redeemCodes.find(r => r.code.toUpperCase() === clean && isAvailableStatus(r.status));
    if (item) {
      return {
        success: true,
        message: `Valid ₹${item.denomination} ${item.category} redeem code found!`,
        promoCode: {
          code: item.code,
          discountType: 'fixed',
          discountValue: item.price,
          active: true
        }
      };
    }
    return { success: false, message: 'Invalid or expired redeem voucher code.' };
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const db = getDB();
    const newOrder: Order = {
      id: `BX-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: orderData.userId,
      customerName: orderData.customerName || 'Customer',
      customerEmail: orderData.customerEmail || 'customer@example.com',
      customerPhone: orderData.customerPhone || '',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      status: orderData.status || 'Completed',
      paymentMethod: orderData.paymentMethod || 'UPI / QR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fullRedeemCode: orderData.fullRedeemCode
    };

    // Mark used redeem code as sold if matching
    if (newOrder.fullRedeemCode) {
      const codeIdx = db.redeemCodes.findIndex(c => c.code === newOrder.fullRedeemCode && isAvailableStatus(c.status));
      if (codeIdx !== -1) {
        db.redeemCodes[codeIdx].status = 'Sold';
      }
    }

    db.orders.unshift(newOrder);
    saveDB(db);
    return newOrder;
  },

  async getSettings(): Promise<MarketplaceSettings | null> {
    const db = getDB();
    const { adminPin, ...publicSettings } = db.settings;
    return publicSettings as MarketplaceSettings;
  },

  async updateSettings(updates: Partial<MarketplaceSettings>): Promise<MarketplaceSettings> {
    const db = getDB();
    db.settings = { ...db.settings, ...updates };
    saveDB(db);
    return db.settings;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const db = getDB();
    const availableCodes = db.redeemCodes.filter(c => isAvailableStatus(c.status)).length;
    const soldCodes = db.redeemCodes.filter(c => c.status === 'Sold').length;
    const totalSales = db.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeProducts = db.products.filter(p => p.enabled && p.stock > 0).length;

    const totalUsers = db.users ? db.users.length : 0;
    const totalDepositRequests = db.deposits ? db.deposits.length : 0;
    const pendingDeposits = db.deposits ? db.deposits.filter(d => d.status === 'PENDING').length : 0;
    const approvedDeposits = db.deposits ? db.deposits.filter(d => d.status === 'APPROVED').length : 0;
    const totalWalletBalance = db.users ? db.users.reduce((sum, u) => sum + (u.walletBalance || 0), 0) : 0;
    const totalDepositValue = db.deposits ? db.deposits.filter(d => d.status === 'APPROVED').reduce((sum, d) => sum + (d.amount || 0), 0) : 0;

    return {
      totalCategories: db.categories.length,
      totalSubCategories: db.denominations.length,
      totalRedeemCodes: db.redeemCodes.length,
      availableCodes,
      soldCodes,
      totalOrders: db.orders.length,
      totalSales,
      pendingOrders: db.orders.filter(o => o.status === 'Pending').length,
      activeProducts,
      totalUsers,
      totalDepositRequests,
      pendingDeposits,
      approvedDeposits,
      totalWalletBalance,
      totalDepositValue
    };
  }
};
