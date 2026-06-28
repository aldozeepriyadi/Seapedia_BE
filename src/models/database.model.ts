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
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  users: StoredUser[];
  reviews: StoredReview[];
};
