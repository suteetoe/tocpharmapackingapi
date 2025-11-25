import { Router } from 'express';
import { getInvoiceDetails, shipmentConfirm, getPackingPrintData } from './invoice.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoice
 *   description: Invoice and packing endpoints
 */

/**
 * @swagger
 * /invoice/get-invoice-details:
 *   post:
 *     summary: Get invoice details
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_no
 *             properties:
 *               invoice_no:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receipt_number:
 *                   type: string
 *                 customer_name:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                       product_name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *       404:
 *         description: Invoice not found
 */
router.post('/get-invoice-details', getInvoiceDetails);

/**
 * @swagger
 * /invoice/shipment-confirm:
 *   post:
 *     summary: Confirm shipment packing
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_no
 *               - employee_code
 *               - serials
 *             properties:
 *               invoice_no:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               serials:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Shipment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 packing_id:
 *                   type: integer
 *       400:
 *         description: Validation failed
 */
router.post('/shipment-confirm', shipmentConfirm);

/**
 * @swagger
 * /invoice/packing/{invoice_no}:
 *   get:
 *     summary: Get packing print data
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoice_no
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Packing data for printing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice_no:
 *                   type: string
 *                 packed_items:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Packing not found
 */
router.get('/packing/:invoice_no', getPackingPrintData);

export default router;
