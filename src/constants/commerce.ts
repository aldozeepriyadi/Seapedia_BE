export const DeliveryMethod = {
  INSTANT: "Instant",
  NEXT_DAY: "Next Day",
  REGULAR: "Regular",
} as const;

export type DeliveryMethod = (typeof DeliveryMethod)[keyof typeof DeliveryMethod];

export const deliveryFees: Record<DeliveryMethod, number> = {
  [DeliveryMethod.INSTANT]: 30000,
  [DeliveryMethod.NEXT_DAY]: 18000,
  [DeliveryMethod.REGULAR]: 10000,
};

export const ppnRate = 0.11;

export const OrderStatus = {
  PACKING: "Sedang Dikemas",
} as const;
