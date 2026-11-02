import { DiscountType } from "@/types/enum";
import { formatPriceCAD } from "@/lib/utils";

/** One line of an order's totals, in display order. */
export type TotalLine = {
  label: string;
  amount: number;
  /** Money off: shown as "-$5.00". */
  negative?: boolean;
  kind: "subtotal" | "discount" | "tax" | "total";
};

/**
 * Subtotal → discount (if any) → taxable subtotal → PST → GST → total, worded like
 * the POS's online order card (AsianLePOS OnlineOrderCard / OrderTaxBreakdown).
 * The discount comes off before tax, so the lines add up.
 */
export function orderTotalLines(order: Order): TotalLine[] {
  const tb = order.taxBreakDown;
  const lines: TotalLine[] = [
    { label: "Subtotal", amount: tb.subTotal ?? 0, kind: "subtotal" },
  ];

  const discount = tb.discount;
  if (discount && discount.discountAmount > 0) {
    lines.push(
      {
        label:
          discount.discountType === DiscountType.Percent
            ? `Discount (${discount.discountValue}%)`
            : `Discount (${formatPriceCAD(discount.discountValue)})`,
        amount: discount.discountAmount,
        negative: true,
        kind: "discount",
      },
      {
        label: "Taxable Subtotal",
        amount: discount.taxableSubtotal,
        kind: "subtotal",
      },
    );
  }

  lines.push(
    { label: "PST (6%)", amount: tb.pst ?? 0, kind: "tax" },
    { label: "GST (5%)", amount: tb.gst ?? 0, kind: "tax" },
    { label: "Total", amount: tb.total ?? 0, kind: "total" },
  );
  return lines;
}
