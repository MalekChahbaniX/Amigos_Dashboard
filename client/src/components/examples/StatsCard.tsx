import { StatsCard } from '../StatsCard';
import { ShoppingBag } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-4">
      <StatsCard
        title="Commandes aujourd'hui"
        value="127"
        icon={ShoppingBag}
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}
