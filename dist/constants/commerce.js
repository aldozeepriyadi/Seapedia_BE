"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.ppnRate = exports.deliveryFees = exports.DeliveryMethod = void 0;
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
exports.ppnRate = 0.11;
exports.OrderStatus = {
    PACKING: "Sedang Dikemas",
};
