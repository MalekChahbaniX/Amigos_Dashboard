import { Badge } from "@/components/ui/badge";

type OrderStatus = "pending" | "confirmed" | "accepted" | "preparing" | "in_delivery" | "delivered" | "cancelled";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig = {
  pending: { label: "En attente", className: "bg-chart-3/10 text-chart-3 hover:bg-chart-3/20" },
  confirmed: { label: "Confirmée", className: "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20" },
  accepted: { label: "Acceptée", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" },
  preparing: { label: "En préparation", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20" },
  in_delivery: { label: "En livraison", className: "bg-primary/10 text-primary hover:bg-primary/20" },
  delivered: { label: "Livrée", className: "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20" },
  cancelled: { label: "Annulée", className: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Statut inconnu
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
