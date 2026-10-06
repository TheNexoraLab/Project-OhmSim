import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "../_components/policy-page";

// Keep out of search indexes until the operator/contact and processing inventory are approved.
export const metadata: Metadata = {
  title: "Privacy — OhmSim",
  description: "Information about personal data, account privacy, and privacy rights in OhmSim.",
  robots: { index: false, follow: true },
};

const sections: PolicySection[] = [
  { id: "scope", title: "About this information", content: <>
    <p>OhmSim is an electronics sourcing project developed by NEXORA Labs. This page explains the data involved in its account, shopping, support, and notification features.</p>
    <p>Account and order services are being developed. The current sign-in, registration, and recovery forms process entries in your browser; they do not create accounts, authenticate users, or send reset emails. Visiting the website also involves requests to its hosting service.</p>
  </> },
  { id: "information", title: "Information and its purpose", content: <>
    <p>The service design limits personal information to what its features require. When these features are enabled, the relevant categories are:</p>
    <ul>
      <li><strong>Account and contact details:</strong> name, email, contact number, and authentication records for account access and communication.</li>
      <li><strong>Shopping and BOM projects:</strong> selected components, quantities, and project names for managing component lists and purchases.</li>
      <li><strong>Order and fulfillment details:</strong> recipient or pickup name, contact number, items, totals, fulfillment choice, and delivery address where needed. Optional notes help coordinate fulfillment.</li>
      <li><strong>Support conversations:</strong> messages and related product or order references for responding to inquiries.</li>
      <li><strong>Notification details:</strong> account or device identifiers and notification records for order and message updates, when notifications are enabled.</li>
    </ul>
    <p>Version 1.0 uses cash on delivery or payment on pickup, not an online payment gateway. Do not include card details, passwords, or verification codes in order notes or support messages.</p>
  </> },
  { id: "access", title: "Access and fulfillment", content: <>
    <p>The account design separates buyer and administrator permissions. Buyers access their own orders, BOM projects, profile, and conversations. Authorized administrators handle the customer information needed for support and order management.</p>
    <p>Delivery requires the recipient name, contact number, and address to reach the person handling fulfillment. Hosting, database, and notification services are also part of the planned system. The deployed providers, processing locations, and applicable data-sharing arrangements must be identified before these services process customer data.</p>
  </> },
  { id: "browser", title: "Browser and notifications", content: <>
    <p>The current Auth forms do not save entered credentials to cookies, local storage, or session storage. A browser or password manager may separately remember or fill information according to your browser settings.</p>
    <p>You can manage website notification permissions in your browser. Declining push notifications does not authorize additional collection. Session storage, cookies, and any analytics used by future account services must be disclosed when those services are enabled.</p>
  </> },
  { id: "security", title: "Protection and retention", content: <>
    <p>The project requires secure production connections, restricted access, hashed passwords rather than readable passwords, and protection against unauthorized access to another user’s records. These are implementation requirements, not a claim that backend security has already been deployed.</p>
    <p>Account, order, and conversation retention periods are not yet established for the operational service. Its operator must document the purpose, lawful basis, retention period, and deletion process for each category before collecting it. This page does not promise immediate deletion or indefinite retention.</p>
  </> },
  { id: "rights", title: "Your privacy rights", content: <>
    <p>Subject to applicable Philippine law, privacy rights include being informed about processing, accessing and correcting personal data, objecting to processing, requesting erasure or blocking where applicable, and data portability. You may also file a complaint with the National Privacy Commission.</p>
    <p>Learn more from the <a href="https://privacy.gov.ph/data-subject-rights/">National Privacy Commission’s data subject rights guidance</a>.</p>
  </> },
  { id: "questions", title: "Questions and updates", content: <>
    <p>For questions during the project review, contact the OhmSim project administrator through your existing project contact. Do not send passwords or unnecessary identity documents.</p>
    <p>The operational privacy notice must identify the responsible legal operator and a public privacy-request contact before customer data collection begins. Material changes to data use must be explained before the new processing takes place.</p>
  </> },
];

export default function PrivacyPage() {
  return <PolicyPage kind="privacy" title="Privacy" description="Understand the information behind your account, orders, and conversations—and the choices and rights that come with it." sections={sections} />;
}
