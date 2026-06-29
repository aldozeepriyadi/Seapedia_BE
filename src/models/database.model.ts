import { Role } from "../constants/roles";

export type StoredUser = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
};

export type StoredReview = {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Store = {
  id: string;
  sellerId: string;
  storeName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  storeId: string;
  sellerId: string;
  storeName: string;
  storeDescription: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  type: "TOP_UP" | "PAYMENT" | "REFUND";
  amount: number;
  description: string;
  createdAt: string;
};

export type BuyerAddress = {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  subtotal: number;
  storeId: string;
  storeName: string;
  image: string;
};

export type CartSummary = {
  id: string;
  userId: string;
  storeId: string | null;
  storeName: string | null;
  items: CartItem[];
  subtotal: number;
};

export type DeliveryMethod = "Instant" | "Next Day" | "Regular";

export type OrderSummary = {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  deliveryMethod: DeliveryMethod;
  deliveryFee: number;
  subtotal: number;
  ppn: number;
  finalTotal: number;
  discountCode: string | null;
  discountType: string | null;
  discountAmount: number;
  taxableAmount: number;
  status: string;
  createdAt: string;
};

export type DiscountResource = {
  id: string;
  code: string;
  discountAmount: number;
  expiryDate: string;
  remainingUsage?: number;
  createdAt: string;
};

export type Database = {
  users: StoredUser[];
  reviews: StoredReview[];
};
