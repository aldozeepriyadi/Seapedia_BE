"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveRole = void 0;
exports.authenticate = authenticate;
const auth_service_1 = require("../services/auth.service");
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ message: "Token tidak ditemukan." });
        return;
    }
    try {
        req.auth = (0, auth_service_1.verifyToken)(token);
        next();
    }
    catch {
        res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
    }
}
const requireActiveRole = (role) => (req, res, next) => {
    if (req.auth?.activeRole !== role) {
        res.status(403).json({
            message: `Akses membutuhkan active role ${role}.`,
        });
        return;
    }
    next();
};
exports.requireActiveRole = requireActiveRole;
