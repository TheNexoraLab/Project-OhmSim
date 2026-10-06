import type { UserAddress } from "@/types/order";

/** Canonical Region III address fixtures; mutable state belongs to the service. */
export const INITIAL_SAVED_ADDRESSES: UserAddress[] = [
  {
    id: "addr-home",
    label: "Home / Dormitory",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    region: "Region III",
    province: "Pampanga",
    cityMunicipality: "San Fernando",
    barangay: "Dolores",
    streetAddress: "123 Rizal Ave",
    postalCode: "2000",
    isDefault: true,
  },
  {
    id: "addr-lab",
    label: "Campus Electronics Lab",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    region: "Region III",
    province: "Pampanga",
    cityMunicipality: "Angeles City",
    barangay: "Balibago",
    streetAddress: "456 MacArthur Hwy",
    postalCode: "2009",
    isDefault: false,
  },
];
