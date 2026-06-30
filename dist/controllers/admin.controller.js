"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_monitoring_model_1 = require("../models/admin-monitoring.model");
const discount_model_1 = require("../models/discount.model");
const http_error_1 = require("../utils/http-error");
const admin_validator_1 = require("../validators/admin.validator");
function isUniqueViolation(error) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
class AdminController {
    static async monitoring(req, res) {
        const simulatedNow = typeof req.query.simulatedNow === "string" ? new Date(req.query.simulatedNow) : new Date();
        if (Number.isNaN(simulatedNow.getTime())) {
            throw new http_error_1.HttpError(400, "simulatedNow tidak valid.");
        }
        res.json(await admin_monitoring_model_1.AdminMonitoringModel.snapshot(simulatedNow));
    }
    static async runOverdue(req, res) {
        const body = req.body;
        const simulatedNow = typeof body.simulatedNow === "string" && body.simulatedNow
            ? new Date(body.simulatedNow)
            : new Date();
        if (Number.isNaN(simulatedNow.getTime())) {
            throw new http_error_1.HttpError(400, "simulatedNow tidak valid.");
        }
        res.json(await admin_monitoring_model_1.AdminMonitoringModel.processOverdue(simulatedNow));
    }
    static async listVouchers(_req, res) {
        res.json({ vouchers: await discount_model_1.DiscountModel.listVouchers() });
    }
    static async createVoucher(req, res) {
        const payload = admin_validator_1.voucherSchema.parse(req.body);
        try {
            const voucher = await discount_model_1.DiscountModel.createVoucher({
                ...payload,
                createdBy: req.auth.userId,
            });
            res.status(201).json({ voucher });
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw new http_error_1.HttpError(409, "Code voucher sudah digunakan.");
            }
            throw error;
        }
    }
    static async showVoucher(req, res) {
        const voucher = await discount_model_1.DiscountModel.findVoucher(String(req.params.id).toUpperCase());
        if (!voucher)
            throw new http_error_1.HttpError(404, "Voucher tidak ditemukan.");
        res.json({ voucher });
    }
    static async listPromos(_req, res) {
        res.json({ promos: await discount_model_1.DiscountModel.listPromos() });
    }
    static async createPromo(req, res) {
        const payload = admin_validator_1.promoSchema.parse(req.body);
        try {
            const promo = await discount_model_1.DiscountModel.createPromo({
                ...payload,
                createdBy: req.auth.userId,
            });
            res.status(201).json({ promo });
        }
        catch (error) {
            if (isUniqueViolation(error)) {
                throw new http_error_1.HttpError(409, "Code promo sudah digunakan.");
            }
            throw error;
        }
    }
    static async showPromo(req, res) {
        const promo = await discount_model_1.DiscountModel.findPromo(String(req.params.id).toUpperCase());
        if (!promo)
            throw new http_error_1.HttpError(404, "Promo tidak ditemukan.");
        res.json({ promo });
    }
}
exports.AdminController = AdminController;
