import { useState, useEffect } from "react";
import { MapPin, Phone, Store, DollarSign, Eye, LogOut, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";

interface ProviderOrder {
  id: string;
  orderNumber: string;
  payout: number;
}

interface ProviderOrderDetail {
  id: string;
  orderNumber: string;
  client: string;
  phone?: string;
  status: 'pending' | 'preparing' | 'accepted' | 'collected' | 'in_delivery' | 'delivered' | 'cancelled';
  totalAmount: number;
  restaurantPayout: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: any;
  deliveryDriver: string | null;
  createdAt: string;
  date: string;
  // Add defensive properties to prevent undefined errors
  totalAmountStr?: string;
  restaurantPayoutStr?: string;
}

interface OrderStats {
  pending: number;
  preparing: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface ProviderDailyBalance {
  id: string;
  date: string;
  orders: ProviderOrder[];
  totalPayout: number;
  paymentMode: 'especes' | 'facture' | 'virement';
  paid: boolean;
  paidAt: string | null;
  orderCount: number;
}

interface ProviderEarnings {
  totalEarnings: number;
  averageEarnings: number;
  deliveredOrders: number;
  totalUnpaid: number;
  currency: string;
}

interface ProviderProfile {
  id: string;
  name: string;
  type: 'restaurant' | 'pharmacy' | 'course' | 'store';
  phone: string;
  address: string;
  email?: string;
  description?: string;
  location?: any;
  image?: string;
  profileImage?: string;
  status: string;
  createdAt: string;
}

const typeLabels = {
  restaurant: 'Restaurant',
  pharmacy: 'Pharmacie',
  course: 'Supermarché',
  store: 'Magasin'
};

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<'balance' | 'profile' | 'commandes'>('balance');
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null);
  const [dailyBalance, setDailyBalance] = useState<ProviderDailyBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<ProviderDailyBalance | null>(null);
  const [paymentMode, setPaymentMode] = useState<'especes' | 'facture' | 'virement'>('especes');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<ProviderOrderDetail[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProviderOrderDetail | null>(null);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchProviderData();
  }, []);

  useEffect(() => {
    if (activeTab === 'commandes') {
      fetchOrders(orderStatusFilter);
    }
  }, [activeTab, orderStatusFilter]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [profileRes, earningsRes, balanceRes] = await Promise.all([
        apiService.getProviderProfile(),
        apiService.getProviderEarnings(),
        apiService.getProviderDailyBalance()
      ]);

      if (profileRes.success && profileRes.provider) {
        setProviderProfile(profileRes.provider);
      }

      if (earningsRes.success && earningsRes.earnings) {
        setEarnings(earningsRes.earnings);
      }

      if (balanceRes.success && balanceRes.dailyBalance) {
        setDailyBalance(balanceRes.dailyBalance);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (status?: string) => {
    try {
      setLoadingOrders(true);
      const [ordersRes, statsRes] = await Promise.all([
        apiService.getProviderOrders({ status: status !== 'all' ? status : undefined, limit: 50 }),
        apiService.getProviderOrderStats()
      ]);

      if (ordersRes.success && ordersRes.orders) {
        setOrders(ordersRes.orders as ProviderOrderDetail[]);
      }

      if (statsRes.success && statsRes.stats) {
        setOrderStats(statsRes.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'preparing' | 'cancelled') => {
    try {
      const result = await apiService.updateProviderOrderStatus(orderId, status);
      
      if (result.success) {
        // Refresh orders and stats
        await Promise.all([
          fetchOrders(orderStatusFilter),
          fetchOrderStats() // Refresh stats to update cancelled count
        ]);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const statsRes = await apiService.getProviderOrderStats();
      if (statsRes.success && statsRes.stats) {
        setOrderStats(statsRes.stats);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const handleOpenPaymentModal = (balance: ProviderDailyBalance) => {
    setSelectedBalance(balance);
    setPaymentMode(balance.paymentMode || 'especes');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBalance) return;

    try {
      setProcessingPayment(true);
      const result = await apiService.payProviderBalance(selectedBalance.id, paymentMode);

      if (result.success) {
        setPaymentModalOpen(false);
        setSelectedBalance(null);
        fetchProviderData();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logoutProvider?.();
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {providerProfile?.name || 'Tableau de bord Prestataire'} 📊
            </h1>
            <p className="text-muted-foreground mt-1">
              {providerProfile && typeLabels[providerProfile.type as keyof typeof typeLabels]}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('balance')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'balance'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Solde (#10)
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('commandes')}
            className={`pb-4 px-4 font-medium transition-colors ${
              activeTab === 'commandes'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Commandes {orderStats && `(${orderStats.pending + orderStats.preparing})`}
          </button>
        </div>

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gains totaux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{earnings?.totalEarnings || 0} {earnings?.currency}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earnings?.deliveredOrders || 0} commandes livrées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Moyenne par commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{earnings?.averageEarnings || 0} {earnings?.currency}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En attente de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{earnings?.totalUnpaid || 0} {earnings?.currency}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {providerProfile && typeLabels[providerProfile.type as keyof typeof typeLabels]}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Balance History */}
            <Card>
              <CardHeader>
                <CardTitle>Historique soldes (#10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyBalance && dailyBalance.length > 0 ? (
                    dailyBalance.map((balance) => (
                      <div key={balance.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <p className="font-medium">
                                {new Date(balance.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {balance.orderCount} commande{balance.orderCount > 1 ? 's' : ''} livrée{balance.orderCount > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{balance.totalPayout} DT</p>
                            <Badge variant={balance.paid ? 'default' : 'secondary'}>
                              {balance.paid ? 'Payé' : 'En attente'}
                            </Badge>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded p-3 mb-3 max-h-32 overflow-y-auto">
                          <p className="text-sm font-medium mb-2">Commandes:</p>
                          <div className="space-y-1">
                            {balance.orders.map((order) => (
                              <div key={order.id} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{order.orderNumber}</span>
                                <span className="font-medium">{order.payout} DT</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className="text-sm text-muted-foreground">
                            Mode: <strong>{balance.paymentMode}</strong>
                          </span>
                          {balance.paidAt && (
                            <span className="text-sm text-muted-foreground">
                              • Payé: {new Date(balance.paidAt).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>

                        {!balance.paid && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenPaymentModal(balance)}
                            className="w-full mt-3"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Confirmer le paiement
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun solde disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && providerProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Informations du prestataire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="text-lg font-medium">{providerProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-medium">
                    {typeLabels[providerProfile.type as keyof typeof typeLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {providerProfile.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-medium">{providerProfile.email || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {providerProfile.address}
                  </p>
                </div>
                {providerProfile.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-lg">{providerProfile.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={providerProfile.status === 'active' ? 'default' : 'secondary'}>
                    {providerProfile.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commandes Tab */}
        {activeTab === 'commandes' && (
          <div className="space-y-6">
            {/* Order Statistics */}
            {orderStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{orderStats.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">En préparation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{orderStats.preparing}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Complétées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Annulées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.total}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filter */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Liste des commandes</CardTitle>
                  <div className="flex gap-2">
                    {['pending', 'preparing', 'completed'].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={orderStatusFilter === status ? 'default' : 'outline'}
                        onClick={() => setOrderStatusFilter(status === 'completed' ? 'delivered' : status)}
                      >
                        {status === 'pending' ? 'En attente' :
                         status === 'preparing' ? 'En préparation' :
                         'Complétées'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Chargement...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-medium">{order.orderNumber}</p>
                              <Badge variant={
                                order.status === 'pending' ? 'secondary' :
                                order.status === 'preparing' ? 'default' :
                                order.status === 'delivered' ? 'outline' : 'destructive'
                              }>
                                {order.status === 'pending' ? 'En attente' :
                                 order.status === 'preparing' ? 'En préparation' :
                                 order.status === 'delivered' ? 'Livrée' : 'Annulée'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{order.client}</p>
                            <p className="text-xs text-muted-foreground">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{(typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(3) : '0.000')} DT</p>
                            <p className="text-sm text-muted-foreground">
                              Payout: {(typeof order.restaurantPayout === 'number' ? order.restaurantPayout.toFixed(3) : '0.000')} DT
                            </p>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded p-3 mb-3 max-h-32 overflow-y-auto">
                          <p className="text-sm font-medium mb-2">Articles:</p>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="font-medium">{(typeof item.price === 'number' ? item.price.toFixed(3) : '0.000')} DT</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="flex-1"
                            >
                              Réaliser
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="flex-1"
                            >
                              Annuler
                            </Button>
                          </div>
                        )}

                        {/* Order Details - Always visible */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOrderDetailsModalOpen(true);
                          }}
                          className="w-full mt-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalOpen && selectedBalance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Confirmer le paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-medium">
                    {new Date(selectedBalance.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="text-2xl font-bold">{selectedBalance.totalPayout} DT</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mode de paiement</p>
                  <div className="flex gap-2">
                    {(['especes', 'facture', 'virement'] as const).map((mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={paymentMode === mode ? 'default' : 'outline'}
                        onClick={() => setPaymentMode(mode)}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentModalOpen(false);
                      setSelectedBalance(null);
                    }}
                    className="flex-1"
                    disabled={processingPayment}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1"
                    disabled={processingPayment}
                  >
                    {processingPayment ? 'Traitement...' : 'Confirmer paiement'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Order Details Modal */}
        {orderDetailsModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Détails de la commande {selectedOrder.orderNumber}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOrderDetailsModalOpen(false);
                      setSelectedOrder(null);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informations client</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom:</span>
                        <span className="font-medium">{selectedOrder.client}</span>
                      </div>
                      {selectedOrder.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Téléphone:</span>
                          <span className="font-medium">{selectedOrder.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informations livraison</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut:</span>
                        <Badge variant={
                          selectedOrder.status === 'pending' ? 'secondary' :
                          selectedOrder.status === 'preparing' ? 'default' :
                          selectedOrder.status === 'delivered' ? 'outline' : 'destructive'
                        }>
                          {selectedOrder.status === 'pending' ? 'En attente' :
                           selectedOrder.status === 'preparing' ? 'En préparation' :
                           selectedOrder.status === 'delivered' ? 'Livrée' : 'Annulée'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Montant total:</span>
                        <span className="font-medium">{(typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount.toFixed(3) : '0.000')} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payout restaurant:</span>
                        <span className="font-medium">{(typeof selectedOrder.restaurantPayout === 'number' ? selectedOrder.restaurantPayout.toFixed(3) : '0.000')} DT</span>
                      </div>
                      {selectedOrder.deliveryDriver && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Livreur:</span>
                          <span className="font-medium">{selectedOrder.deliveryDriver}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  
                  <div>
                  <h3 className="text-lg font-semibold mb-3">Articles commandés</h3>
                  <div className="bg-muted/50 rounded p-4">
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-medium">{(typeof item.price === 'number' ? item.price.toFixed(3) : '0.000')} DT</span>
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-lg font-bold">{(typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount.toFixed(3) : '0.000')} DT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )};
      </div>
    </div>
  );
}
