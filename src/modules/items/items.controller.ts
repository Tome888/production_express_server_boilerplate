import { Request, Response, NextFunction } from "express";
import { ItemsService } from "./items.service.js";
import logger from "../../config/logger.js";

/**
 * Controller class to handle all incoming HTTP requests for the Items domain.
 */
export const ItemsController = {
  /**
   * Fetch all items
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await ItemsService.getAllItems();
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch a single item by ID
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // The parameter has already been converted to a number by our Zod schema middleware
      const id = req.params.id as unknown as number;

      const item = await ItemsService.getItemById(id);

      if (!item) {
        logger.warn(
          `[NOT FOUND]: Client requested non-existent item ID: ${id}`,
        );
        res
          .status(404)
          .json({
            error: "Not Found",
            message: "The requested item could not be located.",
          });
        return;
      }

      res.status(200).json(item);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new item
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, price } = req.body;
      const newItem = await ItemsService.createItem(name, price);

      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing item entirely
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as unknown as number;
      const { name, price } = req.body;

      const updatedItem = await ItemsService.updateItem(id, name, price);

      if (!updatedItem) {
        logger.warn(
          `[UPDATE FAILED]: Client tried to update non-existent item ID: ${id}`,
        );
        res
          .status(404)
          .json({
            error: "Not Found",
            message: "Target update item could not be located.",
          });
        return;
      }

      res.status(200).json(updatedItem);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an item row
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as unknown as number;
      const isDeleted = await ItemsService.deleteItem(id);

      if (!isDeleted) {
        logger.warn(
          `[DELETE FAILED]: Client tried to remove non-existent item ID: ${id}`,
        );
        res
          .status(404)
          .json({
            error: "Not Found",
            message: "Target deletion item could not be located.",
          });
        return;
      }

      res
        .status(200)
        .json({
          message: "Resource successfully purged from active data arrays.",
        });
    } catch (error) {
      next(error);
    }
  },
};
