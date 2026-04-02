// Product types that support samples
export type SampleProductType = 'mosaico' | 'vetrite';

// A single item in the sample cart
export interface SampleCartItem {
  nid: number;
  type: SampleProductType;
  title: string;
  imageUrl: string | null;
  collection: string | null;
  sampleFormat: string | null; // e.g. "4x4" for vetrite
  variant: string | null; // finish name for vetrite, null for mosaico
}

// The cart state
export interface SampleCart {
  items: SampleCartItem[];
}

// Free tier limits per product type
export const FREE_TIER_LIMITS: Record<SampleProductType, number> = {
  mosaico: 5,
  vetrite: 3,
} as const;

// Flat fee when exceeding free tier (USD)
export const PAID_TIER_FEE = 20;

// Maximum total items in cart
export const MAX_ITEMS = 15;

// Pricing summary returned by getPricingSummary
export interface PricingSummary {
  mosaicoCount: number;
  vetriteCount: number;
  mosaicoFree: boolean; // true if mosaicoCount <= 5
  vetriteFree: boolean; // true if vetriteCount <= 3
  itemsFee: number; // 0 or 20
}

// Shipping region
export interface ShippingRegion {
  name: string;
  shipping: string; // e.g. "3-4 business days (USD)"
  cost: number[]; // 4 tiers: [1-3 items, 4-6, 7-10, 11+]
}

// Shipping data structure
export interface ShippingData {
  states: Array<{ state: string; region: string }>;
  regions: Record<string, ShippingRegion>;
}

// Checkout form data
export interface CheckoutFormData {
  // Required
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  address: string;
  city: string;
  state: string; // US state
  zip: string;
  phone: string;
  // Optional
  addressExtra: string;
  projectType: string;
  projectStatus: string;
  budget: string;
  location: string;
  materialQty: string;
}

// Payload sent to server action
export interface CheckoutPayload {
  items: Array<{
    nid: number;
    title: string;
    variant: string | null;
    type: SampleProductType;
  }>;
  shipping: CheckoutFormData;
  itemsFee: number;
  shippingCost: number;
  shippingTime: string;
  total: number;
}

// Response from Drupal ecstore
export interface CheckoutResponse {
  order_id: string;
  status: string;
  approval_url: string;
}
