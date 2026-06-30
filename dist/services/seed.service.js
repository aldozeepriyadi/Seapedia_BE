"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = seedDemoData;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
const roles_1 = require("../constants/roles");
const product_model_1 = require("../models/product.model");
const review_model_1 = require("../models/review.model");
const user_model_1 = require("../models/user.model");
const address_model_1 = require("../models/address.model");
const wallet_model_1 = require("../models/wallet.model");
const id_service_1 = require("./id.service");
async function ensureUser(input) {
    const existing = await user_model_1.UserModel.findByUsername(input.username);
    if (existing) {
        if (existing.email !== input.email) {
            await (0, database_1.query)("UPDATE users SET email = $2, updated_at = NOW() WHERE id = $1", [
                existing.id,
                input.email,
            ]);
            return (await user_model_1.UserModel.findByUsername(input.username)) ?? existing;
        }
        return existing;
    }
    try {
        return await user_model_1.UserModel.create({
            id: (0, id_service_1.createId)("usr"),
            username: input.username,
            email: input.email,
            displayName: input.displayName,
            passwordHash: await bcrypt_1.default.hash(input.password, 10),
            roles: input.roles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505") {
            const racedUser = await user_model_1.UserModel.findByUsername(input.username);
            if (racedUser)
                return racedUser;
        }
        throw error;
    }
}
async function ensureDemoStore(sellerId) {
    const existing = await (0, database_1.query)("SELECT id FROM stores WHERE seller_id = $1 LIMIT 1", [sellerId]);
    if (existing.rows[0])
        return existing.rows[0].id;
    const id = (0, id_service_1.createId)("str");
    await (0, database_1.query)(`INSERT INTO stores (id, seller_id, store_name, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (seller_id) DO NOTHING`, [
        id,
        sellerId,
        "Seapedia Curated",
        "Demo store untuk katalog publik dan product management Level 2.",
    ]);
    const result = await (0, database_1.query)("SELECT id FROM stores WHERE seller_id = $1 LIMIT 1", [sellerId]);
    return result.rows[0].id;
}
async function seedProducts(storeId) {
    const existing = await product_model_1.ProductModel.findByStoreId(storeId);
    if (existing.length > 0)
        return;
    const products = [
        {
            name: "SEA Hoodie Explorer",
            description: "Hoodie clean fit untuk aktivitas kampus, kerja remote, dan perjalanan singkat.",
            price: 189000,
            stock: 24,
            category: "Fashion",
            image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
        },
        {
            name: "Daily Harbor Backpack",
            description: "Tas harian dengan ruang laptop, kantong cepat, dan material tahan pakai.",
            price: 315000,
            stock: 31,
            category: "Bags",
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
        },
        {
            name: "Focus Dock Lamp",
            description: "Lampu meja minimalis untuk setup belajar, coding, dan membaca.",
            price: 239000,
            stock: 18,
            category: "Home Office",
            image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
        },
        {
            name: "Aurora Wireless Mouse",
            description: "Mouse wireless ringan dengan klik halus dan desain ergonomis.",
            price: 159000,
            stock: 42,
            category: "Electronics",
            image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80",
        },
    ];
    for (const product of products) {
        await product_model_1.ProductModel.create({ storeId, ...product });
    }
}
async function seedReviews() {
    const reviewCount = await review_model_1.ReviewModel.count();
    if (reviewCount > 0)
        return;
    const now = new Date().toISOString();
    await review_model_1.ReviewModel.createMany([
        {
            id: (0, id_service_1.createId)("rev"),
            reviewerName: "Nara",
            rating: 5,
            comment: "Katalognya bersih dan langsung terasa seperti marketplace multi-role.",
            createdAt: now,
        },
        {
            id: (0, id_service_1.createId)("rev"),
            reviewerName: "Dimas",
            rating: 4,
            comment: "Flow login dan pemilihan role mudah dipahami sejak awal.",
            createdAt: now,
        },
    ]);
}
async function seedDiscounts(adminId) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    await (0, database_1.query)(`INSERT INTO vouchers (id, code, discount_amount, expiry_date, remaining_usage, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (code) DO NOTHING`, [(0, id_service_1.createId)("vcr"), "WELCOME50", 50000, expiryDate.toISOString(), 25, adminId]);
    await (0, database_1.query)(`INSERT INTO promos (id, code, discount_amount, expiry_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (code) DO NOTHING`, [(0, id_service_1.createId)("prm"), "PROMO25", 25000, expiryDate.toISOString(), adminId]);
}
async function seedDemoData() {
    await (0, database_1.initializeDatabase)();
    const admin = await ensureUser({
        username: "admin",
        email: "admin@seapedia.test",
        displayName: "SEAPEDIA Admin",
        password: "Admin123!",
        roles: [roles_1.Role.ADMIN],
    });
    const seller = await ensureUser({
        username: "sellerdemo",
        email: "seller@seapedia.test",
        displayName: "Demo Seller",
        password: "Seller123!",
        roles: [roles_1.Role.SELLER],
    });
    const buyer = await ensureUser({
        username: "buyerdemo",
        email: "buyer@seapedia.test",
        displayName: "Demo Buyer",
        password: "Buyer123!",
        roles: [roles_1.Role.BUYER],
    });
    await ensureUser({
        username: "driverdemo",
        email: "driver@seapedia.test",
        displayName: "Demo Driver",
        password: "Driver123!",
        roles: [roles_1.Role.DRIVER],
    });
    const storeId = await ensureDemoStore(seller.id);
    await (0, database_1.query)(`UPDATE stores
     SET description = $2,
         updated_at = NOW()
     WHERE id = $1 AND description LIKE '%Level 1%'`, [storeId, "Demo store untuk katalog publik dan product management Level 2."]);
    await seedProducts(storeId);
    await seedReviews();
    await seedDiscounts(admin.id);
    const wallet = await wallet_model_1.WalletModel.getSummary(buyer.id);
    if (wallet.balance === 0) {
        await wallet_model_1.WalletModel.topUp(buyer.id, 1000000);
    }
    const addresses = await address_model_1.AddressModel.findManyByUser(buyer.id);
    if (addresses.length === 0) {
        await address_model_1.AddressModel.create(buyer.id, {
            recipientName: "Demo Buyer",
            phone: "081234567890",
            addressLine: "Jl. SEAPEDIA Demo No. 1",
            city: "Jakarta",
            postalCode: "10110",
            isPrimary: true,
        });
    }
}
