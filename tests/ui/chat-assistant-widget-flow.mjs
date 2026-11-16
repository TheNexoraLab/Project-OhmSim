import assert from 'node:assert/strict';
import path from 'node:path';
import { createLoader } from './helpers/load-typescript.mjs';

const load = createLoader(path.resolve(import.meta.dirname, '../..'));

console.log('=== OhmSim: 24/7 OhmBot Assistant & Floating Chat Widget Verification ===\n');

// 1. Verify Inquiry Categories & Chips Catalog
console.log('--- 1. Verifying Inquiry Categories & Technical Suggestion Chips ---');
const { INQUIRY_CATEGORIES } = load('lib/chat/inquiry-chips.ts');

assert.ok(Array.isArray(INQUIRY_CATEGORIES), 'INQUIRY_CATEGORIES must be an array');
assert.equal(INQUIRY_CATEGORIES.length, 5, 'Must have exactly 5 core inquiry categories');

const categoryIds = INQUIRY_CATEGORIES.map((c) => c.id);
assert.deepEqual(
  categoryIds,
  ['circuits', 'bom', 'logistics', 'payments', 'seller'],
  'Categories must match approved specifications'
);

const totalChips = INQUIRY_CATEGORIES.reduce((acc, c) => acc + c.chips.length, 0);
console.log(`✓ Verified ${INQUIRY_CATEGORIES.length} categories with a total of ${totalChips} technical suggestion chips.`);
assert.ok(totalChips >= 20, 'Must have at least 20 rich inquiry chips');

// 2. Verify OhmBot Knowledge & Inference Engine
console.log('\n--- 2. Verifying OhmBot Knowledge & Inference Matching Engine ---');
const { matchOhmBotQuery } = load('lib/chat/ohmbot-knowledge.ts');

// Query 2a: 3.3V vs 5V logic rules
const voltAnswer = matchOhmBotQuery('Can I connect a 5V sensor directly to the ESP32 GPIO pins?');
assert.equal(voltAnswer.category, 'circuit');
assert.ok(voltAnswer.text.includes('3.3V logic'), 'Must warn about 3.3V logic level');
assert.ok(voltAnswer.text.includes('VIN pin'), 'Must explain 5V VIN power safety');
console.log('✓ Logic Level & Voltage matching verified.');

// Query 2b: Sensor comparisons
const sensorAnswer = matchOhmBotQuery('What is the difference between DHT22 and BME280?');
assert.equal(sensorAnswer.category, 'circuit');
assert.ok(sensorAnswer.text.includes('BME280'), 'Must recommend BME280 for thesis accuracy');
assert.ok(sensorAnswer.suggestedAction?.type === 'view_catalog', 'Must suggest browsing catalog');
console.log('✓ Sensor comparison matching verified.');

// Query 2c: BOM & Thesis CSV export
const bomAnswer = matchOhmBotQuery('How do we export BOM to CSV for our thesis defense?');
assert.equal(bomAnswer.category, 'bom');
assert.ok(bomAnswer.text.includes('CSV Export'), 'Must explain CSV defense export');
assert.ok(bomAnswer.suggestedAction?.type === 'view_bom', 'Must provide link to BOM workspace');
console.log('✓ BOM & Thesis export matching verified.');

// Query 2d: Region III Central Luzon Logistics
const pickupAnswer = matchOhmBotQuery('Where is the campus pickup station and is it free?');
assert.equal(pickupAnswer.category, 'logistics');
assert.ok(pickupAnswer.text.includes('Campus Lab Station Pickup (Free · ₱0)'), 'Must confirm free campus pickup');
assert.ok(pickupAnswer.text.includes('Pampanga'), 'Must cover Pampanga delivery rate');
console.log('✓ Region III Logistics matching verified.');

// Query 2e: Payment & Official Receipt
const paymentAnswer = matchOhmBotQuery('Can I get an official receipt for university liquidation?');
assert.equal(paymentAnswer.category, 'payment');
assert.ok(paymentAnswer.text.includes('Official Receipts (OR)'), 'Must cover BIR OR liquidation');
console.log('✓ Payments & Official Receipt matching verified.');

// Query 2f: Seller & Human Handoff
const sellerAnswer = matchOhmBotQuery('I need to speak directly with the human seller or lab technician');
assert.equal(sellerAnswer.category, 'seller');
assert.equal(sellerAnswer.suggestedAction?.type, 'switch_seller');
console.log('✓ Human Seller handoff trigger verified.');

// Query 2g: Product Context Inquiry
const productContextAnswer = matchOhmBotQuery('Tell me about this board', {
  id: '1',
  name: 'Espressif ESP32-WROOM-32U Kit',
});
assert.ok(productContextAnswer.text.includes('Espressif ESP32-WROOM-32U Kit'), 'Must reference contextual product name');
console.log('✓ Contextual Product Inquiry matching verified.');

// 3. Verify Reactive Chat Widget Store
console.log('\n--- 3. Verifying Chat Widget Reactive Store ---');
const { chatWidgetStore } = load('lib/chat/chat-widget-store.ts');

let state = chatWidgetStore.getState();
assert.equal(state.isOpen, false, 'Widget must start closed');
assert.equal(state.activeMode, 'bot', 'Widget must default to OhmBot AI mode');

let notified = false;
const unsubscribe = chatWidgetStore.subscribe(() => {
  notified = true;
});

// Test open with product context
chatWidgetStore.open({
  mode: 'seller',
  product: {
    id: 'prod-esp32',
    name: 'ESP32-WROOM-32D',
    price: 245,
    category: 'Microcontrollers',
  },
  prompt: 'Is this board in stock for our laboratory class?',
});

state = chatWidgetStore.getState();
assert.equal(notified, true, 'Subscriber must be notified on open');
assert.equal(state.isOpen, true, 'Widget must be open');
assert.equal(state.activeMode, 'seller', 'Active mode must be seller');
assert.equal(state.productContext?.id, 'prod-esp32');
assert.equal(state.draftPrompt, 'Is this board in stock for our laboratory class?');
assert.equal(state.bubbleDismissed, true, 'Proactive bubble must be dismissed when opened');

// Test close
notified = false;
chatWidgetStore.close();
state = chatWidgetStore.getState();
assert.equal(notified, true, 'Subscriber must be notified on close');
assert.equal(state.isOpen, false, 'Widget must be closed');

// Test dismiss bubble
chatWidgetStore.dismissBubble();
assert.equal(chatWidgetStore.getState().bubbleDismissed, true);

unsubscribe();
console.log('✓ Chat Widget Store reactive lifecycle verified.');

console.log('\n======================================================');
console.log('🎉 ALL OHMBOT ASSISTANT & CHAT WIDGET TESTS PASSED! 🎉');
console.log('======================================================\n');
