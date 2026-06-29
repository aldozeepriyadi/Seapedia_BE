import { Response } from "express";
import { DiscountModel } from "../models/discount.model";
import { AuthedRequest } from "../types/auth";
import { HttpError } from "../utils/http-error";
import { promoSchema, voucherSchema } from "../validators/admin.validator";

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export class AdminController {
  static async listVouchers(_req: AuthedRequest, res: Response) {
    res.json({ vouchers: await DiscountModel.listVouchers() });
  }

  static async createVoucher(req: AuthedRequest, res: Response) {
    const payload = voucherSchema.parse(req.body);

    try {
      const voucher = await DiscountModel.createVoucher({
        ...payload,
        createdBy: req.auth!.userId,
      });
      res.status(201).json({ voucher });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, "Code voucher sudah digunakan.");
      }

      throw error;
    }
  }

  static async showVoucher(req: AuthedRequest, res: Response) {
    const voucher = await DiscountModel.findVoucher(String(req.params.id).toUpperCase());
    if (!voucher) throw new HttpError(404, "Voucher tidak ditemukan.");
    res.json({ voucher });
  }

  static async listPromos(_req: AuthedRequest, res: Response) {
    res.json({ promos: await DiscountModel.listPromos() });
  }

  static async createPromo(req: AuthedRequest, res: Response) {
    const payload = promoSchema.parse(req.body);

    try {
      const promo = await DiscountModel.createPromo({
        ...payload,
        createdBy: req.auth!.userId,
      });
      res.status(201).json({ promo });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HttpError(409, "Code promo sudah digunakan.");
      }

      throw error;
    }
  }

  static async showPromo(req: AuthedRequest, res: Response) {
    const promo = await DiscountModel.findPromo(String(req.params.id).toUpperCase());
    if (!promo) throw new HttpError(404, "Promo tidak ditemukan.");
    res.json({ promo });
  }
}
