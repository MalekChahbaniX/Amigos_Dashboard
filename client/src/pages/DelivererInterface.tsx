import { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  Phone,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Calendar,
  TrendingUp,
  Car,
  Menu,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface Order {
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

interface EarningsData {
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [delivererProfile, setDelivererProfile] =
    useState<DelivererProfile | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchDelivererData = async () => {
    try {
      setLoading(true);
      const [
        profileResponse,
        earningsResponse,
        availableResponse,
        assignedResponse,
      ] = await Promise.all([
        apiService.getDelivererProfile(),
        apiService.getDelivererEarnings(),
        apiService.getDelivererAvailableOrders(),
        apiService.getDelivererOrders(),
      ]);

      setDelivererProfile(profileResponse.profile);
      setEarnings(earningsResponse.earnings);
      setAvailableOrders(availableResponse.orders);
      setAssignedOrders(assignedResponse.orders);
    } catch (error: any) {
      console.error("Error fetching deliverer data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du livreur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivererData();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await apiService.acceptOrder(orderId);
      toast({
        title: "Succès",
        description: "Commande acceptée avec succès",
      });
      fetchDelivererData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de l'acceptation de la commande",
        variant: "destructive",
      });
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await apiService.rejectOrder(orderId);
      toast({
        title: "Succès",
        description: "Commande rejetée avec succès",
      });
      fetchDelivererData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du rejet de la commande",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      toast({
        title: "Succès",
        description: `Statut mis à jour: ${status}`,
      });
      fetchDelivererData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const filteredAvailableOrders = availableOrders.filter((order) => {
    const matchesSearch =
      order.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && order.status === filterStatus;
  });

  const filteredAssignedOrders = assignedOrders.filter((order) => {
    const matchesSearch =
      order.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && order.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <span className="text-lg font-medium text-muted-foreground">
            Chargement...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header Mobile */}
      <div className="lg:hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Interface Livreur</h1>
                <p className="text-xs text-blue-100">
                  {delivererProfile?.firstName} {delivererProfile?.lastName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-xs"
            >
              {delivererProfile?.vehicle || "Véhicule non spécifié"}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-xs ${
                delivererProfile?.status === "active"
                  ? "bg-green-500/20 text-green-100 border-green-300/30"
                  : "bg-gray-500/20 text-gray-100 border-gray-300/30"
              }`}
            >
              {delivererProfile?.status === "active" ? "● Actif" : "○ Inactif"}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs Mobile */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <nav className="flex">
            {[
              { id: "orders", label: "Commandes", icon: Package },
              { id: "profile", label: "Profil", icon: User },
              { id: "earnings", label: "Gains", icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="lg:container lg:mx-auto lg:px-6 lg:py-8">
        {/* Enhanced Header Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Car className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">Interface Livreur</h1>
                  <p className="text-blue-100">
                    Bienvenue {delivererProfile?.firstName}{" "}
                    {delivererProfile?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  <Car className="h-4 w-4 mr-1" />
                  {delivererProfile?.vehicle || "Véhicule non spécifié"}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${
                    delivererProfile?.status === "active"
                      ? "bg-green-500/20 text-green-100 border-green-300/30"
                      : "bg-gray-500/20 text-gray-100 border-gray-300/30"
                  } backdrop-blur-sm`}
                >
                  {delivererProfile?.status === "active"
                    ? "● Actif"
                    : "○ Inactif"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Desktop */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border">
            <nav className="flex px-6">
              {[
                { id: "orders", label: "Commandes", icon: Package },
                { id: "profile", label: "Profil", icon: User },
                { id: "earnings", label: "Gains", icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 lg:p-0">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-100 mb-1">
                          Disponibles
                        </p>
                        <p className="text-2xl font-bold">
                          {availableOrders.length}
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                        <Package className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-100 mb-1">En Cours</p>
                        <p className="text-2xl font-bold">
                          {
                            assignedOrders.filter(
                              (o) =>
                                o.status === "accepted" ||
                                o.status === "in_delivery"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-100 mb-1">Livrées</p>
                        <p className="text-2xl font-bold">
                          {delivererProfile?.statistics.deliveredOrders || 0}
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-100 mb-1">Note</p>
                        <p className="text-2xl font-bold">
                          {delivererProfile?.statistics.rating || 0}⭐
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une commande..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                      "all",
                      "pending",
                      "accepted",
                      "in_delivery",
                      "delivered",
                    ].map((status) => (
                      <Button
                        key={status}
                        variant={
                          filterStatus === status ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFilterStatus(status)}
                        className={`whitespace-nowrap flex-shrink-0 ${
                          filterStatus === status
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
                        }`}
                      >
                        {status === "all"
                          ? "Toutes"
                          : status === "pending"
                          ? "En Attente"
                          : status === "accepted"
                          ? "Acceptée"
                          : status === "in_delivery"
                          ? "En Livraison"
                          : "Livrée"}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Available Orders */}
              {availableOrders.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Package className="h-5 w-5" />
                      Commandes Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {filteredAvailableOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 border rounded-xl hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono border-blue-200 text-blue-700"
                              >
                                {order.orderNumber}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gray-100"
                              >
                                {order.provider.type}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "fr-TN"
                              )}
                            </span>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">
                                  {order.client.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                <Phone className="h-3 w-3" />
                                {order.client.phone}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {order.deliveryAddress?.street ||
                                  "Adresse non spécifiée"}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500">
                                  Restaurant:
                                </span>
                                <span className="text-sm font-semibold">
                                  {order.provider.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <Phone className="h-3 w-3 inline mr-1" />
                                {order.provider.phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">
                                {order.total} DT
                              </p>
                              <p className="text-xs text-gray-500">
                                Solde: {order.platformSolde} DT
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptOrder(order.id)}
                                className="bg-green-500 hover:bg-green-600 shadow-md"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectOrder(order.id)}
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Orders */}
              {assignedOrders.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                      <Package className="h-5 w-5" />
                      Mes Commandes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {filteredAssignedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 border rounded-xl hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono border-indigo-200 text-indigo-700"
                              >
                                {order.orderNumber}
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={`text-xs ${
                                order.status === "delivered"
                                  ? "bg-green-500"
                                  : order.status === "in_delivery"
                                  ? "bg-yellow-500"
                                  : order.status === "accepted"
                                  ? "bg-blue-500"
                                  : ""
                              }`}
                            >
                              {order.status === "pending"
                                ? "En Attente"
                                : order.status === "accepted"
                                ? "Acceptée"
                                : order.status === "in_delivery"
                                ? "En Livraison"
                                : order.status === "delivered"
                                ? "Livrée"
                                : "Annulée"}
                            </Badge>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="bg-indigo-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-indigo-900">
                                  {order.client.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <Phone className="h-3 w-3 inline mr-1" />
                                {order.client.phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div>
                              <p className="text-2xl font-bold text-indigo-600">
                                {order.total} DT
                              </p>
                              <p className="text-xs text-gray-500">
                                Solde: {order.platformSolde} DT
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {order.status === "accepted" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        "in_delivery"
                                      )
                                    }
                                    className="hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-600"
                                  >
                                    En Livraison
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        "delivered"
                                      )
                                    }
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    Livrée
                                  </Button>
                                </>
                              )}
                              {order.status === "in_delivery" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "delivered"
                                    )
                                  }
                                  className="bg-green-500 hover:bg-green-600 shadow-md"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Marquer comme Livrée
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && delivererProfile && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-blue-900">
                  Profil du Livreur
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-blue-200 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                      {delivererProfile.firstName[0]}
                      {delivererProfile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {delivererProfile.firstName} {delivererProfile.lastName}
                    </h2>
                    <p className="text-gray-600 mb-2">
                      {delivererProfile.phoneNumber}
                    </p>
                    <Badge
                      variant={
                        delivererProfile.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        delivererProfile.status === "active"
                          ? "bg-green-500"
                          : ""
                      }
                    >
                      {delivererProfile.status === "active"
                        ? "● Actif"
                        : "○ Inactif"}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Email
                    </p>
                    <p className="text-gray-900">
                      {delivererProfile.email || "Non spécifié"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Véhicule
                    </p>
                    <p className="text-gray-900">
                      {delivererProfile.vehicle || "Non spécifié"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Statut de Vérification
                    </p>
                    <Badge
                      variant={
                        delivererProfile.isVerified ? "default" : "secondary"
                      }
                      className={
                        delivererProfile.isVerified ? "bg-green-500" : ""
                      }
                    >
                      {delivererProfile.isVerified
                        ? "✓ Vérifié"
                        : "○ Non vérifié"}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Date d'inscription
                    </p>
                    <p className="text-gray-900">
                      {new Date(
                        delivererProfile.statistics.createdAt || new Date()
                      ).toLocaleDateString("fr-TN")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {delivererProfile.statistics.totalOrders}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Total Commandes
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {delivererProfile.statistics.deliveredOrders}
                      </div>
                      <p className="text-xs text-green-600 mt-1">Livrées</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700">
                        {delivererProfile.statistics.rating}⭐
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        Note Moyenne
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && earnings && (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {earnings.total} DT
                      </div>
                      <p className="text-xs text-emerald-100">Total Gains</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {earnings.average} DT
                      </div>
                      <p className="text-xs text-blue-100">Gain Moyen</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {earnings.deliveredCount}
                      </div>
                      <p className="text-xs text-violet-100">Livrées</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {earnings.orderCount}
                      </div>
                      <p className="text-xs text-orange-100">Total Commandes</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-emerald-900">
                    <Calendar className="h-5 w-5" />
                    Historique Mensuel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {earnings.monthly.map((month) => (
                      <div
                        key={month.month}
                        className="p-4 border rounded-xl bg-gradient-to-r from-white to-emerald-50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {month.month}
                          </h4>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              {month.total} DT
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                              <Package className="h-4 w-4 inline mr-1 text-blue-500" />
                              {month.orders} commandes
                            </span>
                            <span className="text-gray-600">
                              <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                              {month.delivered} livrées
                            </span>
                            <span className="text-gray-600">
                              <XCircle className="h-4 w-4 inline mr-1 text-red-500" />
                              {month.cancelled} annulées
                            </span>
                          </div>
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
