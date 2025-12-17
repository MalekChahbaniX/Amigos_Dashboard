import { Badge } from "@/components/ui/badge";

type OrderType = "A1" | "A2" | "A3" | "A4" | undefined;

interface OrderTypeBadgeProps {
  type?: OrderType;
}

const typeConfig: Record<string, { label: string; className: string }> = {
  A1: { label: "A1", className: "bg-sky-500/10 text-sky-600 hover:bg-sky-500/20" },
  A2: { label: "A2", className: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" },
  A3: { label: "A3", className: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" },
  A4: { label: "A4 - Urgent", className: "bg-red-500/10 text-red-600 hover:bg-red-500/20" },
};

export function OrderTypeBadge({ type }: OrderTypeBadgeProps) {
  if (!type) return null;
  const cfg = (typeConfig as any)[type] as { label: string; className: string } | undefined;
  if (!cfg) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        {String(type)}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

export default OrderTypeBadge;
