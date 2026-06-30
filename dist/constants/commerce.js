"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryJobStatus = exports.OrderStatus = exports.ppnRate = exports.deliveryFees = exports.DeliveryMethod = void 0;
exports.DeliveryMethod = {
    INSTANT: "Instant",
    NEXT_DAY: "Next Day",
    REGULAR: "Regular",
};
exports.deliveryFees = {
    [exports.DeliveryMethod.INSTANT]: 30000,
    [exports.DeliveryMethod.NEXT_DAY]: 18000,
    [exports.DeliveryMethod.REGULAR]: 10000,
};
exports.ppnRate = 0.12;
exports.OrderStatus = {
    PACKING: "Sedang Dikemas",
    WAITING_DRIVER: "Menunggu Pengirim",
    SHIPPING: "Sedang Dikirim",
    COMPLETED: "Pesanan Selesai",
};
exports.DeliveryJobStatus = {
    AVAILABLE: "AVAILABLE",
    TAKEN: "TAKEN",
    COMPLETED: "COMPLETED",
};
