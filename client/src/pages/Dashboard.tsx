import { ShoppingBag, Users, Truck, DollarSign, TrendingUp, Clock, LogOut, User } from "lucide-react";
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
  todayRevenue: string;
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
          apiService.getDashboardStats(),
          apiService.getRecentOrders(),
          apiService.getActiveDeliverers()
        ]);

        setStats(statsData);
        setRecentOrders(ordersData);
        setActiveDeliverers(deliverersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await apiService.logoutSuperAdmin();

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
    <div className="space-y-6">
      {/* Header with user info and logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre activité</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                Super Administrateur
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Commandes aujourd'hui"
          value={stats?.todayOrders?.toString() || "0"}
          icon={ShoppingBag}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Clients actifs"
          value={stats?.activeClients?.toString() || "0"}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Livreurs actifs"
          value={stats?.activeDeliverers?.toString() || "0"}
          icon={Truck}
          description="Sur 32 total"
        />
        <StatsCard
          title="Revenu du jour"
          value={`${stats?.todayRevenue || "0"} DT`}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                  className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium font-mono text-sm">{order.id}</span>
                      <span className="text-sm text-muted-foreground">{order.client}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{order.total}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.time}
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
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
                  className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                  data-testid={`deliverer-${deliverer.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium text-sm">
                        {deliverer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{deliverer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deliverer.orders} {deliverer.orders > 1 ? 'commandes' : 'commande'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Commandes totales</p>
              <p className="text-2xl font-semibold">856</p>
              <p className="text-xs text-chart-2">+18% vs semaine dernière</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Revenu total</p>
              <p className="text-2xl font-semibold">38,420 DT</p>
              <p className="text-xs text-chart-2">+22% vs semaine dernière</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Temps moyen de livraison</p>
              <p className="text-2xl font-semibold">28 min</p>
              <p className="text-xs text-chart-2">-5% vs semaine dernière</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
