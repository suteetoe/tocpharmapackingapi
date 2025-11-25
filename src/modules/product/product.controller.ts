import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

export const getProductBySerial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serial_number } = req.body;

    if (!serial_number) {
      res.status(400).json({
        success: false,
        message: 'Serial number is required',
      });
      return;
    }

    const serial = await prisma.icSerial.findFirst({
      where: {
        serial_number: serial_number,
      },
      include: {
        icInventory: true,
      },
    });

    if (!serial) {
      res.status(404).json({
        success: false,
        message: 'Serial number not found',
      });
      return;
    }

    if (!serial.icInventory) {
      res.status(404).json({
        success: false,
        message: 'Product not found for this serial',
      });
      return;
    }

    const response = {
      success: true,
      message: 'Product found',
      icInventory: {
        code: serial.icInventory.code,
        name_1: serial.icInventory.name_1,
        status: serial.status,
        ic_serial_no: serial.icInventory.ic_serial_no,
        is_pharma_serialization: serial.icInventory.is_pharma_serialization,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
