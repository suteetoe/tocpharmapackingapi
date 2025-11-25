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
 *                 doc_no:
 *                   type: string
 *                 trans_flag:
 *                   type: integer
 *                 doc_date:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 cust_code:
 *                   type: string
 *                   nullable: true
 *                 total_amount:
 *                   type: string
 *                   nullable: true
 *                 arCustomer:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     code:
 *                       type: string
 *                     name_1:
 *                       type: string
 *                       nullable: true
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roworder:
 *                         type: integer
 *                       doc_no:
 *                         type: string
 *                       trans_flag:
 *                         type: integer
 *                       item_code:
 *                         type: string
 *                         nullable: true
 *                       item_name:
 *                         type: string
 *                         nullable: true
 *                       qty:
 *                         type: string
 *                         nullable: true
 *                       unit_code:
 *                         type: string
 *                         nullable: true
 *                       price:
 *                         type: string
 *                         nullable: true
 *                       discount:
 *                         type: string
 *                         nullable: true
 *                       sum_amount:
 *                         type: string
 *                         nullable: true
 *                       is_serial_number:
 *                         type: integer
 *                         nullable: true
 *                         description: Indicates if the product requires serial number tracking (0 or 1)
 *                       icInventory:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           code:
 *                             type: string
 *                           name_1:
 *                             type: string
 *                             nullable: true
 *                           ic_serial_no:
 *                             type: integer
 *                             nullable: true
 *                           is_pharma_serialization:
 *                             type: integer
 *                             nullable: true
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
 *               - serials
 *             properties:
 *               invoice_no:
 *                 type: string
 *               serials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - doc_no
 *                     - trans_flag
 *                     - doc_line_number
 *                     - ic_code
 *                     - serial_number
 *                     - cust_code
 *                   properties:
 *                     doc_no:
 *                       type: string
 *                     trans_flag:
 *                       type: integer
 *                     doc_line_number:
 *                       type: integer
 *                     ic_code:
 *                       type: string
 *                     serial_number:
 *                       type: string
 *                     cust_code:
 *                       type: string
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Invoice not found
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
 *                 doc_no:
 *                   type: string
 *                 trans_flag:
 *                   type: integer
 *                 doc_date:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 cust_code:
 *                   type: string
 *                   nullable: true
 *                 total_amount:
 *                   type: string
 *                 arCustomer:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name_1:
 *                       type: string
 *                     address:
 *                       type: string
 *                     telephone:
 *                       type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roworder:
 *                         type: integer
 *                       item_code:
 *                         type: string
 *                         nullable: true
 *                       item_name:
 *                         type: string
 *                         nullable: true
 *                       qty:
 *                         type: string
 *                       unit_code:
 *                         type: string
 *                         nullable: true
 *                       price:
 *                         type: string
 *                       icInventory:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           code:
 *                             type: string
 *                           name_1:
 *                             type: string
 *                             nullable: true
 *                           ic_serial_no:
 *                             type: integer
 *                             nullable: true
 *                           is_pharma_serialization:
 *                             type: integer
 *                             nullable: true
 *                 serialnumbers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ic_code:
 *                         type: string
 *                         nullable: true
 *                       serial_number:
 *                         type: string
 *                         nullable: true
 *                       line_number:
 *                         type: integer
 *                       doc_line_number:
 *                         type: integer
 *                         nullable: true
 *       404:
 *         description: Packing not found
 */
router.get('/packing/:invoice_no', getPackingPrintData);

export default router;
