import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Package, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface AnalyticsOverview {
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
}

interface RevenueAnalytics {
  totalRevenue: { total: number; average: number; count: number };
  revenueByProviderType: Array<{ _id: string; totalRevenue: number; orderCount: number }>;
  monthlyRevenue: Array<{ _id: { year: number; month: number }; revenue: number; orders: number }>;
  period: string;
}

export default function Analytics() {
  const { toast } = useToast();
  const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, revenue] = await Promise.all([
        apiService.getAnalyticsOverview(period),
        apiService.getRevenueAnalytics(period)
      ]);

      setOverviewData(overview);
      setRevenueData(revenue);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analyses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Analytiques</h1>
          <p className="text-muted-foreground">Insights et métriques de performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">3 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      {overviewData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.overview.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                Total: {overviewData.overview.totalClients}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prestataires</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.overview.totalProviders}</div>
              <p className="text-xs text-muted-foreground">
                {overviewData.overview.totalProducts} produits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livreurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.overview.totalDeliverers}</div>
              <p className="text-xs text-muted-foreground">
                Équipe de livraison
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Période</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.overview.period}</div>
              <p className="text-xs text-muted-foreground">
                Analyse de la période
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {overviewData && (
            <>
              {/* Charts Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Commandes quotidiennes</CardTitle>
                    <CardDescription>Évolution des commandes sur la période</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.charts.ordersData.slice(-7).map((day) => (
                        <div key={day._id} className="flex items-center justify-between">
                          <span className="text-sm">{formatDate(day._id)}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{day.count} commandes</Badge>
                            <span className="text-sm font-medium">{formatCurrency(day.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Prestataires</CardTitle>
                    <CardDescription>Prestataires les plus performants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.insights.topProviders.slice(0, 5).map((provider, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">{provider.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{provider.totalOrders} commandes</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(provider.totalRevenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Provider Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par type de prestataire</CardTitle>
                  <CardDescription>Distribution des prestataires par catégorie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {overviewData.insights.providerTypes.map((type) => (
                      <div key={type._id} className="text-center">
                        <div className="text-2xl font-bold">{type.count}</div>
                        <p className="text-sm text-muted-foreground capitalize">{type._id}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {revenueData && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue.total)}</div>
                    <p className="text-xs text-muted-foreground">
                      {revenueData.totalRevenue.count} commandes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus moyens</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue.average)}</div>
                    <p className="text-xs text-muted-foreground">
                      Par commande
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Période</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueData.period}</div>
                    <p className="text-xs text-muted-foreground">
                      Analyse des revenus
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Provider Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenus par type de prestataire</CardTitle>
                  <CardDescription>Répartition des revenus selon le type de prestataire</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {revenueData.revenueByProviderType.map((type) => (
                      <div key={type._id} className="flex items-center justify-between">
                        <span className="capitalize">{type._id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{type.orderCount} commandes</Badge>
                          <span className="font-medium">{formatCurrency(type.totalRevenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {overviewData && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Produits populaires</CardTitle>
                    <CardDescription>Produits les plus commandés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.insights.popularProducts.slice(0, 5).map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{product.totalQuantity} unités</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(product.totalRevenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par catégorie</CardTitle>
                    <CardDescription>Distribution des produits par catégorie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.insights.productCategories.map((category) => (
                        <div key={category._id} className="flex items-center justify-between">
                          <span className="capitalize">{category._id}</span>
                          <Badge variant="secondary">{category.count} produits</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {overviewData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Croissance des utilisateurs</CardTitle>
                  <CardDescription>Évolution des inscriptions utilisateur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overviewData.charts.clientGrowth.slice(-7).map((day) => (
                      <div key={day._id} className="flex items-center justify-between">
                        <span className="text-sm">{formatDate(day._id)}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">{day.clients}</div>
                            <div className="text-xs text-muted-foreground">Clients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{day.deliverers}</div>
                            <div className="text-xs text-muted-foreground">Livreurs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{day.providers}</div>
                            <div className="text-xs text-muted-foreground">Prestataires</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}