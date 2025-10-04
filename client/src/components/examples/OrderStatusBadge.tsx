import { OrderStatusBadge } from '../OrderStatusBadge';

export default function OrderStatusBadgeExample() {
  return (
    <div className="p-4 flex gap-2 flex-wrap">
      <OrderStatusBadge status="pending" />
      <OrderStatusBadge status="confirmed" />
      <OrderStatusBadge status="preparing" />
      <OrderStatusBadge status="in_delivery" />
      <OrderStatusBadge status="delivered" />
      <OrderStatusBadge status="cancelled" />
    </div>
  );
}
