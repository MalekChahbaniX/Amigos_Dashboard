import { useState, useEffect, useRef } from "react";
import { Search, Filter, Download, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import OrderGroupBadge from "@/components/OrderGroupBadge";
import OrderTypeBadge from "@/components/OrderTypeBadge";
import { OrderCountdown } from "@/components/OrderCountdown";
import { apiService } from "@/lib/api";
import { useAdminWebSocket } from "@/hooks/useAdminWebSocket";
import { useAuthContext } from "@/context/AuthContext";

type OrderType = "A1" | "A2" | "A3" | "A4" | undefined;

type GroupType = "A2" | "A3" | undefined;

interface Order {
  id: string;
  orderNumber: string;
  client: string;
  phone?: string;
  address: string;
  total: string;
  solde?: string;
  status: "pending" | "confirmed" | "preparing" | "in_delivery" | "delivered" | "cancelled";
  date: string;
  createdAt?: string;
  deliverer?: string | null;
  provider: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderType?: OrderType;
  soldeSimple?: string | number;
  soldeDual?: string | number;
  soldeTriple?: string | number;
  soldeAmigos?: string | number;
  isGrouped?: boolean;
  groupType?: GroupType | null;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuthContext();
  const { isConnected, newOrders, connectSocket, disconnectSocket } = useAdminWebSocket();
  const hasConnectedRef = useRef(false);

  const fetchOrders = async (page = 1, typeParam?: OrderType) => {
    try {
      setLoading(true);
      const typeToSend = typeParam !== undefined ? typeParam : (typeFilter !== 'all' ? (typeFilter as OrderType) : undefined);
      const data = await apiService.getAllOrders({
        page,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeToSend,
      });
      // normalize and validate incoming orders
      const normalizeOrderType = (raw: any): OrderType => {
        const v = raw?.orderType ?? raw?.type ?? raw?.order_type;
        if (v === 'A1' || v === 'A2' || v === 'A3' || v === 'A4') return v;
        return undefined;
      };

      const normalizeGroupType = (raw: any): GroupType | null => {
        const g = raw?.groupType ?? raw?.group_type ?? raw?.group;
        if (g === 'A2' || g === 'A3') return g;
        return g ? String(g) as any : null;
      };

      const normalized = Array.isArray(data.orders)
        ? data.orders.map((o: any) => ({
            ...o,
            orderType: normalizeOrderType(o),
            groupType: normalizeGroupType(o),
            isGrouped: Boolean(o.isGrouped || o.grouped || o.groupedOrderIds),
          }))
        : [];

      setOrders(normalized as Order[]);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined);
  }, [searchQuery, statusFilter, typeFilter]);

  // WebSocket connection effect
  useEffect(() => {
    if (user?._id && !hasConnectedRef.current) {
      console.log('🔌 Connecting admin to WebSocket:', user._id);
      connectSocket(user._id);
      hasConnectedRef.current = true;
    }

    return () => {
      if (hasConnectedRef.current) {
        console.log('🔌 Disconnecting admin from WebSocket');
        disconnectSocket();
        hasConnectedRef.current = false;
      }
    };
  }, [user?._id]);

  // Refresh orders when new orders received
  useEffect(() => {
    if (newOrders.length > 0) {
      console.log('📦 New orders received, refreshing list...');
      fetchOrders(currentPage, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined);
    }
  }, [newOrders]);

  // Derived client-side filter by order type
  // Server-side filtering by `typeFilter` is used; still keep the variable for rendering
  const visibleOrders = orders;

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(currentPage, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAssignDeliverer = async (orderId: string, delivererId: string) => {
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/assign-deliverer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delivererId }),
      });

      if (response.ok) {
        fetchOrders(currentPage, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error assigning deliverer:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 xs:px-6 sm:px-8 py-4 xs:py-6 sm:py-8">
        <div className="space-y-4 xs:space-y-6 sm:space-y-8">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">Gestion des commandes</h1>
              <p className="text-sm xs:text-base text-muted-foreground mt-1">Gérez et suivez toutes les commandes</p>
            </div>
            <Button data-testid="button-export" className="w-full xs:w-auto min-h-[44px] xs:min-h-[40px] text-sm xs:text-base">
              <Download className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
              Exporter
            </Button>
          </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 items-start xs:items-center">
            <div className="flex-1 w-full">
              <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par N° commande ou client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 min-h-[44px] xs:min-h-[40px] text-sm xs:text-base"
                    data-testid="input-search-orders"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full xs:w-[200px] sm:w-[220px] min-h-[44px] xs:min-h-[40px] text-sm xs:text-base" data-testid="select-status-filter">
                    <Filter className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="preparing">En préparation</SelectItem>
                <SelectItem value="in_delivery">En livraison</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full xs:w-[140px] sm:w-[150px] min-h-[44px] xs:min-h-[40px] text-sm xs:text-base" data-testid="select-type-filter">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
                <SelectItem value="A4">A4</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visibleOrders.length > 0 ? visibleOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 xs:p-4 sm:p-5 rounded-lg border hover-elevate gap-3 xs:gap-4 transition-all duration-200"
                data-testid={`order-row-${order.id}`}
              >
                <div className="flex items-start xs:items-center gap-3 xs:gap-4 w-full">
                  {/* Left: order identity */}
                  <div className="flex items-start xs:items-center gap-3 xs:gap-4 flex-1 min-w-0">
                    <div className="flex flex-col gap-1 min-w-[80px] xs:min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-sm xs:text-base">{order.orderNumber}</span>
                        <OrderTypeBadge type={order.orderType} />
                        <OrderCountdown createdAt={order.createdAt || order.date} status={order.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">{order.date}</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="font-medium text-sm xs:text-base truncate">{order.client}</span>
                      <span className="text-xs xs:text-sm text-muted-foreground truncate">{order.provider}</span>
                    </div>
                  </div>

                  {/* Middle-right: total / deliverer */}
                  <div className="flex flex-col items-end xs:items-end w-[150px] xs:w-[180px] flex-shrink-0">
                    <div className="font-semibold text-sm xs:text-base">{order.total}</div>
                    {order.solde && (
                      <div className="text-xs text-chart-2 font-medium">Solde: {order.solde}</div>
                    )}
                    {order.deliverer && (
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] xs:max-w-none">{order.deliverer}</div>
                    )}
                  </div>

                  {/* Dedicated grouped column */}
                  <div className="flex items-center justify-center w-[120px] xs:w-[140px] flex-shrink-0">
                    {order.isGrouped ? (
                      <OrderGroupBadge isGrouped={order.isGrouped} groupType={order.groupType} />
                    ) : (
                      <div className="text-xs text-muted-foreground">—</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0 px-2">
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                      className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
                      data-testid={`button-view-${order.id}`}
                    >
                      <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">Aucune commande trouvée</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col xs:flex-row justify-center items-center gap-2 xs:gap-4 mt-4 xs:mt-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrders(currentPage - 1, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 min-h-[36px] xs:min-h-[40px] text-sm"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrders(currentPage + 1, typeFilter !== 'all' ? (typeFilter as OrderType) : undefined)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 min-h-[36px] xs:min-h-[40px] text-sm"
                >
                  Suivant
                </Button>
              </div>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-2xl max-h-[85vh] xs:max-h-[90vh] overflow-y-auto mx-4 xs:mx-auto">
          <DialogHeader className="space-y-2 xs:space-y-3 pb-2">
            <DialogTitle className="text-lg xs:text-xl sm:text-2xl leading-tight">Détails de la commande {selectedOrder?.id}</DialogTitle>
            <DialogDescription className="text-sm xs:text-base">Informations complètes de la commande</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 xs:space-y-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div className="space-y-1">
                  <p className="text-xs xs:text-sm text-muted-foreground font-medium">Client</p>
                  <p className="font-medium text-sm xs:text-base">{selectedOrder.client}</p>
                  <p className="text-xs xs:text-sm text-muted-foreground">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs xs:text-sm text-muted-foreground font-medium">Statut</p>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div className="col-span-1 xs:col-span-2 space-y-1">
                  <p className="text-xs xs:text-sm text-muted-foreground font-medium">Adresse de livraison</p>
                  <p className="font-medium text-sm xs:text-base leading-relaxed">{selectedOrder.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs xs:text-sm text-muted-foreground font-medium">Prestataire</p>
                  <p className="font-medium text-sm xs:text-base">{selectedOrder.provider}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs xs:text-sm text-muted-foreground font-medium">Livreur</p>
                  <p className="font-medium text-sm xs:text-base">{selectedOrder.deliverer || "Non assigné"}</p>
                </div>
              </div>

              <div className="space-y-2 xs:space-y-3">
                <p className="text-sm xs:text-base text-muted-foreground font-medium">Articles commandés</p>
                <div className="space-y-2 xs:space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 xs:p-4 rounded-lg bg-muted/30 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm xs:text-base truncate">{item.name}</p>
                        <p className="text-xs xs:text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm xs:text-base flex-shrink-0">{item.price} DT</p>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-4 xs:py-6 text-sm xs:text-base">Aucun article trouvé</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 xs:pt-6 border-t">
                <p className="text-base xs:text-lg sm:text-xl font-semibold">Total</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-primary">{selectedOrder.total}</p>
              </div>
              
              {selectedOrder.solde && (
                <div className="flex justify-between items-center pt-2 xs:pt-3">
                  <p className="text-base xs:text-lg sm:text-xl font-semibold text-chart-2">Solde Plateforme</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold text-chart-2">{selectedOrder.solde}</p>
                </div>
              )}

              {/* Detailed solde breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {selectedOrder.soldeSimple !== undefined && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Solde Simple</p>
                    <p className="font-medium">{selectedOrder.soldeSimple}</p>
                  </div>
                )}
                {selectedOrder.soldeDual !== undefined && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Solde Dual</p>
                    <p className="font-medium">{selectedOrder.soldeDual}</p>
                  </div>
                )}
                {selectedOrder.soldeTriple !== undefined && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Solde Triple</p>
                    <p className="font-medium">{selectedOrder.soldeTriple}</p>
                  </div>
                )}
                {selectedOrder.soldeAmigos !== undefined && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Solde Amigos</p>
                    <p className="font-medium">{selectedOrder.soldeAmigos}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4 xs:pt-6">
                <Button className="flex-1 min-h-[44px] xs:min-h-[40px] text-sm xs:text-base touch-manipulation" data-testid="button-update-status">
                  Mettre à jour le statut
                </Button>
                <Button variant="outline" className="flex-1 xs:flex-none xs:w-auto min-h-[44px] xs:min-h-[40px] text-sm xs:text-base touch-manipulation" data-testid="button-assign-deliverer">
                  Assigner un livreur
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
