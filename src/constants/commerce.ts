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

export const ppnRate = 0.12;

export const OrderStatus = {
  PACKING: "Sedang Dikemas",
  WAITING_DRIVER: "Menunggu Pengirim",
  SHIPPING: "Sedang Dikirim",
  COMPLETED: "Pesanan Selesai",
  RETURNED: "Dikembalikan",
} as const;

export const DeliveryJobStatus = {
  AVAILABLE: "AVAILABLE",
  TAKEN: "TAKEN",
  COMPLETED: "COMPLETED",
  RETURNED: "RETURNED",
} as const;

export const deliverySlaHours: Record<DeliveryMethod, number> = {
  [DeliveryMethod.INSTANT]: 2,
  [DeliveryMethod.NEXT_DAY]: 24,
  [DeliveryMethod.REGULAR]: 72,
};


