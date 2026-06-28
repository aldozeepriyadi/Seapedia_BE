"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_model_1 = require("../models/product.model");
class ProductController {
    static async index(_req, res) {
        res.json({ products: await product_model_1.ProductModel.findMany() });
    }
    static async show(req, res) {
        const product = await product_model_1.ProductModel.findById(String(req.params.id));
        if (!product) {
            res.status(404).json({ message: "Produk tidak ditemukan." });
            return;
        }
        res.json({ product });
    }
}
exports.ProductController = ProductController;
