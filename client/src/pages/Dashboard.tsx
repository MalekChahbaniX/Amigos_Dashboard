import { ShoppingBag, Users, Truck, DollarSign, TrendingUp, TrendingDown, Clock, LogOut, User } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface DashboardStats {
  todayOrders: number;
  activeClients: number;
  activeDeliverers: number;
  totalDeliverers?: number;
  todayRevenue: string;
  todaySolde: string;
  ordersTrend?: number;
  clientsTrend?: number;
  deliverersTrend?: number;
  revenueTrend?: number;
  soldeTrend?: number;
  weeklyOrders?: number;
  weeklyOrdersTrend?: number;
  weeklyRevenue?: number;
  weeklyRevenueTrend?: number;
  averageDeliveryTime?: number;
  deliveryTimeTrend?: number;
  platformBalance?: {
    totalSolde: number;
    totalRevenue: number;
    totalPayout: number;
    totalDeliveryFee: number;
    totalAppFee: number;
  };
}

interface RecentOrder {
  id: string;
  client: string;
  total: string;
  status: "pending" | "confirmed" | "preparing" | "in_delivery" | "delivered" | "cancelled";
  time: string;
}

interface ActiveDeliverer {
  id: string;
  name: string;
  orders: number;
  status: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activeDeliverers, setActiveDeliverers] = useState<ActiveDeliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, ordersData, deliverersData] = await Promise.all([
          apiService.getDashboardStats().catch(error => {
            console.error('Error fetching dashboard stats:', error);
            return null;
          }),
          apiService.getRecentOrders().catch(error => {
            console.error('Error fetching recent orders:', error);
            return [];
          }),
          apiService.getActiveDeliverers().catch(error => {
            console.error('Error fetching active deliverers:', error);
            return [];
          })
        ]);

        setStats(statsData);
        setRecentOrders(ordersData);
        setActiveDeliverers(deliverersData);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger certaines données du dashboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call the appropriate logout based on user role
      if (currentUser.role === 'superAdmin') {
        await apiService.logoutSuperAdmin();
      }
      // For other roles, just clear local storage

      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });

      // Redirect to login page
      setLocation("/");

    } catch (error: any) {
      console.error('Logout error:', error);

      // Even if API call fails, still logout locally
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté",
      });

      setLocation("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 xs:px-6 sm:px-8 py-4 xs:py-6 sm:py-8">
        <div className="space-y-4 xs:space-y-6 sm:space-y-8">
          {/* Header with user info and logout */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">Dashboard</h1>
              <p className="text-sm xs:text-base text-muted-foreground mt-1">Vue d'ensemble de votre activité</p>
            </div>

            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 w-full xs:w-auto">
              <div className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 bg-muted rounded-lg min-w-0 flex-1 xs:flex-none">
                <div className="h-7 w-7 xs:h-8 xs:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 xs:h-4 xs:w-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs xs:text-sm font-medium truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {currentUser.role === 'superAdmin' 
                      ? 'Super Administrateur'
                      : currentUser.role === 'admin'
                      ? 'Administrateur'
                      : 'Utilisateur'}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 min-h-[36px] xs:min-h-[40px] text-xs xs:text-sm px-3 xs:px-4 flex-shrink-0"
              >
                <LogOut className="h-3 w-3 xs:h-4 xs:w-4" />
                <span className="hidden xs:inline">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
                <span className="xs:hidden">{isLoggingOut ? "..." : "Déconnexion"}</span>
              </Button>
            </div>
          </div>

      <div className="grid gap-3 xs:gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Commandes aujourd'hui"
          value={stats?.todayOrders?.toString() || "0"}
          icon={ShoppingBag}
          trend={stats?.ordersTrend ? { value: stats.ordersTrend, isPositive: stats.ordersTrend > 0 } : undefined}
        />
        <StatsCard
          title="Clients actifs"
          value={stats?.activeClients?.toString() || "0"}
          icon={Users}
          trend={stats?.clientsTrend ? { value: stats.clientsTrend, isPositive: stats.clientsTrend > 0 } : undefined}
        />
        <StatsCard
          title="Livreurs actifs"
          value={stats?.activeDeliverers?.toString() || "0"}
          icon={Truck}
          description={`Sur ${stats?.totalDeliverers || 0} total`}
          trend={stats?.deliverersTrend ? { value: stats.deliverersTrend, isPositive: stats.deliverersTrend > 0 } : undefined}
        />
        <StatsCard
          title="Revenu du jour"
          value={`${stats?.todayRevenue || "0"} TND`}
          icon={DollarSign}
          trend={stats?.revenueTrend ? { value: stats.revenueTrend, isPositive: stats.revenueTrend > 0 } : undefined}
        />
        <StatsCard
          title="Solde de la plateforme"
          value={`${stats?.todaySolde || "0"} TND`}
          icon={DollarSign}
          trend={stats?.soldeTrend ? { value: stats.soldeTrend, isPositive: stats.soldeTrend > 0 } : undefined}
          description="Revenue net après commissions"
        />
        
        {stats?.platformBalance && (
          <div className="lg:col-span-4 grid gap-3 xs:gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Revenu Total"
              value={`${stats.platformBalance.totalRevenue.toFixed(3)} TND`}
              icon={TrendingUp}
              description="Avant commissions"
            />
            <StatsCard
              title="Payout Restaurants"
              value={`${stats.platformBalance.totalPayout.toFixed(3)} TND`}
              icon={TrendingDown}
              description="Aux prestataires"
            />
            <StatsCard
              title="Frais Livraison"
              value={`${stats.platformBalance.totalDeliveryFee.toFixed(3)} TND`}
              icon={Truck}
              description="Transport"
            />
            <StatsCard
              title="Frais Application"
              value={`${stats.platformBalance.totalAppFee.toFixed(3)} TND`}
              icon={ShoppingBag}
              description="Catégorie-specific"
            />
          </div>
        )}
      </div>

      <div className="grid gap-3 xs:gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
            <CardDescription>Les dernières commandes reçues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 xs:p-4 rounded-lg hover-elevate gap-3 xs:gap-4"
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex items-start xs:items-center gap-3 xs:gap-4 flex-1">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium font-mono text-sm xs:text-base truncate">{order.id}</span>
                      <span className="text-xs xs:text-sm text-muted-foreground truncate">{order.client}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between xs:justify-end gap-3 xs:gap-4 w-full xs:w-auto">
                    <div className="text-center xs:text-right">
                      <div className="font-semibold text-sm xs:text-base">{parseFloat(order.total).toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center xs:justify-end">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">{order.time}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Aucune commande récente</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-orders">
              Voir toutes les commandes
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Livreurs actifs</CardTitle>
            <CardDescription>En service actuellement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeDeliverers.length > 0 ? activeDeliverers.map((deliverer) => (
                <div
                  key={deliverer.id}
                  className="flex items-center justify-between p-3 xs:p-4 rounded-lg hover-elevate gap-3 xs:gap-4"
                  data-testid={`deliverer-${deliverer.id}`}
                >
                  <div className="flex items-center gap-3 xs:gap-4 min-w-0 flex-1">
                    <div className="h-8 w-8 xs:h-9 xs:w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium text-xs xs:text-sm">
                        {deliverer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm xs:text-base truncate">{deliverer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {deliverer.orders} {deliverer.orders > 1 ? 'commandes' : 'commande'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 text-xs xs:text-sm flex-shrink-0">
                    Actif
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Aucun livreur actif</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-deliverers">
              Voir tous les livreurs
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Statistiques de la semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xs:gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1 xs:space-y-2 text-center xs:text-left">
              <p className="text-xs xs:text-sm text-muted-foreground font-medium">Commandes totales</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-semibold">{stats?.weeklyOrders || 0}</p>
              <p className={`text-xs ${stats?.weeklyOrdersTrend !== undefined ? (stats.weeklyOrdersTrend >= 0 ? 'text-chart-2' : 'text-destructive') : 'text-muted-foreground'}`}>
                {stats?.weeklyOrdersTrend !== undefined ? `${stats.weeklyOrdersTrend > 0 ? '+' : ''}${stats.weeklyOrdersTrend}% vs semaine dernière` : 'Données indisponibles'}
              </p>
            </div>
            <div className="space-y-1 xs:space-y-2 text-center xs:text-left">
              <p className="text-xs xs:text-sm text-muted-foreground font-medium">Revenu total</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-semibold">{stats?.weeklyRevenue ? `${stats.weeklyRevenue.toFixed(3)} TND` : '0.000 TND'}</p>
              <p className={`text-xs ${stats?.weeklyRevenueTrend !== undefined ? (stats.weeklyRevenueTrend >= 0 ? 'text-chart-2' : 'text-destructive') : 'text-muted-foreground'}`}>
                {stats?.weeklyRevenueTrend !== undefined ? `${stats.weeklyRevenueTrend > 0 ? '+' : ''}${stats.weeklyRevenueTrend}% vs semaine dernière` : 'Données indisponibles'}
              </p>
            </div>
            <div className="space-y-1 xs:space-y-2 text-center xs:text-left col-span-1 xs:col-span-2 lg:col-span-1">
              <p className="text-xs xs:text-sm text-muted-foreground font-medium">Temps moyen de livraison</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-semibold">{stats?.averageDeliveryTime || 0} min</p>
              <p className={`text-xs ${stats?.deliveryTimeTrend !== undefined ? (stats.deliveryTimeTrend <= 0 ? 'text-chart-2' : 'text-destructive') : 'text-muted-foreground'}`}>
                {stats?.deliveryTimeTrend !== undefined ? `${stats.deliveryTimeTrend > 0 ? '+' : ''}${stats.deliveryTimeTrend}% vs semaine dernière` : 'Données indisponibles'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
