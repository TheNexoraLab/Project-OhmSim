import assert from "node:assert/strict";
import path from "node:path";
import { createLoader } from "../ui/helpers/load-typescript.mjs";

const load = createLoader(path.resolve(import.meta.dirname, "../.."));
// Order-first import exercises the actual module graph, not a copied store.
const orders = load("services/order-service.ts");
const profile = load("services/profile-service.ts");
const fixtures = load("lib/mocks/addresses.ts").INITIAL_SAVED_ADDRESSES;
profile.resetProfileStore();
assert.deepEqual(orders.getSavedAddresses(), fixtures);
assert.equal(orders.INITIAL_SAVED_ADDRESSES, fixtures, "Legacy fixture export stays compatible");
assert.deepEqual(orders.getMockOrders().map(order => order.id), ["o1", "o2", "o3", "o4", "o5"]);

const detached = orders.getSavedAddresses();
detached[0].label = "Must not leak";
detached.pop();
assert.deepEqual(profile.getAddressesSnapshot(), fixtures, "Readers cannot mutate central state");
let notifications = 0;
const unsubscribe = profile.subscribeAddresses(() => notifications++);
const initial = profile.getAddressesSnapshot();
assert.equal(profile.setDefaultAddress("unknown").success, false);
assert.equal(profile.getAddressesSnapshot(), initial);
assert.equal(notifications, 0);
assert.equal(profile.setDefaultAddress("addr-lab").success, true);
assert.deepEqual(orders.getSavedAddresses().filter(address => address.isDefault).map(address => address.id), ["addr-lab"]);
assert.equal(profile.deleteAddress("addr-home").success, true);
assert.deepEqual(orders.getSavedAddresses().map(address => address.id), ["addr-lab"]);

const address = { ...fixtures[0], label: "Shared integration address", isDefault: true };
delete address.id;
const added = profile.addAddress(address);
assert.equal(added.success, true);
assert.deepEqual(orders.getSavedAddresses(), profile.getAddressesSnapshot());
assert.deepEqual(orders.getSavedAddresses().filter(value => value.isDefault).map(value => value.id), [added.address.id]);
const full = profile.getAddressesSnapshot();
assert.equal(profile.addAddress(address).success, false);
assert.equal(profile.getAddressesSnapshot(), full);
assert.equal(profile.deleteAddress(added.address.id).success, true);
assert.deepEqual(orders.getSavedAddresses().filter(value => value.isDefault).map(value => value.id), ["addr-lab"]);
profile.updateProfile({ firstName: "Integration" });
profile.updatePreferences({ emailOrders: false });
profile.resetProfileStore();
assert.deepEqual(orders.getSavedAddresses(), fixtures);
assert.equal(profile.getProfileSnapshot().firstName, "Alex");
assert.equal(profile.getPreferencesSnapshot().emailOrders, true);
unsubscribe();
console.log("PASS actual shared Profile/order address source, defensive reads, defaults, capacity, resets and five preserved orders");
