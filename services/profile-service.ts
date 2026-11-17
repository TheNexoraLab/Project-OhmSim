import type { UserProfile, UserPreferences, UserAddress } from "@/types/profile";
import { REGION_3_PROVINCES, Region3Province } from "@/types/order";
import { INITIAL_USER_PROFILE, INITIAL_USER_PREFERENCES } from "@/lib/mocks/profile";
import { INITIAL_SAVED_ADDRESSES } from "@/lib/mocks/addresses";

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
// Backend Synchronization Helper
// ---------------------------------------------------------------------------
export async function syncProfileFromApi(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const [profileRes, addrRes] = await Promise.all([
      fetch("/api/profile", { cache: "no-store", credentials: "include" }),
      fetch("/api/profile/addresses", { cache: "no-store", credentials: "include" }),
    ]);

    if (profileRes.ok) {
      const data = await profileRes.json();
      if (data.profile) {
        profileState = {
          ...profileState,
          firstName: data.profile.firstName || profileState.firstName,
          lastName: data.profile.lastName || profileState.lastName,
          email: data.profile.email || profileState.email,
          mobile: data.profile.phone || profileState.mobile,
        };
        notifyProfile();
      }
    }

    if (addrRes.ok) {
      const addrData = await addrRes.json();
      if (Array.isArray(addrData.addresses)) {
        interface ApiAddr {
          id: string;
          label: string;
          recipientName: string;
          phone: string;
          street: string;
          barangay: string;
          city: string;
          province: string;
          postalCode?: string;
          isDefault?: boolean;
        }

        const liveAddresses: UserAddress[] = addrData.addresses.map((a: ApiAddr) => ({
          id: a.id,
          label: a.label || "Saved Address",
          recipientName: a.recipientName,
          contactNumber: a.phone,
          region: "Region III",
          province: a.province as Region3Province,
          cityMunicipality: a.city,
          barangay: a.barangay,
          streetAddress: a.street,
          postalCode: a.postalCode || "2000",
          isDefault: Boolean(a.isDefault),
        }));

        if (liveAddresses.length > 0) {
          addressesState = liveAddresses;
          notifyAddresses();
        }
      }
    }
  } catch (error) {
    console.warn("Could not sync profile/addresses from backend:", error);
  }
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
  const email = data.email !== undefined ? data.email.trim().toLowerCase() : profileState.email;

  if (!firstName) {
    return { success: false, error: "First name is required." };
  }
  if (!lastName) {
    return { success: false, error: "Last name is required." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "A valid email address is required." };
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
    email,
    studentOrGovId: data.studentOrGovId !== undefined ? data.studentOrGovId.trim() : profileState.studentOrGovId,
  };

  notifyProfile();

  if (typeof window !== "undefined") {
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone: mobile,
      }),
    }).catch((err) => {
      console.warn("Failed to patch profile to backend:", err);
    });
  }

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

  if (typeof window !== "undefined") {
    fetch("/api/profile/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        label: newAddress.label,
        recipientName: newAddress.recipientName,
        phone: newAddress.contactNumber,
        street: newAddress.streetAddress,
        barangay: newAddress.barangay,
        city: newAddress.cityMunicipality,
        province: newAddress.province,
        postalCode: newAddress.postalCode,
        isDefault: newAddress.isDefault,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const resData = await res.json();
          if (resData.address?.id) {
            newAddress.id = resData.address.id;
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to create address on backend API:", err);
      });
  }

  return { success: true, address: newAddress };
}

export function deleteAddress(id: string): { success: boolean; error?: string } {
  const targetIndex = addressesState.findIndex((a) => a.id === id);
  if (targetIndex === -1) {
    return { success: false, error: "Address not found." };
  }

  const target = addressesState[targetIndex];
  const remaining = addressesState.filter((a) => a.id !== id);

  if (target.isDefault && remaining.length > 0) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }

  addressesState = remaining;
  notifyAddresses();

  if (typeof window !== "undefined") {
    fetch(`/api/profile/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch((err) => {
      console.warn("Failed to delete address on backend:", err);
    });
  }

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

  if (typeof window !== "undefined") {
    fetch(`/api/profile/addresses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isDefault: true }),
    }).catch((err) => {
      console.warn("Failed to set default address on backend:", err);
    });
  }

  return { success: true };
}

export function resetProfileStore(): void {
  profileState = { ...INITIAL_USER_PROFILE };
  preferencesState = { ...INITIAL_USER_PREFERENCES };
  addressesState = JSON.parse(JSON.stringify(INITIAL_SAVED_ADDRESSES));
  notifyProfile();
  notifyPreferences();
  notifyAddresses();
}
