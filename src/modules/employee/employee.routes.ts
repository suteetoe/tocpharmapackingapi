import { Router } from 'express';
import { validateEmployee } from './employee.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Employee
 *   description: Employee validation endpoints
 */

/**
 * @swagger
 * /employee/validate-employee:
 *   post:
 *     summary: Validate employee by code
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 employee:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *       404:
 *         description: Employee not found
 */
router.post('/validate-employee', validateEmployee);

export default router;
