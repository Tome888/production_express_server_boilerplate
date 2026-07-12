import db from "../../config/db.js";
import logger from "../../config/logger.js";

export interface TokensRepository {
  id: number;
  userId: number;
  token: string;
  createdAt: Date;
};


try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `)
  logger.info("🪙 Tokens table created successfully");
} catch (error) {
  logger.error("Failed to create tokens table", error);
}


const statements = {
  getTokensByUserId: db.prepare(`SELECT * FROM tokens WHERE userId = ?`),
  createUserTokens: db.prepare(`INSERT INTO tokens (userId) VALUES (?) RETURNING *`),
  updateUserTokens: db.prepare(`UPDATE tokens SET token = ? WHERE userId = ? RETURNING *`),
  deleteUserTokens: db.prepare(`DELETE FROM tokens WHERE userId = ?`),
}


export const tokensRepository = {
  getTokensByUserId: async(userId: number): Promise<TokensRepository[]> => {
    try {
      return statements.getTokensByUserId.all(userId) as TokensRepository[];
    } catch (error) {
      logger.error("Failed to get tokens by user id", error);
      throw error;
    }
  },

  createUserTokens: async (userId: number): Promise<TokensRepository> => {
    try {
      return statements.createUserTokens.get(userId) as TokensRepository;
    } catch (error) {
      logger.error("Failed to create user tokens", error);
      throw error;
    }
  },

  updateUserTokens: async (userId: number, token: number): Promise<TokensRepository> => {
    try {
     return statements.updateUserTokens.get([token, userId]) as TokensRepository;;
    } catch (error) {
      logger.error("Failed to update user tokens", error);
      throw error;
    }
  },
  deleteUserTokens: async (userId: number) => {
    try {
      return statements.deleteUserTokens.run(userId).changes;
    } catch (error) {
      logger.error("Failed to delete user tokens", error);
      throw error;
    }
  },
}
