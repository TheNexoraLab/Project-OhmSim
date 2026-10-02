# Privacy and Terms: implementation and content review

## Scope

Working static Next.js routes `/privacy` and `/terms`, linked from the landing footer instead of preview dialogs. Shared server-rendered policy layout with existing logo, Mocha tokens, Inter/JetBrains Mono and Surface. Accessible section contents, current-page navigation, back-to-home/top links, mobile layout and route metadata. No dependencies, consent capture, authentication, backend or shared foundation changes.

These are sourced service-information pages, not approved final legal instruments. They deliberately distinguish the current browser-only Auth behavior from planned account/order processing. No claim of legal compliance, effective date, legal operator identity, live support channel, deployed encryption, refunds deadline, blanket liability waiver or data-sale commitment has been invented. Search indexing is disabled until the operator approves the missing operational details. No merge or legal publication approval is implied.

## Sources and decisions

| Subject | Source | Treatment |
| --- | --- | --- |
| Project identity and single-vendor scope | Handbook pp. 3–6; sync guide | OhmSim by NEXORA Labs, academic electronics project; not assumed to be a registered legal entity |
| Account, BOM, stock, order rules | Handbook pp. 46–50 | Plain-language rules; cart/BOM is not order confirmation |
| Data categories | Handbook pp. 59–62, 125 | Accounts, contact, shopping/BOM, orders, messages, notifications and their purposes |
| Data protection | Handbook pp. 118–129 | Requirements, not assertions that unfinished backend protections exist |
| Region 3, fees, cash payment, address cap | Handbook p. 50 BR-045–048; `docs/FULFILLMENT_AND_DELIVERY_SPEC.md` | Seven provinces; ₱80 below ₱1,000; free at/above threshold; free pickup; COD/pay-on-pickup; two saved addresses |
| Cancellation authority | Sync guide open item 9 vs fulfillment specification | Do not promise buyer self-cancellation or decide authority; request is not confirmation |
| Current Auth data behavior | `app/login/auth-experience.tsx` | Local processing, no authentication API/session/account/email creation |

Official sources checked October 2, 2026:

- [NPC: Right to be informed](https://privacy.gov.ph/the-right-to-be-informed/): notice needs controller identity/contact, purposes, processing basis, recipients, retention and rights.
- [NPC: Data subject rights](https://privacy.gov.ph/data-subject-rights/): conditional rights summarized, official guidance linked on page.
- [DTI: No Return, No Exchange](https://fairtrade.dti.gov.ph/faq/is-no-return-no-exchange-policy-allowed/): no blanket exclusion of statutory remedies for defective products.

## Required operator decisions before operational release

1. Legal seller/controller identity, address, public privacy and support contact. PM has been asked; no private personal email is reused.
2. Actual data inventory, lawful processing basis, retention/deletion schedule (including logs/backups), providers/locations and sharing arrangements.
3. Final cookies/session/analytics/notification behavior, minors policy where applicable, and rights-request verification/handling process.
4. Returns/warranty process, order-change/cancellation authority and escalation channels. No invented return window or delivery SLA.
5. Review by the responsible operator and appropriate legal/privacy adviser before treating these pages as launch-ready legal notices. Update current-service descriptions when backend services actually become enabled, then review the noindex metadata.

The handbook is a technical/product source and does not settle these legal/operational decisions. In particular, a public privacy contact and retention schedule cannot be inferred from the planned technology stack.

## Validation

- PASS: ESLint, TypeScript (`--noEmit --incremental false`), production build, Git whitespace check.
- PASS: 61 policy browser assertions on development port 3000 and production port 3104. Desktop/mobile links, direct reload, section anchors, current-page semantics, cross-policy links, keyboard home navigation, no overflow at 320/390/768/1440, fee values and no browser errors.
- PASS: existing landing regression updated to require real Privacy/Terms navigation rather than placeholder dialogs.
- PASS: all 102 Auth regression assertions; Auth implementation unchanged.
- Production desktop/mobile screenshots captured and visually reviewed. The screenshot test resets scrolling instantly before capture to avoid capturing a sticky contents panel mid-scroll.
- Existing warning about the unrelated user-directory lockfile remains unchanged.
- Content readiness: operator/legal approval is still required for the decisions above. Passing UI tests does not establish legal compliance.
