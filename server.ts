import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers for cross-origin requests between AI Studio Preview and Live Website
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, Cache-Control, Pragma');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Default Initial Database State
function getInitialDB() {
  return {
    categories: [
      { id: 'cat-1', name: 'GOOGLE PLAY', iconUrl: 'https://cdn-icons-png.flaticon.com/512/888/888857.png', enabled: true, displayOrder: 1 },
      { id: 'cat-2', name: 'APPLE ITUNES', iconUrl: 'https://cdn-icons-png.flaticon.com/512/888/888841.png', enabled: true, displayOrder: 2 },
      { id: 'cat-3', name: 'STEAM WALLET', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5969/5969018.png', enabled: true, displayOrder: 3 },
      { id: 'cat-4', name: 'AMAZON PAY', iconUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968144.png', enabled: true, displayOrder: 4 },
      { id: 'cat-5', name: 'FREE FIRE MAX', iconUrl: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png', enabled: true, displayOrder: 5 }
    ],
    denominations: [
      { id: 'den-1', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 120, label: '₹120', price: 120, balance: 1800, name: 'Google Play Recharge Code', enabled: true, displayOrder: 1 },
      { id: 'den-2', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 150, label: '₹150', price: 150, balance: 2500, name: 'Google Play Recharge Code', enabled: true, displayOrder: 2 },
      { id: 'den-3', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 200, label: '₹200', price: 200, balance: 3000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 3 },
      { id: 'den-4', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 300, label: '₹300', price: 300, balance: 4500, name: 'Google Play Recharge Code', enabled: true, displayOrder: 4 },
      { id: 'den-5', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 350, label: '₹350', price: 6000, balance: 6000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 5 },
      { id: 'den-6', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 500, label: '₹500', price: 450, balance: 500, name: 'Google Play Recharge Code', enabled: true, displayOrder: 6 },
      { id: 'den-7', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 700, label: '₹700', price: 700, balance: 700, name: 'Google Play Recharge Code', enabled: true, displayOrder: 7 },
      { id: 'den-8', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 900, label: '₹900', price: 900, balance: 900, name: 'Google Play Recharge Code', enabled: true, displayOrder: 8 },
      { id: 'den-9', categoryId: 'cat-1', categoryName: 'GOOGLE PLAY', value: 1000, label: '₹1000', price: 920, balance: 1000, name: 'Google Play Recharge Code', enabled: true, displayOrder: 9 }
    ],
    redeemCodes: [
      { id: 'code-101', code: 'GPRC-9012-8K4P-29X7', category: 'GOOGLE PLAY', denomination: 500, price: 450, balance: 500, status: 'Available', note: 'Standard stock batch #1', createdAt: new Date().toISOString() },
      { id: 'code-102', code: 'GPRC-7741-3L9M-58K2', category: 'GOOGLE PLAY', denomination: 1000, price: 920, balance: 1000, status: 'Available', note: 'Standard stock batch #1', createdAt: new Date().toISOString() },
      { id: 'code-103', code: 'GPRC-4421-9X8V-11P0', category: 'GOOGLE PLAY', denomination: 200, price: 3000, balance: 3000, status: 'Available', note: 'Special edition', createdAt: new Date().toISOString() },
      { id: 'code-104', code: 'GPRC-6632-1B5K-88M9', category: 'GOOGLE PLAY', denomination: 350, price: 6000, balance: 6000, status: 'Available', note: 'Special promo batch', createdAt: new Date().toISOString() }
    ],
    products: [],
    orders: [],
    promoCodes: [
      { code: 'VAULT10', discountType: 'percentage', discountValue: 10, active: true },
      { code: 'SAVE50', discountType: 'fixed', discountValue: 50, active: true }
    ],
    settings: {
      title: 'Code Vault - Premium Prepaid Cards',
      description: 'The Most Trusted Instant Digital Codes & Prepaid Marketplace',
      currency: 'INR',
      maintenanceMode: false,
      defaultAvailability: true,
      defaultUpiId: 'codevault.pay@okaxis',
      defaultUpiName: 'CodeVault Official Payment',
      logoUrl: ''
    },
    adminPin: '9000',
    users: [
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
    ],
    depositAmounts: [
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
    ],
    deposits: [
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
    ],
    transactions: [
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
    ]
  };
}

// Database helper
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB file, using fallback', err);
  }
  const init = getInitialDB();
  writeDB(init);
  return init;
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file', err);
  }
}

// Ensure DB file exists
readDB();

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Auth: Google User Login / Profile Create
app.post('/api/auth/google', (req, res) => {
  try {
    const { googleId, name, email, profileImage } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const db = readDB();
    let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create new user account
      user = {
        id: `usr_google_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        googleId: googleId || `gid_${Date.now()}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        walletBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        totalDeposits: 0
      };
      db.users.push(user);
      writeDB(db);
    } else {
      // Update info if provided
      if (name) user.name = name;
      if (profileImage) user.profileImage = profileImage;
      if (googleId) user.googleId = googleId;
      writeDB(db);
    }

    const token = `usr_session_${user.id}_${Date.now()}`;
    res.json({ success: true, user, token });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. User Wallet Balance & Transactions
app.get('/api/wallet/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = readDB();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userTransactions = db.transactions
      .filter((t: any) => t.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const userDeposits = db.deposits
      .filter((d: any) => d.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      balance: user.walletBalance || 0,
      user,
      transactions: userTransactions,
      deposits: userDeposits
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Deposit Amounts Configuration (Public & Admin)
app.get('/api/deposit-amounts', (req, res) => {
  try {
    const db = readDB();
    const amounts = (db.depositAmounts || []).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json({ success: true, amounts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/deposit-amounts', (req, res) => {
  try {
    const { amount, qrUrl, upiId, receiverName, enabled, displayOrder } = req.body;
    if (!amount || !qrUrl) {
      return res.status(400).json({ success: false, message: 'Amount and QR URL are required' });
    }
    const db = readDB();
    const newAmount = {
      id: `dep_amt_${amount}_${Date.now()}`,
      amount: Number(amount),
      qrUrl: String(qrUrl).trim(),
      upiId: upiId ? String(upiId).trim() : (db.settings.defaultUpiId || 'codevault.pay@okaxis'),
      receiverName: receiverName ? String(receiverName).trim() : `CodeVault Official (₹${amount})`,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : db.depositAmounts.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.depositAmounts.push(newAmount);
    writeDB(db);
    res.json({ success: true, amount: newAmount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/deposit-amounts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = readDB();
    const idx = db.depositAmounts.findIndex((a: any) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Deposit amount configuration not found' });
    }
    db.depositAmounts[idx] = {
      ...db.depositAmounts[idx],
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : db.depositAmounts[idx].amount,
      updatedAt: new Date().toISOString()
    };
    writeDB(db);
    res.json({ success: true, amount: db.depositAmounts[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/deposit-amounts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    db.depositAmounts = db.depositAmounts.filter((a: any) => a.id !== id);
    writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Deposit Requests (Submit "I HAVE PAID", Fetch, Approve, Reject)
app.post('/api/deposits/create', (req, res) => {
  try {
    const { userId, amount, depositAmountId, paymentSessionId, utrNumber, screenshotUrl } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: 'User ID and Amount are required' });
    }
    const db = readDB();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newDeposit = {
      id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userProfileImage: user.profileImage,
      amount: Number(amount),
      depositAmountId: depositAmountId || '',
      paymentSessionId: paymentSessionId || `sess_${Date.now()}`,
      utrNumber: utrNumber ? String(utrNumber).trim() : '',
      screenshotUrl: screenshotUrl || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString() // 5 minutes
    };

    db.deposits.unshift(newDeposit);
    writeDB(db);
    res.json({ success: true, deposit: newDeposit });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/deposits', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, deposits: db.deposits || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/deposits/approve/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    const db = readDB();
    const deposit = db.deposits.find((d: any) => d.id === id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Deposit is already approved' });
    }

    const user = db.users.find((u: any) => u.id === deposit.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user not found' });
    }

    const balanceBefore = user.walletBalance || 0;
    const amount = Number(deposit.amount);
    const balanceAfter = balanceBefore + amount;

    // Credit user's wallet
    user.walletBalance = balanceAfter;
    user.totalDeposits = (user.totalDeposits || 0) + amount;

    // Update deposit status
    deposit.status = 'APPROVED';
    deposit.approvedAt = new Date().toISOString();
    deposit.approvedBy = approvedBy || 'Admin';

    // Log wallet transaction
    const transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      type: 'Deposit',
      amount: amount,
      balanceBefore,
      balanceAfter,
      referenceId: deposit.id,
      description: `Wallet Deposit (Approved by ${deposit.approvedBy})`,
      status: 'Approved',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(transaction);

    writeDB(db);
    res.json({ success: true, deposit, user, transaction });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/deposits/reject/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const db = readDB();
    const deposit = db.deposits.find((d: any) => d.id === id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found' });
    }

    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved deposit' });
    }

    deposit.status = 'REJECTED';
    deposit.rejectedAt = new Date().toISOString();
    deposit.notes = notes || 'Rejected by Admin';

    writeDB(db);
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Admin User Management & Stats
app.get('/api/admin/users', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, users: db.users || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users/:userId/adjust-wallet', (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, reason } = req.body; // type: 'credit' | 'debit'
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount)) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const db = readDB();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const balanceBefore = user.walletBalance || 0;
    const delta = type === 'debit' ? -Math.abs(numAmount) : Math.abs(numAmount);
    const balanceAfter = Math.max(0, balanceBefore + delta);

    user.walletBalance = balanceAfter;
    if (delta > 0) {
      user.totalDeposits = (user.totalDeposits || 0) + delta;
    }

    const transaction = {
      id: `TXN-ADJ-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      type: 'Admin_Adjustment',
      amount: delta,
      balanceBefore,
      balanceAfter,
      referenceId: `ADJ-${Date.now()}`,
      description: reason || `Admin manual adjustment (${type})`,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    db.transactions.unshift(transaction);

    writeDB(db);
    res.json({ success: true, user, transaction });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Pay with Wallet
app.post('/api/wallet/pay', (req, res) => {
  try {
    const { userId, amount, orderId, description } = req.body;
    const numAmount = Number(amount);
    const db = readDB();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.walletBalance || 0) < numAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore - numAmount;
    user.walletBalance = balanceAfter;

    const transaction = {
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
    db.transactions.unshift(transaction);

    writeDB(db);
    res.json({ success: true, balance: balanceAfter, transaction });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Orders Management API
app.get('/api/orders', (req, res) => {
  try {
    const { userId, email, orderId } = req.query;
    const db = readDB();
    let orders = db.orders || [];
    if (userId) {
      orders = orders.filter((o: any) => o.userId === userId);
    } else if (email) {
      const em = String(email).toLowerCase();
      orders = orders.filter((o: any) => o.customerEmail?.toLowerCase() === em);
    } else if (orderId) {
      const oid = String(orderId).toLowerCase();
      orders = orders.filter((o: any) => o.id?.toLowerCase().includes(oid));
    }
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const db = readDB();
    if (!db.orders) db.orders = [];
    db.orders.unshift(orderData);
    writeDB(db);
    res.json({ success: true, order: orderData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Website Branding & Platform Settings API
app.get('/api/settings', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const db = readDB();
    const { adminPin, ...publicSettings } = db.settings || {};
    res.json({ success: true, settings: publicSettings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updates = req.body;
    const db = readDB();
    db.settings = { ...(db.settings || {}), ...updates };
    writeDB(db);
    const { adminPin, ...publicSettings } = db.settings;
    res.json({ success: true, settings: publicSettings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Admin Login Verification (PIN/Password)
app.post('/api/admin/login', (req, res) => {
  try {
    const { pin, password } = req.body;
    const db = readDB();
    const validPin = db.adminPin || '9000';
    const isPinMatch = pin && String(pin).trim() === String(validPin).trim();
    const isPassMatch = password && (
      String(password).trim() === 'BlackX@2026' ||
      String(password).trim() === 'admin123' ||
      String(password).trim() === '9000'
    );

    if (isPinMatch || isPassMatch) {
      const token = 'codevault_admin_token_sec_2026';
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Admin PIN or Password' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Full DB sync / get for client services
app.get('/api/db', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const db = readDB();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db', (req, res) => {
  try {
    const adminToken = req.headers['x-admin-token'] || req.headers.authorization || req.body?.adminToken;
    const isAuthorizedAdmin = adminToken === 'codevault_admin_token_sec_2026' || adminToken === 'Bearer codevault_admin_token_sec_2026';

    if (!isAuthorizedAdmin) {
      // Unauthenticated client attempting to post full DB overwrite -> read & return fresh DB instead
      const db = readDB();
      return res.status(200).json({ success: true, message: 'Read-only mode for non-admin client', db });
    }

    const existing = readDB();
    const newDb = req.body || {};
    if (!newDb.settings) newDb.settings = existing.settings || {};
    if (existing.settings?.logoUrl && newDb.settings.logoUrl === undefined) {
      newDb.settings.logoUrl = existing.settings.logoUrl;
    }
    writeDB(newDb);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// VITE DEV SERVER / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeVault Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
