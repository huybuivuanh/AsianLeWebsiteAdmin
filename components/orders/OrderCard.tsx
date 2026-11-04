"use client";

import { OrderStatus, TakeOutFulfillmentKind } from "@/types/enum";
import { formatOrderedAt, formatPhone, formatPriceCAD } from "@/lib/utils";
import { OrderItemBlock } from "./OrderItemBlock";
import { orderTotalLines } from "@/lib/order-totals";
import { rewardsBadgeText } from "@/lib/orders-firestore";

function orderCardSurface(status: OrderStatus, scheduled: boolean): string {
  if (status === OrderStatus.Cancelled) return "bg-red-100 border-red-200";
  if (status === OrderStatus.Completed) return "bg-green-100 border-green-200";
  if (status === OrderStatus.New) return "bg-purple-200 border-purple-300";
  return scheduled
    ? "bg-orange-100 border-orange-200"
    : "bg-blue-100 border-blue-200";
}

function statusPillClass(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.New:
      return "bg-indigo-100 text-indigo-700";
    case OrderStatus.InProgress:
      return "bg-amber-100 text-amber-700";
    case OrderStatus.ReadyForPickup:
      return "bg-teal-100 text-teal-700";
    case OrderStatus.Completed:
      return "bg-green-100 text-green-700";
    case OrderStatus.Cancelled:
      return "bg-red-200 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.New]: "New",
  [OrderStatus.InProgress]: "In progress",
  [OrderStatus.ReadyForPickup]: "Ready for pickup",
  [OrderStatus.Completed]: "Completed",
  [OrderStatus.Cancelled]: "Cancelled",
};

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function OrderCard({
  order,
  expanded,
  onToggle,
  onPrint,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onPrint: (order: Order) => void;
}) {
  const tb = order.taxBreakDown;
  const rewardsText = rewardsBadgeText(order.loyalty);
  const scheduled = order.fulfillment.kind === TakeOutFulfillmentKind.Scheduled;

  const showPaidPill =
    !(order.status === OrderStatus.Completed && !order.paid) &&
    order.status !== OrderStatus.Cancelled;

  const printedPillClass = order.printed
    ? "bg-indigo-100 text-indigo-700"
    : "bg-amber-100 text-amber-700";

  const paidPillClass = order.paid
    ? "bg-fuchsia-100 text-fuchsia-700"
    : "bg-slate-200 text-slate-600";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${orderCardSurface(order.status, scheduled)}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-800">
            Order #{order.orderNumber}
          </p>
          {order.customerName ? (
            <p className="text-base font-semibold text-gray-800">
              Name: {order.customerName}
            </p>
          ) : null}
          {order.phoneNumber ? (
            <p className="text-base font-semibold text-gray-800">
              Phone #: {formatPhone(order.phoneNumber)}
            </p>
          ) : null}
          <p className="text-base font-semibold text-gray-800">
            Ordered At: {formatOrderedAt(order.createdAt)}
          </p>
          {rewardsText ? (
            <span className="mt-1 inline-block rounded-md bg-amber-500 px-2 py-1 text-xs font-bold text-white">
              {rewardsText}
            </span>
          ) : null}
          {order.fulfillment.kind === TakeOutFulfillmentKind.Immediate &&
          order.fulfillment.readyTimeMinutes != null ? (
            <p className="text-base font-semibold text-gray-800">
              Ready In: {order.fulfillment.readyTimeMinutes} min
            </p>
          ) : null}
          {order.fulfillment.kind === TakeOutFulfillmentKind.Scheduled ? (
            <p className="text-base font-semibold text-gray-800">
              Preorder: {formatOrderedAt(order.fulfillment.scheduledAt)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Pill className={printedPillClass}>
            {order.printed ? "Printed" : "Not Printed"}
          </Pill>
          {showPaidPill ? (
            <Pill className={paidPillClass}>{order.paid ? "Paid" : "Unpaid"}</Pill>
          ) : null}
          <Pill className={statusPillClass(order.status)}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Pill>
          <span className="text-base font-bold text-gray-900">
            {formatPriceCAD(tb.total ?? 0)}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="mt-3 border-t border-gray-200 pt-2">
          {order.orderItems.length > 0 ? (
            <ul>
              {order.orderItems.map((item, i) => (
                <OrderItemBlock key={item.menuItemId ?? i} item={item} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No line items.</p>
          )}

          <div className="mt-2 border-t border-gray-200 p-2">
            {orderTotalLines(order).map((line) => {
              const textClass =
                line.kind === "total"
                  ? "font-semibold text-gray-800"
                  : "text-gray-700";
              return (
                <div key={line.label} className="mb-1 flex justify-between">
                  <span
                    className={`text-base ${line.kind === "discount" ? "text-gray-600" : textClass}`}
                  >
                    {line.label}
                  </span>
                  <span
                    className={`text-base ${line.kind === "total" ? "font-bold text-gray-900" : textClass}`}
                  >
                    {line.negative ? "-" : ""}
                    {formatPriceCAD(line.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(order);
              }}
              className="w-full rounded-md bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Print
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
