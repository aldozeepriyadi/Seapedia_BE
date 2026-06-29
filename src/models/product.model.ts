import { query } from "../config/database";
import { createId } from "../services/id.service";
import { Product } from "./database.model";

type ProductRow = {
  id: string;
  store_id: string;
  seller_id: string;
  store_name: string;
  store_description: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  created_at: Date;
  updated_at: Date;
};

function mapProduct(row: ProductRow): Product {
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

export class ProductModel {
  static async findMany() {
    const result = await query<ProductRow>(
      `${productSelect}
       ORDER BY products.created_at DESC`,
    );

    return result.rows.map(mapProduct);
  }

  static async findById(id: string) {
    const result = await query<ProductRow>(
      `${productSelect}
       WHERE products.id = $1`,
      [id],
    );

    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  static async findByStoreId(storeId: string) {
    const result = await query<ProductRow>(
      `${productSelect}
       WHERE products.store_id = $1
       ORDER BY products.created_at DESC`,
      [storeId],
    );

    return result.rows.map(mapProduct);
  }

  static async create(input: {
    storeId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
  }) {
    const result = await query<ProductRow>(
      `INSERT INTO products (id, store_id, name, description, price, stock, category, image)
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
        updated_at`,
      [
        createId("prd"),
        input.storeId,
        input.name,
        input.description,
        input.price,
        input.stock,
        input.category,
        input.image,
      ],
    );

    return mapProduct(result.rows[0]!);
  }

  static async updateForStore(
    id: string,
    storeId: string,
    input: {
      name: string;
      description: string;
      price: number;
      stock: number;
      category: string;
      image: string;
    },
  ) {
    const result = await query<ProductRow>(
      `UPDATE products
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
        updated_at`,
      [
        id,
        storeId,
        input.name,
        input.description,
        input.price,
        input.stock,
        input.category,
        input.image,
      ],
    );

    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  static async deleteForStore(id: string, storeId: string) {
    const result = await query<{ id: string }>(
      `DELETE FROM products
       WHERE id = $1 AND store_id = $2
       RETURNING id`,
      [id, storeId],
    );

    return Boolean(result.rows[0]);
  }
}
