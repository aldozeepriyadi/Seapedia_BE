import { Request, Response } from "express";
import { ProductModel } from "../models/product.model";

export class ProductController {
  static async index(_req: Request, res: Response) {
    res.json({ products: await ProductModel.findMany() });
  }

  static async show(req: Request, res: Response) {
    const product = await ProductModel.findById(String(req.params.id));

    if (!product) {
      res.status(404).json({ message: "Produk tidak ditemukan." });
      return;
    }

    res.json({ product });
  }
}
