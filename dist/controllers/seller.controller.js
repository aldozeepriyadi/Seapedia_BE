"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerController = void 0;
const product_model_1 = require("../models/product.model");
const order_model_1 = require("../models/order.model");
const store_model_1 = require("../models/store.model");
const seller_validator_1 = require("../validators/seller.validator");
const defaultProductImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";
function isUniqueViolation(error) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
class SellerController {
    static async getStore(req, res) {
        const store = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        res.json({ store });
    }
    static async saveStore(req, res) {
        const payload = seller_validator_1.storeSchema.parse(req.body);
        const existingStore = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        try {
            const store = existingStore
                ? await store_model_1.StoreModel.updateForSeller(req.auth.userId, payload.storeName, payload.description)
                : await store_model_1.StoreModel.createForSeller(req.auth.userId, payload.storeName, payload.description);
            res.status(existingStore ? 200 : 201).json({ store });
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                res.status(409).json({ message: "Nama toko sudah digunakan seller lain." });
                return;
            }
            throw error;
        }
    }
    static async getProducts(req, res) {
        const store = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        if (!store) {
            res.json({ store: null, products: [] });
            return;
        }
        const products = await product_model_1.ProductModel.findByStoreId(store.id);
        res.json({ store, products });
    }
    static async getOrders(req, res) {
        const orders = await order_model_1.OrderModel.findSellerOrders(req.auth.userId);
        res.json({ orders });
    }
    static async getReport(req, res) {
        const report = await order_model_1.OrderModel.sellerReport(req.auth.userId);
        res.json({ report });
    }
    static async processOrder(req, res) {
        const order = await order_model_1.OrderModel.processBySeller(String(req.params.id), req.auth.userId);
        if (!order) {
            res.status(404).json({
                message: "Order tidak ditemukan atau statusnya bukan Sedang Dikemas.",
            });
            return;
        }
        res.json({ order });
    }
    static async createProduct(req, res) {
        const store = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        if (!store) {
            res.status(400).json({ message: "Buat store terlebih dahulu sebelum menambah produk." });
            return;
        }
        const payload = seller_validator_1.productSchema.parse(req.body);
        const product = await product_model_1.ProductModel.create({
            storeId: store.id,
            ...payload,
            image: payload.image || defaultProductImage,
        });
        res.status(201).json({ product });
    }
    static async updateProduct(req, res) {
        const store = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        if (!store) {
            res.status(400).json({ message: "Store seller belum dibuat." });
            return;
        }
        const payload = seller_validator_1.productSchema.parse(req.body);
        const product = await product_model_1.ProductModel.updateForStore(String(req.params.id), store.id, {
            ...payload,
            image: payload.image || defaultProductImage,
        });
        if (!product) {
            res.status(404).json({ message: "Produk tidak ditemukan di store kamu." });
            return;
        }
        res.json({ product });
    }
    static async deleteProduct(req, res) {
        const store = await store_model_1.StoreModel.findBySellerId(req.auth.userId);
        if (!store) {
            res.status(400).json({ message: "Store seller belum dibuat." });
            return;
        }
        const deleted = await product_model_1.ProductModel.deleteForStore(String(req.params.id), store.id);
        if (!deleted) {
            res.status(404).json({ message: "Produk tidak ditemukan di store kamu." });
            return;
        }
        res.json({ message: "Produk berhasil dihapus." });
    }
}
exports.SellerController = SellerController;
