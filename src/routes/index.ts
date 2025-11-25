import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import employeeRoutes from '../modules/employee/employee.routes';
import invoiceRoutes from '../modules/invoice/invoice.routes';
import productRoutes from '../modules/product/product.routes';
import { authenticate } from '../modules/token/auth.middleware';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/employee', authenticate, employeeRoutes);
router.use('/invoice', authenticate, invoiceRoutes);
router.use('/product', authenticate, productRoutes);

export default router;
