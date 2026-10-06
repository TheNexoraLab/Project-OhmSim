import type { UserProfile, UserPreferences, UserAddress } from "@/types/profile";
import { REGION_3_PROVINCES, Region3Province } from "@/types/order";
import { INITIAL_USER_PROFILE, INITIAL_USER_PREFERENCES } from "@/lib/mocks/profile";
import { INITIAL_SAVED_ADDRESSES } from "@/services/order-service";

/**
 * Validation Helpers for Profile & Addresses
 */
export function validatePhilippineMobile(mobile: string): boolean {
  // Must be exactly 11 digits starting with 09
  return /^09\d{9}$/.test(mobile.trim());
}

export function validateRegion3Province(province: string): province is Region3Province {
  return (REGION_3_PROVINCES as readonly string[]).includes(province);
}

// ---------------------------------------------------------------------------
// In-Memory Profile & Address Store
// ---------------------------------------------------------------------------
let profileState: UserProfile = { ...INITIAL_USER_PROFILE };
let preferencesState: UserPreferences = { ...INITIAL_USER_PREFERENCES };
let addressesState: UserAddress[] = JSON.parse(JSON.stringify(INITIAL_SAVED_ADDRESSES));

const profileListeners = new Set<() => void>();
const preferencesListeners = new Set<() => void>();
const addressesListeners = new Set<() => void>();

function notifyProfile() {
  profileListeners.forEach((l) => l());
}

function notifyPreferences() {
  preferencesListeners.forEach((l) => l());
}

function notifyAddresses() {
  addressesListeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// Profile Subscriptions & Mutations
// ---------------------------------------------------------------------------
export function getProfileSnapshot(): UserProfile {
  return profileState;
}

export function subscribeProfile(listener: () => void): () => void {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function updateProfile(data: Partial<UserProfile>): { success: boolean; error?: string } {
  const firstName = data.firstName !== undefined ? data.firstName.trim() : profileState.firstName;
  const lastName = data.lastName !== undefined ? data.lastName.trim() : profileState.lastName;
  const mobile = data.mobile !== undefined ? data.mobile.trim() : profileState.mobile;

  if (!firstName) {
    return { success: false, error: "First name is required." };
  }
  if (!lastName) {
    return { success: false, error: "Last name is required." };
  }
  if (!validatePhilippineMobile(mobile)) {
    return { success: false, error: "Mobile number must be an 11-digit Philippine mobile starting with 09." };
  }

  profileState = {
    ...profileState,
    ...data,
    firstName,
    lastName,
    mobile,
    // Email is read-only in v1 (identity changes require server auth)
    email: profileState.email,
  };

  notifyProfile();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Preferences Subscriptions & Mutations
// ---------------------------------------------------------------------------
export function getPreferencesSnapshot(): UserPreferences {
  return preferencesState;
}

export function subscribePreferences(listener: () => void): () => void {
  preferencesListeners.add(listener);
  return () => {
    preferencesListeners.delete(listener);
  };
}

export function updatePreferences(data: Partial<UserPreferences>): void {
  preferencesState = {
    ...preferencesState,
    ...data,
  };
  notifyPreferences();
}

// ---------------------------------------------------------------------------
// Address Book Subscriptions & Mutations (Strictly BR-048 & BR-045)
// ---------------------------------------------------------------------------
export function getAddressesSnapshot(): UserAddress[] {
  return addressesState;
}

export function subscribeAddresses(listener: () => void): () => void {
  addressesListeners.add(listener);
  return () => {
    addressesListeners.delete(listener);
  };
}

let nextAddressSequence = 1;

export function generateAddressId(): string {
  const timestamp = Date.now();
  const seq = nextAddressSequence++;
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `addr-${timestamp}-${seq}-${randomSuffix}`;
}

export function addAddress(
  data: Omit<UserAddress, "id">
): { success: boolean; error?: string; address?: UserAddress } {
  // BR-048: Maximum 2 saved addresses
  if (addressesState.length >= 2) {
    return {
      success: false,
      error: "Maximum limit of 2 saved addresses reached per Region III fulfillment specification.",
    };
  }

  // Label check
  if (!data.label?.trim()) {
    return { success: false, error: "Address label is required (e.g. Home, Campus Lab)." };
  }

  // Recipient Name
  if (!data.recipientName?.trim()) {
    return { success: false, error: "Recipient full name is required." };
  }

  // Contact number
  if (!validatePhilippineMobile(data.contactNumber)) {
    return { success: false, error: "Contact number must be an 11-digit mobile starting with 09 (e.g. 09171234567)." };
  }

  // BR-045: Region III coverage strictly enforced
  if (!validateRegion3Province(data.province)) {
    return {
      success: false,
      error: `Delivery address must be within Region III (Central Luzon). Allowed provinces: ${REGION_3_PROVINCES.join(", ")}.`,
    };
  }

  if (!data.cityMunicipality?.trim()) {
    return { success: false, error: "City or municipality is required." };
  }
  if (!data.barangay?.trim()) {
    return { success: false, error: "Barangay is required." };
  }
  if (!data.streetAddress?.trim()) {
    return { success: false, error: "Street address is required." };
  }
  if (!data.postalCode?.trim()) {
    return { success: false, error: "Postal code is required." };
  }

  const isFirst = addressesState.length === 0;
  const isDefault = isFirst ? true : Boolean(data.isDefault);

  const newAddress: UserAddress = {
    id: generateAddressId(),
    label: data.label.trim(),
    recipientName: data.recipientName.trim(),
    contactNumber: data.contactNumber.trim(),
    region: "Region III",
    province: data.province,
    cityMunicipality: data.cityMunicipality.trim(),
    barangay: data.barangay.trim(),
    streetAddress: data.streetAddress.trim(),
    postalCode: data.postalCode.trim(),
    isDefault,
  };

  if (isDefault) {
    addressesState = addressesState.map((a) => ({ ...a, isDefault: false }));
  }

  addressesState = [...addressesState, newAddress];
  notifyAddresses();

  return { success: true, address: newAddress };
}

export function deleteAddress(id: string): { success: boolean; error?: string } {
  const targetIndex = addressesState.findIndex((a) => a.id === id);
  if (targetIndex === -1) {
    return { success: false, error: "Address not found." };
  }

  const target = addressesState[targetIndex];
  const remaining = addressesState.filter((a) => a.id !== id);

  // If deleted address was the default and another address remains, make the remaining one default
  if (target.isDefault && remaining.length > 0) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }

  addressesState = remaining;
  notifyAddresses();
  return { success: true };
}

export function setDefaultAddress(id: string): { success: boolean; error?: string } {
  const target = addressesState.find((a) => a.id === id);
  if (!target) {
    return { success: false, error: "Address not found." };
  }

  if (target.isDefault) {
    return { success: true };
  }

  addressesState = addressesState.map((a) => ({
    ...a,
    isDefault: a.id === id,
  }));

  notifyAddresses();
  return { success: true };
}

/**
 * Reset store to canonical initial fixtures (useful for testing)
 */
export function resetProfileStore(): void {
  profileState = { ...INITIAL_USER_PROFILE };
  preferencesState = { ...INITIAL_USER_PREFERENCES };
  addressesState = JSON.parse(JSON.stringify(INITIAL_SAVED_ADDRESSES));
  notifyProfile();
  notifyPreferences();
  notifyAddresses();
}
