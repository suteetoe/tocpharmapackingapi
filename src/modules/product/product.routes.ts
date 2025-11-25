import { Router } from 'express';
import { getProductBySerial } from './product.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product and serial endpoints
 */

/**
 * @swagger
 * /product/get-product-by-serial:
 *   post:
 *     summary: Get product by serial number
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *             properties:
 *               serial_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 icInventory:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name_1:
 *                       type: string
 *                     status:
 *                       type: number
 *                     ic_serial_no:
 *                       type: number
 *                     is_pharma_serialization:
 *                       type: number
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Serial number is required
 *       404:
 *         description: Serial not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Serial number not found
 */
router.post('/get-product-by-serial', getProductBySerial);

export default router;
