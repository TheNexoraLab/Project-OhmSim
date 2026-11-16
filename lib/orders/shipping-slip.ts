import type { EnrichedAdminOrder } from "@/components/admin/admin-order-drawer";
import { formatPrice, formatDate } from "@/lib/format";

/**
 * Resolves courier brand or dispatch station based on fulfillment type & tracking prefix
 */
export function resolveCourierName(order: EnrichedAdminOrder): string {
  if (order.fulfillmentType === "PICKUP") {
    return "Campus Station (Building 3, Room 204)";
  }
  const tracking = (order.trackingNo || "").toUpperCase();
  if (tracking.startsWith("JNT") || tracking.includes("J&T")) {
    return "J&T Express";
  }
  if (tracking.startsWith("FLS") || tracking.includes("FLASH")) {
    return "Flash Express";
  }
  if (tracking.startsWith("LLM") || tracking.includes("LALAMOVE")) {
    return "Lalamove (Same-day)";
  }
  return "Region III Courier Partner";
}

/**
 * Generates and triggers download of a CSV Shipping Manifest & Waybill Ledger
 */
export function exportShippingManifestCsv(orders: EnrichedAdminOrder[]): void {
  if (typeof window === "undefined" || !orders.length) return;

  const headers = [
    "Order ID",
    "Order Date",
    "Customer Name",
    "Contact Number",
    "Customer Email",
    "Fulfillment Type",
    "Province",
    "City / Municipality",
    "Full Delivery Address",
    "Payment Method",
    "Merchandise Subtotal",
    "Shipping Fee",
    "Total Collectible Amount",
    "Courier",
    "Tracking Number",
    "Total SKUs",
    "Total Units",
    "Item Breakdown",
    "Status",
    "Notes",
  ];

  const rows = orders.map((order) => {
    const province =
      order.structuredAddress?.province ||
      (order.deliveryAddress?.includes("Pampanga")
        ? "Pampanga"
        : order.deliveryAddress?.includes("Bulacan")
        ? "Bulacan"
        : order.deliveryAddress?.includes("Nueva Ecija")
        ? "Nueva Ecija"
        : order.deliveryAddress?.includes("Tarlac")
        ? "Tarlac"
        : order.deliveryAddress?.includes("Bataan")
        ? "Bataan"
        : order.deliveryAddress?.includes("Zambales")
        ? "Zambales"
        : "Central Luzon");

    const city =
      order.structuredAddress?.cityMunicipality ||
      (order.fulfillmentType === "PICKUP" ? "Campus Station" : "Central Luzon");

    const fullAddr =
      order.fulfillmentType === "PICKUP"
        ? order.pickupStation
        : order.deliveryAddress || "Central Luzon, Region III";

    const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);

    const itemsSummary = order.items
      .map((i) => `${i.productSku} (${i.productName}) x${i.qty}`)
      .join(" | ");

    const courier = resolveCourierName(order);
    const tracking = order.trackingNo || "Unassigned";

    return [
      `"${order.orderNumber}"`,
      `"${formatDate(order.createdAt)}"`,
      `"${(order.recipientName || "").replace(/"/g, '""')}"`,
      `"${order.contactNumber || ""}"`,
      `"${order.customerEmail || ""}"`,
      `"${order.fulfillmentType}"`,
      `"${province}"`,
      `"${city}"`,
      `"${fullAddr.replace(/"/g, '""')}"`,
      `"${order.paymentMethod}"`,
      order.subtotalAmount.toFixed(2),
      order.deliveryFee.toFixed(2),
      order.totalAmount.toFixed(2),
      `"${courier}"`,
      `"${tracking}"`,
      order.items.length,
      totalUnits,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      `"${order.status}"`,
      `"${(order.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `ohmsim-shipping-manifest-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a clean, branded print window for an official OhmSim Packaging & Shipping Slip
 */
export function printOrderShippingSlip(order: EnrichedAdminOrder): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=850,height=950");
  if (!printWindow) {
    alert("Please allow popups to print the packaging and shipping slip.");
    return;
  }

  const courier = resolveCourierName(order);
  const tracking = order.trackingNo || "PENDING-DISPATCH";
  const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);
  const isCod = order.paymentMethod === "COD";

  const address =
    order.fulfillmentType === "PICKUP"
      ? order.pickupStation
      : order.deliveryAddress || "Region III Delivery Destination";

  const itemsHtml = order.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 8px 12px; font-family: monospace; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 8px 12px; font-family: monospace; color: #2563eb; font-weight: 700;">${item.productSku}</td>
        <td style="padding: 8px 12px;">
          <div style="font-weight: 600; color: #0f172a;">${item.productName}</div>
          ${item.bomProjectName ? `<div style="font-size: 11px; color: #0d9488; font-family: monospace;">BOM Project: ${item.bomProjectName}</div>` : ""}
        </td>
        <td style="padding: 8px 12px; text-align: center; font-weight: 700;">${item.qty}</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${formatPrice(item.price)}</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: 700;">${formatPrice(item.price * item.qty)}</td>
      </tr>
    `
    )
    .join("");

  const slipHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Shipping Slip #${order.orderNumber} - OhmSim</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #2563eb; }
        .tagline { font-size: 11px; font-family: monospace; color: #64748b; text-transform: uppercase; margin-top: 2px; }
        .order-title { text-align: right; }
        .order-num { font-size: 22px; font-family: monospace; font-weight: 800; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; }
        .badge-cod { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-paid { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; background: #f8fafc; font-size: 13px; }
        .card-title { font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; font-family: monospace; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-table { width: 320px; font-size: 13px; }
        .totals-table td { padding: 4px 8px; }
        .barcode-box { text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 16px; margin-top: 20px; font-family: monospace; font-size: 12px; color: #64748b; }
        .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; font-size: 12px; }
        .sign-line { border-top: 1px solid #0f172a; margin-top: 45px; text-align: center; padding-top: 6px; font-weight: 600; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Print Shipping Slip</button>
        <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Close Window</button>
      </div>

      <div class="header">
        <div>
          <div class="logo">⚡ OhmSim Electronics</div>
          <div class="tagline">Central Luzon Logistics &amp; Engineering Fulfillment Hub</div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">Region III Distribution Center · Bulacan &amp; Pampanga, Philippines</div>
        </div>
        <div class="order-title">
          <div class="order-num">#${order.orderNumber}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date: ${formatDate(order.createdAt)}</div>
          <div style="margin-top: 8px;">
            <span class="badge ${isCod ? "badge-cod" : "badge-paid"}">
              ${isCod ? `COD DUE: ${formatPrice(order.totalAmount)}` : "PAID / CAMPUS PICKUP"}
            </span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">DELIVERY DESTINATION / RECIPIENT</div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${order.recipientName}</div>
          <div style="color: #2563eb; font-weight: 600; margin: 2px 0;">📞 ${order.contactNumber || "N/A"}</div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">✉ ${order.customerEmail || "N/A"}</div>
          <div style="line-height: 1.4; color: #334155;">📍 ${address}</div>
          ${order.notes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-style: italic; color: #475569;">"Note: ${order.notes}"</div>` : ""}
        </div>

        <div class="card">
          <div class="card-title">DISPATCH &amp; COURIER ROUTING</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Courier: ${courier}</div>
          <div style="margin: 4px 0; font-family: monospace; font-size: 13px; font-weight: 600; color: #2563eb;">
            Tracking: ${tracking}
          </div>
          <div style="color: #64748b; margin-top: 6px;">
            Fulfillment Mode: <strong>${order.fulfillmentType === "PICKUP" ? "Designated Lab Pickup" : "Central Luzon Express Delivery"}</strong>
          </div>
          <div style="color: #64748b; margin-top: 4px;">
            Payment Method: <strong>${order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Pay on Pickup"}</strong>
          </div>
          <div style="color: #64748b; margin-top: 4px;">
            Package Profile: <strong>Antistatic ESD Protective Packaging</strong>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 130px;">SKU</th>
            <th>Item Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Unit Price</th>
            <th style="width: 110px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <table class="totals-table">
          <tr>
            <td style="color: #64748b;">Total Units:</td>
            <td style="text-align: right; font-weight: 600;">${totalUnits} units (${order.items.length} SKUs)</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Merchandise Subtotal:</td>
            <td style="text-align: right; font-family: monospace;">${formatPrice(order.subtotalAmount)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Shipping / Delivery:</td>
            <td style="text-align: right; font-family: monospace; color: #0d9488;">
              ${order.deliveryFee === 0 ? "FREE (₱0.00)" : formatPrice(order.deliveryFee)}
            </td>
          </tr>
          <tr style="border-top: 2px solid #0f172a; font-weight: 800; font-size: 15px;">
            <td style="padding-top: 8px;">Grand Total Due:</td>
            <td style="text-align: right; font-family: monospace; padding-top: 8px; color: #2563eb;">
              ${formatPrice(order.totalAmount)}
            </td>
          </tr>
        </table>
      </div>

      <div class="sign-grid">
        <div>
          <div>Dispatched By (Warehouse Inspector):</div>
          <div class="sign-line">Quality Control &amp; ESD Packing Lead</div>
        </div>
        <div>
          <div>Received In Good Condition By:</div>
          <div class="sign-line">Customer Signature / Date</div>
        </div>
      </div>

      <div class="barcode-box">
        <div>*${order.orderNumber}*</div>
        <div style="font-size: 10px; margin-top: 4px;">OhmSim Electronics Fulfillment Manifest · Central Luzon Region III</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(slipHtml);
  printWindow.document.close();
}
