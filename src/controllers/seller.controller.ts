import { Response } from "express";
import { ProductModel } from "../models/product.model";
import { OrderModel } from "../models/order.model";
import { StoreModel } from "../models/store.model";
import { AuthedRequest } from "../types/auth";
import { productSchema, storeSchema } from "../validators/seller.validator";

const defaultProductImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export class SellerController {
  static async getStore(req: AuthedRequest, res: Response) {
    const store = await StoreModel.findBySellerId(req.auth!.userId);
    res.json({ store });
  }

  static async saveStore(req: AuthedRequest, res: Response) {
    const payload = storeSchema.parse(req.body);
    const existingStore = await StoreModel.findBySellerId(req.auth!.userId);

    try {
      const store = existingStore
        ? await StoreModel.updateForSeller(
            req.auth!.userId,
            payload.storeName,
            payload.description,
          )
        : await StoreModel.createForSeller(
            req.auth!.userId,
            payload.storeName,
            payload.description,
          );

      res.status(existingStore ? 200 : 201).json({ store });
    } catch (error) {
      if (isUniqueViolation(error)) {
        res.status(409).json({ message: "Nama toko sudah digunakan seller lain." });
        return;
      }

      throw error;
    }
  }

  static async getProducts(req: AuthedRequest, res: Response) {
    const store = await StoreModel.findBySellerId(req.auth!.userId);

    if (!store) {
      res.json({ store: null, products: [] });
      return;
    }

    const products = await ProductModel.findByStoreId(store.id);
    res.json({ store, products });
  }

  static async getOrders(req: AuthedRequest, res: Response) {
    const orders = await OrderModel.findSellerOrders(req.auth!.userId);
    res.json({ orders });
  }

  static async createProduct(req: AuthedRequest, res: Response) {
    const store = await StoreModel.findBySellerId(req.auth!.userId);

    if (!store) {
      res.status(400).json({ message: "Buat store terlebih dahulu sebelum menambah produk." });
      return;
    }

    const payload = productSchema.parse(req.body);
    const product = await ProductModel.create({
      storeId: store.id,
      ...payload,
      image: payload.image || defaultProductImage,
    });

    res.status(201).json({ product });
  }

  static async updateProduct(req: AuthedRequest, res: Response) {
    const store = await StoreModel.findBySellerId(req.auth!.userId);

    if (!store) {
      res.status(400).json({ message: "Store seller belum dibuat." });
      return;
    }

    const payload = productSchema.parse(req.body);
    const product = await ProductModel.updateForStore(String(req.params.id), store.id, {
      ...payload,
      image: payload.image || defaultProductImage,
    });

    if (!product) {
      res.status(404).json({ message: "Produk tidak ditemukan di store kamu." });
      return;
    }

    res.json({ product });
  }

  static async deleteProduct(req: AuthedRequest, res: Response) {
    const store = await StoreModel.findBySellerId(req.auth!.userId);

    if (!store) {
      res.status(400).json({ message: "Store seller belum dibuat." });
      return;
    }

    const deleted = await ProductModel.deleteForStore(String(req.params.id), store.id);

    if (!deleted) {
      res.status(404).json({ message: "Produk tidak ditemukan di store kamu." });
      return;
    }

    res.json({ message: "Produk berhasil dihapus." });
  }
}
