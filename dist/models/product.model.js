"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const database_1 = require("../config/database");
const id_service_1 = require("../services/id.service");
function mapProduct(row) {
    return {
        id: row.id,
        storeId: row.store_id,
        sellerId: row.seller_id,
        storeName: row.store_name,
        storeDescription: row.store_description,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        stock: Number(row.stock),
        category: row.category,
        image: row.image,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
const productSelect = `
  SELECT
    products.id,
    products.store_id,
    stores.seller_id,
    stores.store_name,
    stores.description AS store_description,
    products.name,
    products.description,
    products.price,
    products.stock,
    products.category,
    products.image,
    products.created_at,
    products.updated_at
  FROM products
  JOIN stores ON stores.id = products.store_id
`;
class ProductModel {
    static async findMany() {
        const result = await (0, database_1.query)(`${productSelect}
       ORDER BY products.created_at DESC`);
        return result.rows.map(mapProduct);
    }
    static async findById(id) {
        const result = await (0, database_1.query)(`${productSelect}
       WHERE products.id = $1`, [id]);
        return result.rows[0] ? mapProduct(result.rows[0]) : null;
    }
    static async findByStoreId(storeId) {
        const result = await (0, database_1.query)(`${productSelect}
       WHERE products.store_id = $1
       ORDER BY products.created_at DESC`, [storeId]);
        return result.rows.map(mapProduct);
    }
    static async create(input) {
        const result = await (0, database_1.query)(`INSERT INTO products (id, store_id, name, description, price, stock, category, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
        id,
        store_id,
        (SELECT seller_id FROM stores WHERE stores.id = products.store_id) AS seller_id,
        (SELECT store_name FROM stores WHERE stores.id = products.store_id) AS store_name,
        (SELECT description FROM stores WHERE stores.id = products.store_id) AS store_description,
        name,
        description,
        price,
        stock,
        category,
        image,
        created_at,
        updated_at`, [
            (0, id_service_1.createId)("prd"),
            input.storeId,
            input.name,
            input.description,
            input.price,
            input.stock,
            input.category,
            input.image,
        ]);
        return mapProduct(result.rows[0]);
    }
    static async updateForStore(id, storeId, input) {
        const result = await (0, database_1.query)(`UPDATE products
       SET name = $3,
           description = $4,
           price = $5,
           stock = $6,
           category = $7,
           image = $8,
           updated_at = NOW()
       WHERE id = $1 AND store_id = $2
       RETURNING
        id,
        store_id,
        (SELECT seller_id FROM stores WHERE stores.id = products.store_id) AS seller_id,
        (SELECT store_name FROM stores WHERE stores.id = products.store_id) AS store_name,
        (SELECT description FROM stores WHERE stores.id = products.store_id) AS store_description,
        name,
        description,
        price,
        stock,
        category,
        image,
        created_at,
        updated_at`, [
            id,
            storeId,
            input.name,
            input.description,
            input.price,
            input.stock,
            input.category,
            input.image,
        ]);
        return result.rows[0] ? mapProduct(result.rows[0]) : null;
    }
    static async deleteForStore(id, storeId) {
        const result = await (0, database_1.query)(`DELETE FROM products
       WHERE id = $1 AND store_id = $2
       RETURNING id`, [id, storeId]);
        return Boolean(result.rows[0]);
    }
}
exports.ProductModel = ProductModel;
