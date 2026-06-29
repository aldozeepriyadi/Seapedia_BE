import bcrypt from "bcrypt";
import { initializeDatabase, query } from "../config/database";
import { Role } from "../constants/roles";
import { ProductModel } from "../models/product.model";
import { ReviewModel } from "../models/review.model";
import { UserModel } from "../models/user.model";
import { createId } from "./id.service";

async function ensureUser(input: {
  username: string;
  displayName: string;
  password: string;
  roles: Role[];
}) {
  const existing = await UserModel.findByUsername(input.username);
  if (existing) return existing;

  try {
    return await UserModel.create({
      id: createId("usr"),
      username: input.username,
      displayName: input.displayName,
      passwordHash: await bcrypt.hash(input.password, 10),
      roles: input.roles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      const racedUser = await UserModel.findByUsername(input.username);
      if (racedUser) return racedUser;
    }

    throw error;
  }
}

async function ensureDemoStore(sellerId: string) {
  const existing = await query<{ id: string }>(
    "SELECT id FROM stores WHERE seller_id = $1 LIMIT 1",
    [sellerId],
  );

  if (existing.rows[0]) return existing.rows[0].id;

  const id = createId("str");
  await query(
    `INSERT INTO stores (id, seller_id, store_name, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (seller_id) DO NOTHING`,
    [
      id,
      sellerId,
      "Seapedia Curated",
      "Demo store untuk katalog publik dan product management Level 2.",
    ],
  );

  const result = await query<{ id: string }>(
    "SELECT id FROM stores WHERE seller_id = $1 LIMIT 1",
    [sellerId],
  );

  return result.rows[0]!.id;
}

async function seedProducts(storeId: string) {
  const existing = await ProductModel.findByStoreId(storeId);
  if (existing.length > 0) return;

  const products = [
    {
      name: "SEA Hoodie Explorer",
      description:
        "Hoodie clean fit untuk aktivitas kampus, kerja remote, dan perjalanan singkat.",
      price: 189000,
      stock: 24,
      category: "Fashion",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Daily Harbor Backpack",
      description: "Tas harian dengan ruang laptop, kantong cepat, dan material tahan pakai.",
      price: 315000,
      stock: 31,
      category: "Bags",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Focus Dock Lamp",
      description: "Lampu meja minimalis untuk setup belajar, coding, dan membaca.",
      price: 239000,
      stock: 18,
      category: "Home Office",
      image:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Aurora Wireless Mouse",
      description: "Mouse wireless ringan dengan klik halus dan desain ergonomis.",
      price: 159000,
      stock: 42,
      category: "Electronics",
      image:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80",
    },
  ];

  for (const product of products) {
    await ProductModel.create({ storeId, ...product });
  }
}

async function seedReviews() {
  const reviewCount = await ReviewModel.count();
  if (reviewCount > 0) return;

  const now = new Date().toISOString();
  await ReviewModel.createMany([
    {
      id: createId("rev"),
      reviewerName: "Nara",
      rating: 5,
      comment: "Katalognya bersih dan langsung terasa seperti marketplace multi-role.",
      createdAt: now,
    },
    {
      id: createId("rev"),
      reviewerName: "Dimas",
      rating: 4,
      comment: "Flow login dan pemilihan role mudah dipahami sejak awal.",
      createdAt: now,
    },
  ]);
}

export async function seedDemoData() {
  await initializeDatabase();

  await ensureUser({
    username: "admin",
    displayName: "SEAPEDIA Admin",
    password: "Admin123!",
    roles: [Role.ADMIN],
  });

  const seller = await ensureUser({
    username: "sellerdemo",
    displayName: "Demo Seller",
    password: "Seller123!",
    roles: [Role.SELLER],
  });

  await ensureUser({
    username: "buyerdemo",
    displayName: "Demo Buyer",
    password: "Buyer123!",
    roles: [Role.BUYER],
  });

  await ensureUser({
    username: "driverdemo",
    displayName: "Demo Driver",
    password: "Driver123!",
    roles: [Role.DRIVER],
  });

  const storeId = await ensureDemoStore(seller.id);
  await query(
    `UPDATE stores
     SET description = $2,
         updated_at = NOW()
     WHERE id = $1 AND description LIKE '%Level 1%'`,
    [storeId, "Demo store untuk katalog publik dan product management Level 2."],
  );
  await seedProducts(storeId);
  await seedReviews();
}
