// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://amigos-backend-ga2t.onrender.com/api';

interface LoginResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  token: string;
  message: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async loginSuperAdmin(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login-super-admin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async registerSuperAdmin(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/register-super-admin', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Dashboard API methods
  async getDashboardStats(): Promise<{
    todayOrders: number;
    activeClients: number;
    activeDeliverers: number;
    todayRevenue: string;
  }> {
    return this.request('/dashboard/stats');
  }

  async getRecentOrders(): Promise<Array<{
    id: string;
    client: string;
    total: string;
    status: "pending" | "confirmed" | "preparing" | "in_delivery" | "delivered" | "cancelled";
    time: string;
  }>> {
    return this.request('/dashboard/recent-orders');
  }

  async getActiveDeliverers(): Promise<Array<{
    id: string;
    name: string;
    orders: number;
    status: string;
  }>> {
    return this.request('/dashboard/active-deliverers');
  }

  // Authentication methods
  async logoutSuperAdmin(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Client management methods
  async getClients(search?: string, page?: number, limit?: number): Promise<{
    clients: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      totalOrders: number;
      totalSpent: string;
      status: "active" | "inactive";
      joinDate: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalClients: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    // Add cache-busting timestamp
    params.append('_t', Date.now().toString());

    return this.request(`/clients?${params}`);
  }

  async getClientById(id: string): Promise<{
    id: string;
    name: string;
    phone: string;
    email: string;
    status: "active" | "inactive";
    joinDate: string;
    address: string;
    totalOrders: number;
    totalSpent: string;
  }> {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData: {
    name: string;
    phone: string;
    email: string;
    address?: string;
  }): Promise<{
    message: string;
    client: {
      id: string;
      name: string;
      phone: string;
      email: string;
      totalOrders: number;
      totalSpent: string;
      status: "active" | "inactive";
      joinDate: string;
    };
  }> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClientStatus(id: string, status: "active" | "inactive"): Promise<{
    message: string;
    client: {
      id: string;
      status: "active" | "inactive";
    };
  }> {
    return this.request(`/clients/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteClient(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Deliverer management methods
  async getDeliverers(search?: string, page?: number, limit?: number): Promise<{
    deliverers: Array<{
      id: string;
      name: string;
      phone: string;
      vehicle: string;
      currentOrders: number;
      totalDeliveries: number;
      rating: number;
      isActive: boolean;
      location: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    // Add cache-busting timestamp
    params.append('_t', Date.now().toString());

    return this.request(`/deliverers?${params}`);
  }

  async getDelivererById(id: string): Promise<{
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    currentOrders: number;
    totalDeliveries: number;
    rating: number;
    isActive: boolean;
    location: string;
  }> {
    return this.request(`/deliverers/${id}`);
  }

  async createDeliverer(delivererData: {
    name: string;
    phone: string;
    vehicle: string;
    location: string;
  }): Promise<{
    message: string;
    deliverer: {
      id: string;
      name: string;
      phone: string;
      vehicle: string;
      currentOrders: number;
      totalDeliveries: number;
      rating: number;
      isActive: boolean;
      location: string;
    };
  }> {
    return this.request('/deliverers', {
      method: 'POST',
      body: JSON.stringify(delivererData),
    });
  }

  async updateDelivererStatus(id: string, isAvailable: boolean): Promise<{
    message: string;
    deliverer: {
      id: string;
      isActive: boolean;
    };
  }> {
    return this.request(`/deliverers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isAvailable }),
    });
  }

  async deleteDeliverer(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/deliverers/${id}`, {
      method: 'DELETE',
    });
  }

  // Provider management methods
  async getProviders(type?: string, search?: string): Promise<{
    providers: Array<{
      id: string;
      name: string;
      type: "restaurant" | "course" | "pharmacy";
      category: string;
      phone: string;
      address: string;
      totalOrders: number;
      rating: number;
      status: "active" | "inactive";
    }>;
  }> {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (search) params.append('search', search);

    // Add cache-busting timestamp to prevent 304 responses
    params.append('_t', Date.now().toString());

    try {
      const response = await this.request<any>(`/providers?${params}`);
      // Ensure we return the expected structure even if API returns different format
      return {
        providers: Array.isArray(response?.providers) ? response.providers : []
      };
    } catch (error) {
      console.error('Error in getProviders:', error);
      // Return empty structure on error to prevent crashes
      return { providers: [] };
    }
  }

  async getProviderById(id: string): Promise<{
    provider: any;
    menu: any[];
  }> {
    return this.request(`/providers/${id}`);
  }

  async createProvider(providerData: {
    name: string;
    type: "restaurant" | "course" | "pharmacy";
    phone: string;
    address: string;
    email?: string;
    description?: string;
  }): Promise<{
    message: string;
    provider: {
      id: string;
      name: string;
      type: "restaurant" | "course" | "pharmacy";
      category: string;
      phone: string;
      address: string;
      totalOrders: number;
      rating: number;
      status: "active" | "inactive";
    };
  }> {
    return this.request('/providers', {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
  }

  async updateProviderStatus(id: string, status: "active" | "inactive"): Promise<{
    message: string;
    provider: {
      id: string;
      status: "active" | "inactive";
    };
  }> {
    return this.request(`/providers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteProvider(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/providers/${id}`, {
      method: 'DELETE',
    });
  }

  async searchProviders(query: string): Promise<{
    providers: any[];
    products: any[];
  }> {
    return this.request(`/providers/search?q=${encodeURIComponent(query)}`);
  }

  // Product management methods
  async getProducts(search?: string, category?: string, page?: number, limit?: number): Promise<{
    products: Array<{
      id: string;
      name: string;
      category: string;
      provider: string;
      price: number;
      stock: number;
      status: "available" | "out_of_stock" | "discontinued";
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'all') params.append('category', category);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    // Add cache-busting timestamp
    params.append('_t', Date.now().toString());

    return this.request(`/products?${params}`);
  }

  async getProductById(id: string): Promise<{
    id: string;
    name: string;
    description?: string;
    category: string;
    provider: string;
    price: number;
    stock: number;
    status: "available" | "out_of_stock" | "discontinued";
    image?: string;
  }> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    stock?: number;
    status?: "available" | "out_of_stock" | "discontinued";
    providerId: string;
    image?: string;
  }): Promise<{
    message: string;
    product: {
      id: string;
      name: string;
      category: string;
      provider: string;
      price: number;
      stock: number;
      status: "available" | "out_of_stock" | "discontinued";
      image?: string;
    };
  }> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    stock?: number;
    status?: "available" | "out_of_stock" | "discontinued";
    image?: string;
  }): Promise<{
    message: string;
    product: {
      id: string;
      name: string;
      category: string;
      provider: string;
      price: number;
      stock: number;
      status: "available" | "out_of_stock" | "discontinued";
      image?: string;
    };
  }> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductsByProvider(providerId: string): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    stock: number;
    status: "available" | "out_of_stock" | "discontinued";
  }>> {
    return this.request(`/products/provider/${providerId}`);
  }

  // Analytics methods
  async getAnalyticsOverview(period?: string): Promise<{
    overview: {
      totalClients: number;
      totalProviders: number;
      totalProducts: number;
      totalDeliverers: number;
      activeClients: number;
      period: string;
    };
    charts: {
      ordersData: Array<{ _id: string; count: number; revenue: number }>;
      clientGrowth: Array<{ _id: string; clients: number; deliverers: number; providers: number }>;
      dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
    };
    insights: {
      topProviders: Array<{ name: string; type: string; totalOrders: number; totalRevenue: number }>;
      popularProducts: Array<{ name: string; category: string; totalQuantity: number; totalRevenue: number }>;
      providerTypes: Array<{ _id: string; count: number }>;
      productCategories: Array<{ _id: string; count: number }>;
    };
  }> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/analytics/overview${params}`);
  }

  async getRevenueAnalytics(period?: string): Promise<{
    totalRevenue: { total: number; average: number; count: number };
    revenueByProviderType: Array<{ _id: string; totalRevenue: number; orderCount: number }>;
    monthlyRevenue: Array<{ _id: { year: number; month: number }; revenue: number; orders: number }>;
    period: string;
  }> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/analytics/revenue${params}`);
  }

  async getUserAnalytics(period?: string): Promise<{
    userRegistrations: Array<{ _id: string; clients: number; deliverers: number; providers: number }>;
    userStatusDistribution: Array<{ _id: { role: string; status: string }; count: number }>;
    userActivity: {
      activeClients?: { count: number }[];
      inactiveClients?: { count: number }[];
      activeDeliverers?: { count: number }[];
      inactiveDeliverers?: { count: number }[];
    };
    period: string;
  }> {
    const params = period ? `?period=${period}` : '';
    return this.request(`/analytics/users${params}`);
  }

  async getProductAnalytics(): Promise<{
    productStatusDistribution: Array<{ _id: string; count: number }>;
    productsByCategory: Array<{ _id: string; count: number; averagePrice: number }>;
    lowStockProducts: Array<{ id: string; name: string; stock: number; provider: string }>;
    outOfStockProducts: Array<{ id: string; name: string; stock: number; provider: string }>;
    topSellingProducts: Array<{ name: string; category: string; totalQuantity: number; totalRevenue: number }>;
  }> {
    return this.request('/analytics/products');
  }

  // Settings methods
  async getProfile(userId?: string): Promise<{
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      role: string;
      status: string;
    };
  }> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`/settings/profile${params}`);
  }

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    userId?: string;
  }): Promise<{
    message: string;
    profile: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      role: string;
      status: string;
    };
  }> {
    return this.request('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    userId?: string;
  }): Promise<{
    message: string;
  }> {
    return this.request('/settings/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getAppSettings(): Promise<{
    settings: {
      businessName: string;
      businessDescription: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
      workingHours: string;
      currency: string;
      language: string;
      timezone: string;
    };
  }> {
    return this.request('/settings/app');
  }

  async updateAppSettings(settingsData: {
    businessName?: string;
    businessDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    workingHours?: string;
    currency?: string;
    language?: string;
    timezone?: string;
  }): Promise<{
    message: string;
    settings: {
      businessName: string;
      businessDescription: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
      workingHours: string;
      currency: string;
      language: string;
      timezone: string;
    };
  }> {
    return this.request('/settings/app', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async getNotificationSettings(): Promise<{
    settings: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      orderNotifications: boolean;
      systemAlerts: boolean;
      smsNotifications: boolean;
      marketingEmails: boolean;
    };
  }> {
    return this.request('/settings/notifications');
  }

  async updateNotificationSettings(settingsData: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    orderNotifications?: boolean;
    systemAlerts?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
  }): Promise<{
    message: string;
    settings: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      orderNotifications: boolean;
      systemAlerts: boolean;
      smsNotifications: boolean;
      marketingEmails: boolean;
    };
  }> {
    return this.request('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async getSecuritySettings(): Promise<{
    settings: {
      twoFactorEnabled: boolean;
      sessionTimeout: number;
      passwordExpiry: number;
      loginAlerts: boolean;
      suspiciousActivityAlerts: boolean;
    };
  }> {
    return this.request('/settings/security');
  }

  async updateSecuritySettings(settingsData: {
    twoFactorEnabled?: boolean;
    sessionTimeout?: number;
    passwordExpiry?: number;
    loginAlerts?: boolean;
    suspiciousActivityAlerts?: boolean;
  }): Promise<{
    message: string;
    settings: {
      twoFactorEnabled: boolean;
      sessionTimeout: number;
      passwordExpiry: number;
      loginAlerts: boolean;
      suspiciousActivityAlerts: boolean;
    };
  }> {
    return this.request('/settings/security', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Test connection to backend
  async testConnection(): Promise<{ message: string; database: any; wasender: any }> {
    return this.request('/auth/test');
  }
}

export const apiService = new ApiService();
export type { LoginResponse, LoginRequest };