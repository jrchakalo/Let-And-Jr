// Database types mirroring the Supabase schema

export type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type GiftStatus = "AVAILABLE" | "RESERVED" | "PAID" | "CLAIMED_MANUALLY";

export interface Family {
  id: string;
  name: string;
  magic_token: string;
  short_code: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  family_id: string;
  name: string;
  rsvp_status: RsvpStatus;
  attended: boolean;
  attended_at: string | null;
  updated_at: string;
  created_at: string;
  family?: Family;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  store_url: string | null;
  status: GiftStatus;
  is_cota: boolean;
  /** Value per single quota unit (only used when is_cota = true) */
  cota_value: number | null;
  /** Number of quotas already paid */
  cotas_paid: number;
  /** Total number of units available for this gift item */
  units_total: number;
  /** Units still available to be gifted */
  units_remaining: number;
  reserved_by_name: string | null;
  reserved_at: string | null;
  created_at: string;
}

export interface GiftContribution {
  id: string;
  gift_id: string;
  contributor_name: string;
  contributor_email: string | null;
  contribution_type:
    | "MERCADOPAGO_GIFT"
    | "MERCADOPAGO_COTA"
    | "MANUAL_CLAIM"
    | "STORE_CONFIRM"
    | "MANUAL_COTA";
  quantity: number;
  amount: number | null;
  status: "CONFIRMED";
  mercadopago_payment_id: string | null;
  created_at: string;
  gift?: Pick<Gift, "id" | "name" | "status">;
}

export interface FamilyWithGuests extends Family {
  guests: Guest[];
}
