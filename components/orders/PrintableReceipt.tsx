import { TakeOutFulfillmentKind } from "@/types/enum";
import { formatOrderedAt, formatPhone, formatPriceCAD } from "@/lib/utils";

export function PrintableReceipt({ order }: { order: Order }) {
  const tb = order.taxBreakDown;

  return (
    <div className="p-6 text-black">
      <div className="text-center mb-4">
        <p className="text-lg font-bold">Asian Le Restaurant</p>
        <p className="text-sm">Order #{order.orderNumber}</p>
      </div>

      <div className="text-sm mb-4 space-y-0.5">
        <p>Name: {order.customerName || "—"}</p>
        <p>Phone: {order.phoneNumber ? formatPhone(order.phoneNumber) : "—"}</p>
        <p>Ordered At: {formatOrderedAt(order.createdAt)}</p>
        {order.fulfillment.kind === TakeOutFulfillmentKind.Immediate &&
        order.fulfillment.readyTimeMinutes != null ? (
          <p>Ready In: {order.fulfillment.readyTimeMinutes} min</p>
        ) : null}
        {order.fulfillment.kind === TakeOutFulfillmentKind.Scheduled ? (
          <p>Preorder: {formatOrderedAt(order.fulfillment.scheduledAt)}</p>
        ) : null}
      </div>

      <div className="border-t border-black/40 pt-2">
        {order.orderItems.map((item, i) => (
          <div key={item.menuItemId ?? i} className="mb-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{formatPriceCAD(item.price * item.quantity)}</span>
            </div>
            {item.options?.map((o, j) => (
              <div key={j} className="flex justify-between pl-4 text-xs">
                <span>
                  {o.quantity > 1 ? `${o.quantity}× ` : ""}
                  {o.name}
                </span>
                {o.price > 0 ? <span>{formatPriceCAD(o.price * o.quantity)}</span> : null}
              </div>
            ))}
            {item.instructions?.trim() ? (
              <p className="pl-4 text-xs italic">&ldquo;{item.instructions}&rdquo;</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-black/40 pt-2 text-sm space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPriceCAD(tb.subTotal ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>PST (6%)</span>
          <span>{formatPriceCAD(tb.pst ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (5%)</span>
          <span>{formatPriceCAD(tb.gst ?? 0)}</span>
        </div>
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{formatPriceCAD(tb.total ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}
