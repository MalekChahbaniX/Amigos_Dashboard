import { useState, useEffect } from "react";
import { MapPin, Phone, Truck, Clock, DollarSign, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";

interface DelivererOrder {
  id: string;
  orderNumber: string;
  client: {
    name: string;
    phone: string;
    location: any;
  };
  provider: {
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
}

interface DelivererProfile {
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
}

interface DelivererEarnings {
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
}

export default function DelivererInterface() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'earnings'>('orders');
  const [availableOrders, setAvailableOrders] = useState<DelivererOrder[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<DelivererOrder[]>([]);
  const [delivererProfile, setDelivererProfile] = useState<DelivererProfile | null>(null);
  const [earnings, setEarnings] = useState<DelivererEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelivererData();
  }, []);

  const fetchDelivererData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [availableOrdersData, assignedOrdersData, profileData, earningsData] = await Promise.all([
        apiService.getDelivererAvailableOrders(),
        apiService.getDelivererOrders(),
        apiService.getDelivererProfile(),
        apiService.getDelivererEarnings()
      ]);

      setAvailableOrders(availableOrdersData.orders);
      setAssignedOrders(assignedOrdersData.orders);
      setDelivererProfile(profileData.profile);
      setEarnings(earningsData.earnings);
    } catch (error) {
      console.error('Error fetching deliverer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const result = await apiService.acceptOrder(orderId);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const result = await apiService.rejectOrder(orderId);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const result = await apiService.updateOrderStatus(orderId, status);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logoutDeliverer();
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl xs:text-3xl font-semibold">
                Interface Livreur
              </h1>
              <p className="text-sm xs:text-base text-muted-foreground">
                {delivererProfile ? `${delivererProfile.firstName} ${delivererProfile.lastName}` : 'Chargement...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 xs:gap-0 xs:border-b">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Commandes
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Profil
            </Button>
            <Button
              variant={activeTab === 'earnings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('earnings')}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Gains
            </Button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Commandes Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableOrders.length > 0 ? availableOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{order.orderNumber}</Badge>
                            <Badge>{order.paymentMethod}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{order.total} DT</div>
                            <div className="text-xs text-muted-foreground">Solde: {order.solde}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="font-medium">{order.client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {order.client.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{order.provider.name}</div>
                            <div className="text-sm text-muted-foreground">{order.provider.type}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Adresse:</span> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {order.items.length} article(s)
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptOrder(order.id)}
                            className="flex-1"
                          >
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectOrder(order.id)}
                          >
                            Refuser
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune commande disponible pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Commandes Assignées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedOrders.length > 0 ? assignedOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="default">{order.orderNumber}</Badge>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{order.total} DT</div>
                            <div className="text-xs text-muted-foreground">Solde: {order.solde}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="font-medium">{order.client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {order.client.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{order.provider.name}</div>
                            <div className="text-sm text-muted-foreground">{order.provider.type}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Adresse:</span> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {order.items.length} article(s)
                            </span>
                          </div>
                        </div>

                        {order.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                            className="w-full"
                          >
                            En cours de livraison
                          </Button>
                        )}
                        
                        {order.status === 'in_delivery' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              className="flex-1"
                            >
                              Livrée
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            >
                              Annulée
                            </Button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune commande assignée pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && delivererProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Profil Livreur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Informations Personnelles</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nom:</span>
                          <span>{delivererProfile.firstName} {delivererProfile.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Téléphone:</span>
                          <span>{delivererProfile.phoneNumber}</span>
                        </div>
                        {delivererProfile.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{delivererProfile.email}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Véhicule:</span>
                          <span>{delivererProfile.vehicle || 'Non spécifié'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <Badge variant={delivererProfile.status === 'active' ? 'default' : 'secondary'}>
                            {delivererProfile.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Statistiques</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Commandes:</span>
                          <span>{delivererProfile.statistics.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commandes Livrées:</span>
                          <span className="text-green-600">{delivererProfile.statistics.deliveredOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commandes Annulées:</span>
                          <span className="text-red-600">{delivererProfile.statistics.cancelledOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Note:</span>
                          <span>{delivererProfile.statistics.rating || 'Non évalué'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inscrit le:</span>
                          <span>{new Date(delivererProfile.statistics.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && earnings && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gains Globaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-2xl font-bold">{earnings.total} DT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Moyenne</span>
                      <span className="font-semibold">{earnings.average} DT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Commandes</span>
                      <span>{earnings.orderCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Livrées</span>
                      <span className="text-green-600 font-semibold">{earnings.deliveredCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Annulées</span>
                      <span className="text-red-600 font-semibold">{earnings.cancelledCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taux de réussite</span>
                      <span className="font-semibold">
                        {earnings.orderCount > 0 ? Math.round((earnings.deliveredCount / earnings.orderCount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails Mensuels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnings.monthly.slice(0, 3).map((month) => (
                      <div key={month.month} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{month.month}</span>
                          <span className="font-semibold">{month.total} DT</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{month.orders} commandes</span>
                          <span>{month.delivered} livrées</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
