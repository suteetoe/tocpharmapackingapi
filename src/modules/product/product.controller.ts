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

export const getSerialDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serial_number } = req.body;
    if (!serial_number) {
      return res.status(400).json({ success: false, message: 'Serial number is required' });
    }
    const serial = await prisma.icSerial.findFirst({
      where: { serial_number },
      include: { icInventory: true },
    });
    if (!serial) {
      return res.status(404).json({ success: false, message: 'Serial number not found' });
    }
    if (!serial.icInventory) {
      return res.status(404).json({ success: false, message: 'Product not found for this serial' });
    }
    const response = {
      success: true,
      message: 'Product found',
      data: {
        ic_code: serial.ic_code,
        serial_number: serial.serial_number,
        status: serial.status,
        wh_code: serial.wh_code,
        shelf_code: serial.shelf_code,
        icInventory: serial.icInventory,
      },
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getSerialByIcCodeAndSerial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ic_code, serial_number } = req.body;
    if (!ic_code || !serial_number) {
      return res.status(400).json({ success: false, message: 'ic_code and serial_number are required' });
    }
    const serial = await prisma.icSerial.findFirst({
      where: { ic_code, serial_number },
      include: { icInventory: true },
    });
    if (!serial) {
      return res.status(404).json({ success: false, message: 'Serial number not found' });
    }
    if (!serial.icInventory) {
      return res.status(404).json({ success: false, message: 'Product not found for this serial' });
    }
    const response = {
      success: true,
      message: 'Product found',
      data: {
        ic_code: serial.ic_code,
        serial_number: serial.serial_number,
        status: serial.status,
        wh_code: serial.wh_code,
        shelf_code: serial.shelf_code,
        icInventory: serial.icInventory,
      },
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
