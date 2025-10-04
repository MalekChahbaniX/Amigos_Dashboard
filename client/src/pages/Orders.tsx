import { useState, useEffect } from "react";
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

interface Order {
  id: string;
  orderNumber: string;
  client: string;
  phone?: string;
  address: string;
  total: string;
  status: "pending" | "confirmed" | "preparing" | "in_delivery" | "delivered" | "cancelled";
  date: string;
  deliverer?: string | null;
  provider: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });

      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const data: OrdersResponse = await response.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [searchQuery, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(currentPage);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAssignDeliverer = async (orderId: string, delivererId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/assign-deliverer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delivererId }),
      });

      if (response.ok) {
        fetchOrders(currentPage);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des commandes</h1>
          <p className="text-muted-foreground">Gérez et suivez toutes les commandes</p>
        </div>
        <Button data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par N° commande ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.length > 0 ? orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`order-row-${order.id}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1 min-w-[100px]">
                    <span className="font-mono font-medium">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">{order.date}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{order.client}</span>
                    <span className="text-sm text-muted-foreground">{order.provider}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{order.total}</div>
                    {order.deliverer && (
                      <div className="text-xs text-muted-foreground">{order.deliverer}</div>
                    )}
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedOrder(order)}
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">Aucune commande trouvée</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => fetchOrders(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-3">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchOrders(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande {selectedOrder?.id}</DialogTitle>
            <DialogDescription>Informations complètes de la commande</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedOrder.client}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="mt-1">
                    <OrderStatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse de livraison</p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prestataire</p>
                  <p className="font-medium">{selectedOrder.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Livreur</p>
                  <p className="font-medium">{selectedOrder.deliverer || "Non assigné"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Articles commandés</p>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{item.price} DT</p>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-2">Aucun article trouvé</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-2xl font-bold text-primary">{selectedOrder.total}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-update-status">
                  Mettre à jour le statut
                </Button>
                <Button variant="outline" data-testid="button-assign-deliverer">
                  Assigner un livreur
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
