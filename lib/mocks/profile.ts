import type { UserProfile, UserPreferences } from "@/types/profile";

export const INITIAL_USER_PROFILE: UserProfile = {
  firstName: "Alex",
  lastName: "Rivera",
  email: "alex.rivera@ohmsim.ph",
  mobile: "09171234567",
  company: "MakerSpace PH",
  role: "Electronics Engineer",
  bio: "Electronics hobbyist and embedded systems developer based in Pampanga, Central Luzon.",
};

export const INITIAL_USER_PREFERENCES: UserPreferences = {
  emailOrders: true,
  emailPromos: false,
  emailStock: true,
};
