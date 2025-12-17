import { Badge } from "@/components/ui/badge";

type GroupType = "A2" | "A3" | undefined;

interface OrderGroupBadgeProps {
  isGrouped?: boolean;
  groupType?: GroupType | null;
}

export function OrderGroupBadge({ isGrouped, groupType }: OrderGroupBadgeProps) {
  if (!isGrouped) return null;

  const label = groupType ? `Groupe ${groupType}` : "Grouppée";

  return (
    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
      {label}
    </Badge>
  );
}

export default OrderGroupBadge;
