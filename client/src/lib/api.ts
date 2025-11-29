// API Configuration
//const API_BASE_URL ='https://amigosdelivery25.com/api';
const API_BASE_URL ='http://192.168.1.104:5000/api';

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

export interface OptionGroup {
  _id: string;
  name: string;
  description?: string;
  min?: number;
  max?: number;
  options: Array<{
    _id: string;
    option: string;
    name: string;
    price: number;
    image?: string;
  }>;
  image?: string;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  image?: string;
  availability?: boolean;
  optionGroups?: string[];
  storeId?: string;
  createdAt: string;
  updatedAt: string;
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
    todaySolde: string;
  }> {
    return this.request('/dashboard/stats');
  }

  async getRecentOrders(): Promise<Array<{
    id: string;
    client: string;
    total: string;
    solde?: string;
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
      totalSolde: number;
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

  // New methods for deliverer earnings and statistics
  async getDelivererStats(id: string): Promise<{
    delivererId: string;
    totalOrders: number;
    stats: Record<string, number>;
    pending: number;
    inDelivery: number;
    delivered: number;
    cancelled: number;
  }> {
    return this.request(`/deliverers/${id}/stats`);
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

  async uploadProviderImage(file: File): Promise<{ imageUrl: string }> {
    return this.uploadFile(file, '/upload/provider');
  }

  async createProvider(providerData: {
    name: string;
    type: "restaurant" | "course" | "pharmacy";
    phone: string;
    address: string;
    email?: string;
    description?: string;
    image?: string;
    imageFile?: File;
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
      image?: string;
    };
  }> {
    // If there's a file, upload it first
    let finalProviderData = { ...providerData };

    if (providerData.imageFile) {
      try {
        const uploadResult = await this.uploadProviderImage(providerData.imageFile);
        finalProviderData.image = uploadResult.imageUrl;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    // Remove the file from data before sending to API
    const { imageFile, ...apiData } = finalProviderData;

    return this.request('/providers', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  }

  async updateProvider(id: string, providerData: {
    name: string;
    type: "restaurant" | "course" | "pharmacy";
    phone: string;
    address: string;
    email?: string;
    description?: string;
    image?: string;
    imageFile?: File;
  }): Promise<{
    message: string;
    provider: {
      id: string;
      name: string;
      type: "restaurant" | "course" | "pharmacy";
      category: string;
      phone: string;
      address: string;
      email?: string;
      description?: string;
      totalOrders: number;
      rating: number;
      status: "active" | "inactive";
      image?: string;
    };
  }> {
    // If there's a file, upload it first
    let finalProviderData = { ...providerData };

    if (providerData.imageFile) {
      try {
        const uploadResult = await this.uploadProviderImage(providerData.imageFile);
        finalProviderData.image = uploadResult.imageUrl;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    // Remove the file from data before sending to API
    const { imageFile, ...apiData } = finalProviderData;

    return this.request(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
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
      image?: string;
      options?: Array<{
        name: string;
        required: boolean;
        maxSelections: number;
        subOptions: Array<{
          name: string;
          price?: number;
        }>;
      }>;
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
    options?: Array<{
      name: string;
      required: boolean;
      maxSelections: number;
      subOptions: Array<{
        name: string;
        price?: number;
      }>;
    }>;
  }> {
    return this.request(`/products/${id}`);
  }

  // Upload file method
  private async uploadFile(file: File, endpoint: string): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      method: 'POST',
      body: formData,
    };

    if (token) {
      config.headers = {
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
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async uploadProductImage(file: File): Promise<{ imageUrl: string }> {
    return this.uploadFile(file, '/upload/product');
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
    imageFile?: File;
    sizes?: Array<{
      name: string;
      price: number;
      optionGroups?: string[];
    }>;
    options?: Array<{
      name: string;
      required: boolean;
      maxSelections: number;
      subOptions: Array<{
        name: string;
        price?: number;
      }>;
    }>;
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
      providerId?: string;
      image?: string;
      sizes?: Array<{
        name: string;
        price: number;
        optionGroups?: string[];
      }>;
      options?: Array<{
        name: string;
        required: boolean;
        maxSelections: number;
        subOptions: Array<{
          name: string;
          price?: number;
        }>;
      }>;
    };
  }> {
    // If there's a file, upload it first
    let finalProductData = { ...productData };
    
    if (productData.imageFile) {
      try {
        const uploadResult = await this.uploadProductImage(productData.imageFile);
        finalProductData.image = uploadResult.imageUrl;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    // Remove the file from data before sending to API
    const { imageFile, ...apiData } = finalProductData;
    
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  }

  async updateProduct(id: string, productData: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    stock?: number;
    status?: "available" | "out_of_stock" | "discontinued";
    providerId?: string;
    image?: string;
    imageFile?: File;
    sizes?: Array<{
      name: string;
      price: number;
      optionGroups?: string[];
    }>;
    options?: Array<{
      name: string;
      required: boolean;
      maxSelections: number;
      subOptions: Array<{
        name: string;
        price?: number;
      }>;
    }>;
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
      sizes?: Array<{
        name: string;
        price: number;
        optionGroups?: string[];
      }>;
      options?: Array<{
        name: string;
        required: boolean;
        maxSelections: number;
        subOptions: Array<{
          name: string;
          price?: number;
        }>;
      }>;
    };
  }> {
    // If there's a file, upload it first
    let finalProductData = { ...productData };
    
    if (productData.imageFile) {
      try {
        const uploadResult = await this.uploadProductImage(productData.imageFile);
        finalProductData.image = uploadResult.imageUrl;
      } catch (error) {
        throw new Error('Failed to upload image');
      }
    }

    // Remove the file from data before sending to API
    const { imageFile, ...apiData } = finalProductData;
    
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
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

  // Option Group management methods
  async getOptionGroupsByProduct(productId: string): Promise<Array<{
    _id: string;
    name: string;
    description?: string;
    options: Array<{
      _id: string;
      name: string;
      price: number;
    }>;
  }>> {
    return this.request(`/option-groups?product=${productId}`);
  }

  async deleteOptionGroup(groupId: string): Promise<{
    message: string;
  }> {
    return this.request(`/option-groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async addSubGroup(parentId: string, subGroupId: string): Promise<{
    message: string;
  }> {
    return this.request(`/option-groups/${parentId}/sub-option-groups`, {
      method: 'POST',
      body: JSON.stringify({ subGroupId }),
    });
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

  // ===== ZONE MANAGEMENT API METHODS =====

  // Get all zones
  async getZones(search?: string, page?: number, limit?: number): Promise<{
    zones: Array<{
      id: string;
      number: number;
      minDistance: number;
      maxDistance: number;
      price: number;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.request(`/zones?${params}`);
  }

  // Get zone by ID
  async getZoneById(id: string): Promise<{
    id: string;
    number: number;
    minDistance: number;
    maxDistance: number;
    price: number;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.request(`/zones/${id}`);
  }

  // Create new zone
  async createZone(zoneData: {
    number: number;
    minDistance: number;
    maxDistance: number;
    price: number;
  }): Promise<{
    message: string;
    zone: {
      id: string;
      number: number;
      minDistance: number;
      maxDistance: number;
      price: number;
    };
  }> {
    return this.request('/zones', {
      method: 'POST',
      body: JSON.stringify(zoneData),
    });
  }

  // Update zone
  async updateZone(id: string, zoneData: {
    number?: number;
    minDistance?: number;
    maxDistance?: number;
    price?: number;
  }): Promise<{
    message: string;
    zone: {
      id: string;
      number: number;
      minDistance: number;
      maxDistance: number;
      price: number;
    };
  }> {
    return this.request(`/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(zoneData),
    });
  }

  // Delete zone
  async deleteZone(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/zones/${id}`, {
      method: 'DELETE',
    });
  }

  // Get user zone based on location
  async getUserZone(userData: {
    userLat: number;
    userLng: number;
    cityId: string;
    destLat: number;
    destLng: number;
  }): Promise<{
    zone: number;
    distance: string;
    price: number;
  }> {
    return this.request('/zones/get-zone', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Update zone price
  async updateZonePrice(zoneNumber: number, newPrice: number): Promise<{
    message: string;
    zone: {
      number: number;
      price: number;
    };
  }> {
    return this.request('/zones/update-price', {
      method: 'PUT',
      body: JSON.stringify({ zoneNumber, newPrice }),
    });
  }

  // ===== PROMOTION MANAGEMENT API METHODS =====

  // Get all promotions
  async getPromos(status?: string, page?: number, limit?: number): Promise<{
    data: Array<{
      id: string;
      name: string;
      status: 'active' | 'closed';
      targetServices: string[];
      maxOrders: number;
      ordersUsed: number;
      maxAmount: number;
      deliveryOnly: boolean;
      startDate: string;
      endDate?: string;
      createdAt: string;
      isActive: boolean;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.request(`/promos?${params}`);
  }

  // Get promotion by ID
  async getPromoById(id: string): Promise<{
    data: {
      id: string;
      name: string;
      status: 'active' | 'closed';
      targetServices: string[];
      maxOrders: number;
      ordersUsed: number;
      maxAmount: number;
      deliveryOnly: boolean;
      startDate: string;
      endDate?: string;
      createdAt: string;
      isActive: boolean;
    };
  }> {
    return this.request(`/promos/${id}`);
  }

  // Create new promotion
  async createPromo(promoData: {
    name: string;
    status?: 'active' | 'closed';
    targetServices: string[];
    maxOrders?: number;
    maxAmount?: number;
    deliveryOnly?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      status: 'active' | 'closed';
      targetServices: string[];
      maxOrders: number;
      ordersUsed: number;
      maxAmount: number;
      deliveryOnly: boolean;
      startDate: string;
      endDate?: string;
      createdAt: string;
    };
  }> {
    return this.request('/promos/create', {
      method: 'POST',
      body: JSON.stringify(promoData),
    });
  }

  // Update promotion
  async updatePromo(id: string, promoData: {
    name?: string;
    status?: 'active' | 'closed';
    targetServices?: string[];
    maxOrders?: number;
    maxAmount?: number;
    deliveryOnly?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      status: 'active' | 'closed';
      targetServices: string[];
      maxOrders: number;
      ordersUsed: number;
      maxAmount: number;
      deliveryOnly: boolean;
      startDate: string;
      endDate?: string;
      createdAt: string;
    };
  }> {
    return this.request(`/promos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promoData),
    });
  }

  // Update promotion status
  async updatePromoStatus(id: string, status: 'active' | 'closed'): Promise<{
    message: string;
    data: {
      id: string;
      status: 'active' | 'closed';
    };
  }> {
    return this.request(`/promos/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Delete promotion
  async deletePromo(id: string): Promise<{
    message: string;
  }> {
    return this.request(`/promos/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== PROMO-PRODUCT MANAGEMENT API METHODS =====

  // Get products by promotion
  async getProductsByPromo(promoId: string, search?: string, page?: number, limit?: number): Promise<{
    promo: string;
    count: number;
    totalPages: number;
    page: number;
    products: Array<{
      id: string;
      name: string;
      category: string;
      provider: string;
      price: number;
      status: string;
      image?: string;
    }>;
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.request(`/promo-products/${promoId}?${params}`);
  }

  // Get products without promotion
  async getProductsWithoutPromo(search?: string, page?: number, limit?: number): Promise<{
    count: number;
    totalPages: number;
    page: number;
    products: Array<{
      id: string;
      name: string;
      category: string;
      provider: string;
      price: number;
      status: string;
      image?: string;
    }>;
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.request(`/promo-products?${params}`);
  }

  // Assign promotion to product
  async assignPromoToProduct(productId: string, promoId: string): Promise<{
    message: string;
    product: {
      id: string;
      name: string;
      promo?: {
        id: string;
        name: string;
        status: string;
      };
    };
  }> {
    return this.request(`/promo-products/${productId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ promoId }),
    });
  }

  // Remove promotion from product
  async removePromoFromProduct(productId: string): Promise<{
    message: string;
    product: {
      id: string;
      name: string;
    };
  }> {
    return this.request(`/promo-products/${productId}/unassign`, {
      method: 'PUT',
    });
  }

  // ===== APP SETTINGS API METHODS =====

  // Get app settings
  async getAppSettings(): Promise<{
    data: {
      appFee: number;
      currency: string;
      updatedAt?: string;
      updatedBy?: string;
    };
  }> {
    return this.request('/app-settings');
  }

  // Update app settings
  async updateAppSettings(settingsData: {
    appFee?: number;
    currency?: string;
    updatedBy?: string;
  }): Promise<{
    message: string;
    data: {
      appFee: number;
      currency: string;
      updatedAt: string;
      updatedBy?: string;
    };
  }> {
    return this.request('/app-settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Reset app settings to default
  async resetAppSettings(updatedBy?: string): Promise<{
    message: string;
    data: {
      appFee: number;
      currency: string;
      updatedAt: string;
      updatedBy?: string;
    };
  }> {
    return this.request('/app-settings/reset', {
      method: 'PUT',
      body: JSON.stringify({ updatedBy }),
    });
  }

  // Get app fee only
  async getAppFee(): Promise<{
    appFee: number;
    currency: string;
  }> {
    return this.request('/app-settings/fee');
  }

  // ===== CITY MANAGEMENT API METHODS =====

  // Get all cities
  async getCities(): Promise<{
    cities: Array<{
      id: string;
      name: string;
      activeZones: number[];
      isActive: boolean;
      createdAt: string;
    }>;
  }> {
    // Temporairement, retourner des données mockées
    // À remplacer par l'appel API réel quand l'endpoint sera créé
    return this.request('/cities');
  }

  // Create new city
  async createCity(cityData: {
    name: string;
    activeZones: number[];
  }): Promise<{
    message: string;
    city: {
      id: string;
      name: string;
      activeZones: number[];
      isActive: boolean;
    };
  }> {
    return this.request('/cities', {
      method: 'POST',
      body: JSON.stringify(cityData),
    });
  }

  // Update city zones
  async updateCityZones(cityId: string, activeZones: number[]): Promise<{
    message: string;
    city: {
      id: string;
      name: string;
      activeZones: number[];
    };
  }> {
    return this.request(`/cities/${cityId}/zones`, {
      method: 'PUT',
      body: JSON.stringify({ activeZones }),
    });
  }



// Add these interfaces at the top of your api.ts file


// Then add these methods to the ApiService class (after your existing methods):

// ===== OPTION GROUPS MANAGEMENT API METHODS =====

// Get all option groups
async getOptionGroups(productId?: string, storeId?: string): Promise<{
  data: OptionGroup[];
}> {
  const params = new URLSearchParams();
  if (productId) params.append('product', productId);
  if (storeId) params.append('storeId', storeId);
  params.append('_t', Date.now().toString());
  
  const result = await this.request(`/option-groups?${params}`);
  return { data: Array.isArray(result) ? result : [] };
}

// Get option group by ID
async getOptionGroupById(id: string): Promise<OptionGroup> {
  return this.request(`/option-groups/${id}`);
}

// Create option group
async createOptionGroup(groupData: {
  name: string;
  description?: string;
  min?: number;
  max?: number;
  image?: string;
  productId?: string;
  storeId?: string;
}): Promise<{
  message: string;
  group: OptionGroup;
}> {
  return this.request('/option-groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  });
}

// Update option group
async updateOptionGroup(id: string, groupData: {
  name?: string;
  description?: string;
  min?: number;
  max?: number;
  image?: string;
}): Promise<{
  message: string;
  group: OptionGroup;
}> {
  return this.request(`/option-groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(groupData),
  });
}

// Add option to group
async addOptionToGroup(groupId: string, optionData: {
  optionId: string;
  name: string;
  price: number;
  image?: string;
}): Promise<{
  message: string;
  group: OptionGroup;
}> {
  return this.request(`/option-groups/${groupId}/options`, {
    method: 'POST',
    body: JSON.stringify(optionData),
  });
}

// Remove option from group
async removeOptionFromGroup(groupId: string, optionId: string): Promise<{
  message: string;
}> {
  return this.request(`/option-groups/${groupId}/options/${optionId}`, {
    method: 'DELETE',
  });
}

// ===== PRODUCT OPTIONS MANAGEMENT API METHODS =====

// Get all product options
async getProductOptions(storeId?: string, availability?: boolean): Promise<{
  data: ProductOption[];
}> {
  const params = new URLSearchParams();
  if (storeId) params.append('storeId', storeId);
  if (availability !== undefined) params.append('availability', availability.toString());
  params.append('_t', Date.now().toString());
  
  const result = await this.request(`/product-options?${params}`);
  return { data: Array.isArray(result) ? result : [] };
}

// Get product option by ID
async getProductOptionById(id: string): Promise<ProductOption> {
  return this.request(`/product-options/${id}`);
}

// Create product option
async createProductOption(optionData: {
  name: string;
  price: number;
  image?: string;
  availability?: boolean;
  groupId?: string;
  storeId?: string;
}): Promise<{
  message: string;
  option: ProductOption;
}> {
  return this.request('/product-options', {
    method: 'POST',
    body: JSON.stringify(optionData),
  });
}

// Update product option
async updateProductOption(id: string, optionData: {
  name?: string;
  price?: number;
  image?: string;
  availability?: boolean;
}): Promise<{
  message: string;
  option: ProductOption;
}> {
  return this.request(`/product-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(optionData),
  });
}

// Delete product option
async deleteProductOption(id: string): Promise<{
  message: string;
}> {
  return this.request(`/product-options/${id}`, {
    method: 'DELETE',
  });
}







  // Deliverer authentication methods
  async loginDeliverer(credentials: { phoneNumber: string }): Promise<{
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    vehicle?: string;
    role: string;
    isVerified: boolean;
    status: string;
    token: string;
    message: string;
    otpSent?: boolean;
    debugOtp?: string;
    error?: string;
  }> {
    return this.request('/auth/login-deliverer', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async registerDeliverer(userData: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    vehicle?: string;
    email?: string;
  }): Promise<{
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    vehicle?: string;
    role: string;
    isVerified: boolean;
    status: string;
    token: string;
    message: string;
  }> {
    return this.request('/auth/register-deliverer', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyDelivererOTP(verificationData: {
    phoneNumber: string;
    otp: string;
  }): Promise<{
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    vehicle?: string;
    role: string;
    isVerified: boolean;
    status: string;
    token: string;
    message: string;
  }> {
    return this.request('/auth/verify-deliverer', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  // Deliverer order management methods
  async getDelivererProfile(): Promise<{
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
      vehicle?: string;
      location?: any;
      status: string;
      isVerified: boolean;
      statistics: {
        totalOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        rating: number;
        createdAt: string;
      };
    };
  }> {
    return this.request('/deliverer/profile');
  }

  async getDelivererEarnings(): Promise<{
    earnings: {
      total: number;
      average: number;
      orderCount: number;
      deliveredCount: number;
      cancelledCount: number;
      monthly: Array<{
        month: string;
        total: number;
        orders: number;
        delivered: number;
        cancelled: number;
      }>;
    };
  }> {
    return this.request('/deliverer/earnings');
  }

  async getDelivererAvailableOrders(): Promise<{
    orders: Array<{
      id: string;
      orderNumber: string;
      client: {
        id: string;
        name: string;
        phone: string;
        location: any;
      };
      provider: {
        id: string;
        name: string;
        type: string;
        phone: string;
        address: string;
      };
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      solde: string;
      status: string;
      deliveryAddress: any;
      paymentMethod: string;
      finalAmount: number;
      createdAt: string;
      platformSolde: number;
    }>;
    count: number;
  }> {
    return this.request('/deliverer/orders/available');
  }

  async getDelivererOrders(): Promise<{
    orders: Array<{
      id: string;
      orderNumber: string;
      client: {
        id: string;
        name: string;
        phone: string;
        location: any;
      };
      provider: {
        id: string;
        name: string;
        type: string;
        phone: string;
        address: string;
      };
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      total: number;
      solde: string;
      status: string;
      deliveryAddress: any;
      paymentMethod: string;
      finalAmount: number;
      createdAt: string;
      platformSolde: number;
    }>;
    count: number;
  }> {
    return this.request('/deliverer/orders');
  }

  async acceptOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    order?: {
      id: string;
      orderNumber: string;
      status: string;
      // ... other order fields
    };
  }> {
    return this.request(`/deliverer/orders/${orderId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/deliverer/orders/${orderId}/reject`, {
      method: 'PUT',
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<{
    success: boolean;
    message: string;
    order?: {
      id: string;
      status: string;
      updatedAt: string;
    };
  }> {
    return this.request(`/deliverer/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateDelivererLocation(locationData: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<{
    success: boolean;
    message: string;
    location: any;
  }> {
    return this.request('/deliverer/profile/location', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }
}

export const apiService = new ApiService();
export type { LoginResponse, LoginRequest };
