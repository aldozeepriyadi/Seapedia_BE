import { Role } from "../constants/roles";
import { pool, query } from "../config/database";
import { createId } from "../services/id.service";
import { StoredUser } from "./database.model";

type UserRow = {
  id: string;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
  roles: Role[] | null;
  created_at: Date;
  updated_at: Date;
};

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    roles: row.roles ?? [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const userSelect = `
  SELECT
    users.id,
    users.username,
    users.email,
    users.display_name,
    users.password_hash,
    users.created_at,
    users.updated_at,
    COALESCE(array_agg(user_roles.role ORDER BY user_roles.role) FILTER (WHERE user_roles.role IS NOT NULL), '{}') AS roles
  FROM users
  LEFT JOIN user_roles ON user_roles.user_id = users.id
`;

export class UserModel {
  static async findByUsername(username: string) {
    const result = await query<UserRow>(
      `${userSelect}
       WHERE users.username = $1
       GROUP BY users.id`,
      [username],
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  static async findByUsernameOrEmail(identifier: string) {
    const result = await query<UserRow>(
      `${userSelect}
       WHERE LOWER(users.username) = LOWER($1)
          OR LOWER(users.email) = LOWER($1)
       GROUP BY users.id`,
      [identifier],
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  static async findById(id: string) {
    const result = await query<UserRow>(
      `${userSelect}
       WHERE users.id = $1
       GROUP BY users.id`,
      [id],
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  static async existsByUsername(username: string) {
    const result = await query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM users WHERE username = $1) AS exists",
      [username],
    );

    return result.rows[0]?.exists ?? false;
  }

  static async existsByEmail(email: string) {
    const result = await query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)) AS exists",
      [email],
    );

    return result.rows[0]?.exists ?? false;
  }

  static async create(user: StoredUser) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO users (id, username, email, display_name, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.id,
          user.username,
          user.email,
          user.displayName,
          user.passwordHash,
          user.createdAt,
          user.updatedAt,
        ],
      );

      for (const role of user.roles) {
        await client.query(
          `INSERT INTO user_roles (id, user_id, role)
           VALUES ($1, $2, $3)`,
          [createId("rol"), user.id, role],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return user;
  }

  static hasRole(user: StoredUser, role: Role) {
    return user.roles.includes(role);
  }
}
