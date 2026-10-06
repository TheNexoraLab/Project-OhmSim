import type { UserAddress, Region3Province } from "@/types/order";

export type ProfileTab = "account" | "addresses" | "security" | "preferences";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  company: string;
  role: string;
  bio: string;
}

export interface UserPreferences {
  emailOrders: boolean;
  emailPromos: boolean;
  emailStock: boolean;
}

export type { UserAddress, Region3Province };
