'use server';

import { DRUPAL_BASE_URL } from '@/lib/drupal/config';

interface SampleCheckoutPayload {
  items: Array<{
    nid: number;
    title: string;
    variant: string | null;
    type: string;
  }>;
  shipping: {
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    company: string;
    address: string;
    addressExtra: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    projectType: string;
    projectStatus: string;
    budget: string;
    location: string;
    materialQty: string;
  };
  itemsFee: number;
  shippingCost: number;
  shippingTime: string;
  total: number;
}

type SampleCheckoutResult =
  | { success: true; approvalUrl: string }
  | { success: false; error: string };

export async function submitSampleCheckout(
  payload: SampleCheckoutPayload,
): Promise<SampleCheckoutResult> {
  // Validate required fields server-side
  if (!payload.items || payload.items.length === 0) {
    return { success: false, error: 'No items in cart' };
  }
  if (
    !payload.shipping.email ||
    !payload.shipping.firstName ||
    !payload.shipping.lastName
  ) {
    return { success: false, error: 'Missing required shipping information' };
  }
  if (payload.total < 0) {
    return { success: false, error: 'Invalid total' };
  }

  try {
    // Call Drupal ecstore checkout endpoint.
    // Drupal expects { total } and returns { approval_url, order_id, status }.
    // Extra fields (items, shipping) are passed for Drupal to use if needed;
    // if Drupal ignores them, PayPal order is still created from total alone.
    const response = await fetch(
      `${DRUPAL_BASE_URL}/ecstore/checkout/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total: payload.total,
          items: payload.items,
          shipping: payload.shipping,
          items_fee: payload.itemsFee,
          shipping_cost: payload.shippingCost,
          shipping_time: payload.shippingTime,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        '[sample-checkout] Drupal returned',
        response.status,
        response.statusText,
      );
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = (await response.json()) as {
      approval_url?: string;
      order_id?: string;
      status?: string;
      message?: string;
    };

    if (data.approval_url) {
      return { success: true, approvalUrl: data.approval_url };
    }

    return {
      success: false,
      error: data.message ?? 'No approval URL received',
    };
  } catch (error) {
    console.error('[sample-checkout] Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}
