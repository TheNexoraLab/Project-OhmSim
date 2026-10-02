import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "../_components/policy-page";

export const metadata: Metadata = {
  title: "Terms — OhmSim",
  description: "OhmSim service rules for accounts, component orders, pickup, delivery, and payments.",
  robots: { index: false, follow: true },
};

const sections: PolicySection[] = [
  { id: "service", title: "About the service", content: <>
    <p>OhmSim by NEXORA Labs is an academic electronics sourcing project for students, makers, educators, and electronics enthusiasts. Version 1.0 is designed for a single-vendor catalog, component lists, customer support, and local order fulfillment.</p>
    <p>These are the documented Version 1.0 service rules. Account, checkout, and order workflows apply when those services are enabled. A demonstration screen or a locally validated form is not confirmation of an account, order, or payment.</p>
  </> },
  { id: "accounts", title: "Accounts and responsible use", content: <>
    <p>Account-specific features—including carts, BOM projects, checkout, orders, chat, and profile management—require a buyer account and sign-in. Each email address belongs to one account.</p>
    <p>Provide accurate contact and fulfillment details. Keep your credentials private. Use only your own account and records; do not attempt to access another customer’s information or administrator functions.</p>
    <p>Use support conversations for product questions, order inquiries, and customer assistance. Do not submit malicious content or sensitive credentials.</p>
  </> },
  { id: "components", title: "Components and BOM lists", content: <>
    <p>Review the product specifications, quantities, price, and available datasheet before selecting a component for your project. Check the component’s requirements against your intended use.</p>
    <p>A BOM project organizes components and estimated costs; it is not an order. Moving items to a cart is subject to current inventory checks. Requested quantities cannot exceed available stock.</p>
  </> },
  { id: "orders", title: "Orders and availability", content: <>
    <p>Checkout requires at least one valid item and a stock check before an order is created. Review the recipient details, selected fulfillment method, merchandise subtotal, and delivery fee before submitting.</p>
    <p>Orders begin as Pending and require administrator confirmation. Inventory is deducted on confirmation. Order records then track preparation and either pickup or delivery until completion.</p>
    <p>Completed orders are read-only. A cancelled order cannot continue through fulfillment. A request to change or cancel an order is not itself confirmation that the order has been changed or cancelled.</p>
  </> },
  { id: "fulfillment", title: "Pickup and delivery", content: <>
    <ul>
      <li><strong>Pickup:</strong> collect from the designated pickup location. A pickup name and contact number are required. The delivery fee is ₱0.00.</li>
      <li><strong>Delivery:</strong> limited to Region 3 (Central Luzon)—Aurora, Bataan, Bulacan, Nueva Ecija, Pampanga, Tarlac, and Zambales.</li>
      <li><strong>Delivery fees:</strong> ₱80.00 for a merchandise subtotal below ₱1,000.00; free delivery for a merchandise subtotal of ₱1,000.00 or more.</li>
      <li><strong>Address details:</strong> provide the recipient’s name, contact number, and complete delivery address. A buyer may save up to two delivery addresses.</li>
    </ul>
    <p>Refer to the order’s status and fulfillment instructions for collection or delivery arrangements. No fixed delivery time is guaranteed by these service rules.</p>
  </> },
  { id: "payment", title: "Payment", content: <>
    <p>Delivery orders use <strong>Cash on Delivery (COD)</strong>. Pickup orders use <strong>in-person Pay on Pickup</strong>. Version 1.0 does not support an online payment gateway.</p>
    <p>The order total consists of the merchandise subtotal and the applicable delivery fee. Do not provide card numbers or online banking credentials through OhmSim forms or chat.</p>
  </> },
  { id: "concerns", title: "Product concerns and rights", content: <>
    <p>Keep your order reference and proof of purchase if you need to raise an issue with the seller. Describe the item and the problem clearly.</p>
    <p>These service rules do not remove rights available under applicable Philippine consumer law. Remedies for defective goods may include repair, replacement, or refund as applicable; a blanket “no return, no exchange” statement does not override those rights.</p>
    <p>See the <a href="https://fairtrade.dti.gov.ph/faq/is-no-return-no-exchange-policy-allowed/">Department of Trade and Industry’s consumer guidance</a>. Product-specific warranty periods and a returns procedure require separate confirmation; this page does not invent a return deadline or guarantee.</p>
  </> },
  { id: "privacy", title: "Privacy and questions", content: <>
    <p>Read the <Link href="/privacy">Privacy page</Link> for information about account, order, conversation, and notification data.</p>
    <p>During project review, direct service-rule questions to the OhmSim project administrator through your existing project contact. The legal operator, public support contact, and final operational policies must be confirmed before commercial launch.</p>
  </> },
];

export default function TermsPage() {
  return <PolicyPage kind="terms" title="Terms" description="Clear guidance for using OhmSim, choosing components, and understanding pickup, delivery, and payment." sections={sections} />;
}
