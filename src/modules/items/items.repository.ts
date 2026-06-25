import db from "../../config/db.js";
import logger from "../../config/logger.js";

export interface Item {
  id: number;
  name: string;
  price: number;
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
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  logger.info(
    '📋 Database schema verification complete: "items" table initialized.',
  );
} catch (error) {
  logger.error(
    'CRITICAL: Failed to bootstrap database "items" table structure:',
    error,
  );
  throw error;
}

/**
 * Pre-compile operational SQL queries at boot time for maximum execution velocity.
 * These run perfectly now because the table is guaranteed to exist above this line.
 */
const statements = {
  findAll: db.prepare(`
    SELECT id, name, price, created_at FROM items ORDER BY id DESC
  `),

  findById: db.prepare(`
    SELECT id, name, price, created_at FROM items WHERE id = ?
  `),

  insert: db.prepare(`
    INSERT INTO items (name, price) VALUES (?, ?) RETURNING id, name, price, created_at
  `),

  update: db.prepare(`
    UPDATE items SET name = ?, price = ? WHERE id = ? RETURNING id, name, price, created_at
  `),

  delete: db.prepare(`
    DELETE FROM items WHERE id = ?
  `),
};

/**
 * Data Access Object (DAO) for Items
 */
export const ItemsRepository = {
  /**
   * Fetches all items from the database
   */
  findAll(): Item[] {
    try {
      return statements.findAll.all() as Item[];
    } catch (error) {
      logger.error("Database query execution crash inside findAll():", error);
      throw new Error("Database operation failed");
    }
  },

  /**
   * Fetches a single item by its primary key
   */
  findById(id: number): Item | null {
    try {
      const row = statements.findById.get(id);
      return row ? (row as Item) : null;
    } catch (error) {
      logger.error(
        `Database query execution crash inside findById() for id ${id}:`,
        error,
      );
      throw new Error("Database operation failed");
    }
  },

  /**
   * Commits a new item row to the database
   */
  create(name: string, price: number): Item {
    try {
      const result = statements.insert.get(name, price);
      if (!result) {
        throw new Error("Failed to retrieve inserted record row.");
      }
      return result as Item;
    } catch (error) {
      logger.error(
        `Database transaction crash inside create() for target item "${name}":`,
        error,
      );
      throw new Error("Database insertion failed");
    }
  },

  /**
   * Updates an existing item row completely
   */
  update(id: number, name: string, price: number): Item | null {
    try {
      const result = statements.update.get(name, price, id);
      return result ? (result as Item) : null;
    } catch (error) {
      logger.error(
        `Database transaction crash inside update() for record id ${id}:`,
        error,
      );
      throw new Error("Database update failed");
    }
  },

  /**
   * Deletes an item row from the database
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
