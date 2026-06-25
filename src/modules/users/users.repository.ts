import db from "../../config/db.js";
import logger from "../../config/logger.js";

export interface User {
  id: number;
  name: string;
  lastName: string;
  user_email: string;
  phone_number: string;
  age: number;
  created_at: string;
}

/**
 * CRITICAL LIFECYCLE ORDERING BOOTSTRAP
 * We must execute the table structural setup directly on the core database instance
 * BEFORE compiling subsequent statements. If we do not, read queries compiled in the
 * statements object pool will panic and halt thread execution due to missing tables.
 */
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      age INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  logger.info(
    '📋 Database schema verification complete: "users" table initialized.',
  );
} catch (error) {
  logger.error(
    'CRITICAL: Failed to bootstrap database "users" table structure:',
    error,
  );
  throw error;
}

/**
 * Pre-compile operational SQL queries at boot time for maximum execution velocity.
 * SQL aliases ('last_name AS lastName') map the table column conventions to our camelCase interfaces.
 */
const statements = {
  findAll: db.prepare(`
    SELECT id, name, last_name AS lastName, user_email, phone_number, age, created_at
    FROM users
    ORDER BY id DESC
  `),

  findById: db.prepare(`
    SELECT id, name, last_name AS lastName, user_email, phone_number, age, created_at
    FROM users
    WHERE id = ?
  `),

  insert: db.prepare(`
    INSERT INTO users (name, last_name, user_email, phone_number, age)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id, name, last_name AS lastName, user_email, phone_number, age, created_at
  `),

  update: db.prepare(`
    UPDATE users
    SET name = ?, last_name = ?, user_email = ?, phone_number = ?, age = ?
    WHERE id = ?
    RETURNING id, name, last_name AS lastName, user_email, phone_number, age, created_at
  `),

  delete: db.prepare(`
    DELETE FROM users WHERE id = ?
  `),
};

/**
 * Data Access Object (DAO) for Users
 */
export const UsersRepository = {
  /**
   * Fetches all users from the database
   */
  findAll(): User[] {
    try {
      return statements.findAll.all() as User[];
    } catch (error) {
      logger.error("Database query execution crash inside findAll():", error);
      throw new Error("Database operation failed");
    }
  },

  /**
   * Fetches a single user by its primary key
   */
  findById(id: number): User | null {
    try {
      const row = statements.findById.get(id);
      return row ? (row as User) : null;
    } catch (error) {
      logger.error(
        `Database query execution crash inside findById() for id ${id}:`,
        error,
      );
      throw new Error("Database operation failed");
    }
  },

  /**
   * Commits a new user row to the database
   */
  create(
    name: string,
    lastName: string,
    user_email: string,
    phone_number: string,
    age: number,
  ): User {
    try {
      const result = statements.insert.get(
        name,
        lastName,
        user_email,
        phone_number,
        age,
      );
      if (!result) {
        throw new Error("Failed to retrieve inserted record row.");
      }
      return result as User;
    } catch (error) {
      logger.error(
        `Database transaction crash inside create() for target user "${name}":`,
        error,
      );
      throw new Error("Database insertion failed");
    }
  },

  /**
   * Updates an existing user row completely
   */
  update(
    id: number,
    name: string,
    lastName: string,
    user_email: string,
    phone_number: string,
    age: number,
  ): User | null {
    try {
      const result = statements.update.get(
        name,
        lastName,
        user_email,
        phone_number,
        age,
        id,
      );
      return result ? (result as User) : null;
    } catch (error) {
      logger.error(
        `Database transaction crash inside update() for record id ${id}:`,
        error,
      );
      throw new Error("Database update failed");
    }
  },

  /**
   * Deletes a user row from the database
   */
  delete(id: number): boolean {
    try {
      const info = statements.delete.run(id);
      return info.changes > 0;
    } catch (error) {
      logger.error(
        `Database execution crash inside delete() for record id ${id}:`,
        error,
      );
      throw new Error("Database deletion failed");
    }
  },
};
