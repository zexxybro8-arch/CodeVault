export type ProductCategory = string;

export interface Category {
  id: string;
  name: string;
  iconUrl?: string;
  enabled: boolean;
  displayOrder: number;
  count?: number;
}

export interface Denomination {
  id: string;
  categoryId: string;
  categoryName: string;
  value: number; // e.g. 500
  price?: number; // e.g. 450
  balance?: number; // e.g. 500
  name?: string; // e.g. "Google Play Recharge Code"
  label: string; // e.g. "₹500"
  enabled: boolean;
  displayOrder: number;
}

export type CodeStatus = 'Available' | 'Sold' | 'Disabled';

export interface RedeemCodeItem {
  id: string;
  code: string;
  category: string;
  denomination: number; // e.g. 500
  price: number; // e.g. 450
  balance: number; // e.g. 500
  status: CodeStatus;
  note?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string; // e.g. "Google Play Recharge Code"
  category: string;
  denomination?: number;
  price: number; // e.g. 450
  balance: number; // e.g. 500 (Actual redeem code balance value)
  maskedCode: string; // e.g. "•••• •••• 8K4P 29X7"
  fullCode?: string; // e.g. "GPRC-9012-8K4P-29X7"
  deliveryStatus: string; // e.g. "Instant"
  stock: number;
  description?: string;
  enabled: boolean;
  displayOrder?: number;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  denomination?: number;
  price: number;
  maskedCode: string;
}

export interface Order {
  id: string; // e.g. BX-89214
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  promoCodeUsed?: string;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  fullRedeemCode?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

// User Profile System
export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  profileImage: string;
  walletBalance: number;
  status: 'active' | 'suspended';
  createdAt: string;
  totalDeposits?: number;
}

export type CustomerSession = User;

// Deposit Amount & QR Configuration
export interface DepositAmount {
  id: string;
  amount: number;
  qrUrl: string;
  upiId?: string;
  receiverName?: string;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Deposit Requests
export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileImage?: string;
  amount: number;
  depositAmountId?: string;
  paymentSessionId: string;
  utrNumber?: string;
  screenshotUrl?: string;
  status: DepositStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  notes?: string;
}

// User Wallet Transactions
export type TransactionType = 'Deposit' | 'Purchase' | 'Refund' | 'Admin_Adjustment';
export type TransactionStatus = 'Approved' | 'Pending' | 'Rejected' | 'Completed';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface DashboardStats {
  totalCategories: number;
  totalSubCategories: number;
  totalRedeemCodes: number;
  availableCodes: number;
  soldCodes: number;
  totalOrders: number;
  totalSales: number;
  pendingOrders?: number;
  activeProducts?: number;
  // User & Wallet stats
  totalUsers: number;
  totalDepositRequests: number;
  pendingDeposits: number;
  approvedDeposits: number;
  totalWalletBalance: number;
  totalDepositValue: number;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
}

export interface MarketplaceSettings {
  title: string;
  description: string;
  currency: string;
  maintenanceMode: boolean;
  defaultAvailability: boolean;
  adminPin?: string;
  defaultUpiId?: string;
  defaultUpiName?: string;
  logoUrl?: string;
}
