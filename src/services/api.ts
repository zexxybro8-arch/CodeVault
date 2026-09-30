import { Product, Category, Denomination, RedeemCodeItem, Order, Customer, DashboardStats, PromoCode, OrderStatus, MarketplaceSettings } from '../types';

const ADMIN_TOKEN_KEY = 'blackx_admin_token';

export const api = {
  // Admin Token
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  setAdminToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  // Admin Auth Login (Authenticates credentials SAGAR551 / SAGAR551)
  async adminLogin(payload: { userId?: string; username?: string; password?: string; pin?: string } | string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const body = typeof payload === 'string' ? { pin: payload } : payload;
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setAdminToken(data.token);
      }
      return data;
    } catch (err) {
      console.error('Admin login error', err);
      return { success: false, message: 'Server connection failed' };
    }
  },

  // Fetch Products
  async getProducts(): Promise<Product[]> {
    try {
      const token = this.getAdminToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products', { headers });
      if (!res.ok) throw new Error('Failed to load products');
      return await res.json();
    } catch (err) {
      console.error('getProducts error', err);
      return [];
    }
  },

  // Get Categories
  async getCategories(): Promise<Category[]> {
    try {
      const token = this.getAdminToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/categories', { headers });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (err) {
      console.error('getCategories error', err);
      return [];
    }
  },

  // Create Category
  async createCategory(cat: Partial<Category>): Promise<Category | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(cat)
      });
      if (!res.ok) throw new Error('Failed to create category');
      return await res.json();
    } catch (err) {
      console.error('createCategory error', err);
      return null;
    }
  },

  // Update Category
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update category');
      return await res.json();
    } catch (err) {
      console.error('updateCategory error', err);
      return null;
    }
  },

  // Delete Category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok;
    } catch (err) {
      console.error('deleteCategory error', err);
      return false;
    }
  },

  // Get Denominations (Sub Categories)
  async getDenominations(): Promise<Denomination[]> {
    try {
      const token = this.getAdminToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/denominations', { headers });
      if (!res.ok) throw new Error('Failed to fetch denominations');
      return await res.json();
    } catch (err) {
      console.error('getDenominations error', err);
      return [];
    }
  },

  // Create Denomination
  async createDenomination(den: Partial<Denomination>): Promise<Denomination | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/denominations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(den)
      });
      if (!res.ok) throw new Error('Failed to create denomination');
      return await res.json();
    } catch (err) {
      console.error('createDenomination error', err);
      return null;
    }
  },

  // Update Denomination
  async updateDenomination(id: string, updates: Partial<Denomination>): Promise<Denomination | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/denominations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update denomination');
      return await res.json();
    } catch (err) {
      console.error('updateDenomination error', err);
      return null;
    }
  },

  // Delete Denomination
  async deleteDenomination(id: string): Promise<boolean> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/denominations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok;
    } catch (err) {
      console.error('deleteDenomination error', err);
      return false;
    }
  },

  // Get Redeem Codes (Admin)
  async getRedeemCodes(): Promise<RedeemCodeItem[]> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/redeem-codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch redeem codes');
      return await res.json();
    } catch (err) {
      console.error('getRedeemCodes error', err);
      return [];
    }
  },

  // Create Redeem Code
  async createRedeemCode(codeData: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/redeem-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(codeData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to create code');
      }
      return await res.json();
    } catch (err: any) {
      console.error('createRedeemCode error', err);
      throw err;
    }
  },

  // Update Redeem Code
  async updateRedeemCode(id: string, updates: Partial<RedeemCodeItem>): Promise<RedeemCodeItem | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/redeem-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update redeem code');
      return await res.json();
    } catch (err) {
      console.error('updateRedeemCode error', err);
      return null;
    }
  },

  // Delete Redeem Code
  async deleteRedeemCode(id: string): Promise<boolean> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/redeem-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok;
    } catch (err) {
      console.error('deleteRedeemCode error', err);
      return false;
    }
  },

  // Bulk Import Redeem Codes
  async bulkImportRedeemCodes(rawText: string): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/redeem-codes/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rawText })
      });
      return await res.json();
    } catch (err) {
      console.error('bulkImport error', err);
      return { success: false, imported: 0, failed: 0, errors: ['Network error'] };
    }
  },

  // Get Settings
  async getSettings(): Promise<MarketplaceSettings | null> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (err) {
      console.error('getSettings error', err);
      return null;
    }
  },

  // Update Settings
  async updateSettings(settings: Partial<MarketplaceSettings>): Promise<MarketplaceSettings | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return await res.json();
    } catch (err) {
      console.error('updateSettings error', err);
      return null;
    }
  },

  // Submit Order
  async createOrder(orderPayload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: { productId: string; productName: string; denomination?: number; price?: number }[];
    paymentMethod: string;
    promoCodeUsed?: string;
    discountAmount?: number;
  }): Promise<Order | null> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to process order');
      }
      return await res.json();
    } catch (err: any) {
      console.error('createOrder error', err);
      throw err;
    }
  },

  // Fetch Orders
  async getOrders(params?: { email?: string; orderId?: string }): Promise<Order[]> {
    try {
      const token = this.getAdminToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/orders';
      const queryParams = new URLSearchParams();
      if (params?.email) queryParams.append('email', params.email);
      if (params?.orderId) queryParams.append('orderId', params.orderId);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (err) {
      console.error('getOrders error', err);
      return [];
    }
  },

  // Update Order Status
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    try {
      const token = this.getAdminToken();
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return await res.json();
    } catch (err) {
      console.error('updateOrderStatus error', err);
      return null;
    }
  },

  // Get Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const token = this.getAdminToken();
      const res = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return await res.json();
    } catch (err) {
      console.error('getCustomers error', err);
      return [];
    }
  },

  // Get Stats
  async getDashboardStats(): Promise<DashboardStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return await res.json();
    } catch (err) {
      console.error('getDashboardStats error', err);
      return null;
    }
  },

  // Redeem Promo Code
  async redeemCode(code: string): Promise<{ success: boolean; promoCode?: PromoCode; message: string }> {
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      return await res.json();
    } catch (err) {
      console.error('redeemCode error', err);
      return { success: false, message: 'Failed to validate code' };
    }
  }
};
