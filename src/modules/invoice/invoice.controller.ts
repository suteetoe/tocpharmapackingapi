import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';

/**
 * Get list of invoices with complete serial numbers for picking list
 * Filters only orders where serial numbers are fully recorded
 */
export const getCompletedPackings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date_from, date_to, invoice_no, only_completed = 'true' } = req.query;

    // Build where clause
    const whereClause: any = {
      trans_flag: 44
    };

    // Filter by invoice number if provided
    if (invoice_no) {
      whereClause.doc_no = {
        contains: invoice_no as string
      };
    }

    // Filter by date range
    if (date_from || date_to) {
      whereClause.doc_date = {};
      if (date_from) {
        whereClause.doc_date.gte = new Date(date_from as string);
      }
      if (date_to) {
        whereClause.doc_date.lte = new Date(date_to as string);
      }
    }

    // Get all invoices with their details
    const invoices = await prisma.icTrans.findMany({
      where: whereClause,
      include: {
        arCustomer: true,
        details: {
          include: {
            icInventory: true
          },
          orderBy: {
            roworder: 'asc'
          }
        }
      },
      orderBy: {
        doc_date: 'desc'
      }
    });

    // Get serial numbers for these invoices and filter by completion status
    const results = await Promise.all(
      invoices.map(async (invoice) => {
        // Get saved serial numbers for this invoice
        const savedSerials = await prisma.icTransSerialNumber.findMany({
          where: {
            doc_no: invoice.doc_no,
            trans_flag: 44
          },
          orderBy: {
            roworder: 'asc'
          }
        });

        // Calculate required serial numbers count (only items that require serial numbers)
        const requiredSerialItems = invoice.details.filter(
          (detail) => detail.is_serial_number === 1
        );
        const requiredCount = requiredSerialItems.reduce(
          (sum, item) => sum + (Number(item.qty) || 0),
          0
        );

        const scannedCount = savedSerials.length;
        const isComplete = scannedCount >= requiredCount && requiredCount > 0;

        // If only_completed is true, filter out incomplete orders
        if (only_completed === 'true' && !isComplete) {
          return null;
        }

        return {
          doc_no: invoice.doc_no,
          trans_flag: invoice.trans_flag,
          doc_date: invoice.doc_date ? invoice.doc_date.toISOString() : null,
          cust_code: invoice.cust_code,
          total_amount: invoice.total_amount?.toString() || '0',
          arCustomer: {
            code: invoice.arCustomer?.code || '',
            name_1: invoice.arCustomer?.name_1 || ''
          },
          details: invoice.details.map((detail) => ({
            roworder: detail.roworder,
            item_code: detail.item_code,
            item_name: detail.item_name,
            qty: detail.qty?.toString() || '0',
            unit_code: detail.unit_code,
            is_serial_number: detail.is_serial_number
          })),
          serialnumbers: savedSerials.map((serial) => ({
            ic_code: serial.ic_code,
            serial_number: serial.serial_number,
            line_number: serial.roworder,
            doc_line_number: serial.doc_line_number
          })),
          isComplete,
          scannedCount,
          requiredCount
        };
      })
    );

    // Filter out null values (incomplete orders when only_completed is true)
    const filteredResults = results.filter((result) => result !== null);

    res.status(200).json({
      success: true,
      data: filteredResults,
      total: filteredResults.length
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoice_no } = req.body;

    if (!invoice_no) {
      return next(new AppError('Invoice number is required', 400));
    }

    const invoice = await prisma.icTrans.findUnique({
      where: {
        doc_no_trans_flag: {
          doc_no: invoice_no,
          trans_flag: 44,
        },
      },
      include: {
        arCustomer: true,
        details: {
          include: {
            icInventory: true,
          },
          orderBy: {
            roworder: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
};

export const shipmentConfirm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoice_no, serials } = req.body;

    if (!invoice_no) {
      return next(new AppError('Invoice number is required', 400));
    }

    if (!serials || !Array.isArray(serials) || serials.length === 0) {
      return next(new AppError('Serials list is required', 400));
    }

    // 1. Fetch Invoice details to validate items
    const invoice = await prisma.icTrans.findUnique({
      where: {
        doc_no_trans_flag: {
          doc_no: invoice_no,
          trans_flag: 44,
        },
      },
      include: {
        details: true,
      },
    });

    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    // 2. Validate that all serials belong to items in the invoice
    const validItemCodes = new Set(invoice.details.map((detail) => detail.item_code));

    for (const serial of serials) {
      if (!validItemCodes.has(serial.ic_code)) {
        return next(
          new AppError(
            `Item code ${serial.ic_code} (Serial: ${serial.serial_number}) is not in this invoice`,
            400
          )
        );
      }
    }

    // 3. Save to IcTransSerialNumber
    await prisma.$transaction(async (tx) => {
      for (const serial of serials) {
        await tx.icTransSerialNumber.create({
          data: {
            doc_no: serial.doc_no,
            trans_flag: serial.trans_flag,
            doc_line_number: serial.doc_line_number,
            ic_code: serial.ic_code,
            serial_number: serial.serial_number,
            cust_code: invoice.cust_code,
            doc_date: new Date(invoice.doc_date),
            doc_time: invoice.doc_time,
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Shipment confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPackingPrintData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoice_no } = req.params;

    const invoice = await prisma.icTrans.findUnique({
      where: {
        doc_no_trans_flag: {
          doc_no: invoice_no,
          trans_flag: 44,
        },
      },
      include: {
        arCustomer: true,
        details: {
          include: {
            icInventory: true,
          },
          orderBy: {
            roworder: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      return next(new AppError('Invoice not found', 404));
    }

    const serials = await prisma.icTransSerialNumber.findMany({
      where: {
        doc_no: invoice_no,
        trans_flag: 44,
      },
      orderBy: {
        roworder: 'asc',
      },
    });

    const response = {
      doc_no: invoice.doc_no,
      trans_flag: invoice.trans_flag,
      doc_date: invoice.doc_date ? invoice.doc_date.toISOString() : null,
      cust_code: invoice.cust_code,
      total_amount: invoice.total_amount?.toString() || '0',
      arCustomer: {
        code: invoice.arCustomer?.code || '',
        name_1: invoice.arCustomer?.name_1 || '',
        address: '',
        telephone: '',
      },
      details: invoice.details.map((detail) => ({
        roworder: detail.roworder,
        item_code: detail.item_code,
        item_name: detail.item_name,
        qty: detail.qty?.toString() || '0',
        unit_code: detail.unit_code,
        price: detail.price?.toString() || '0',
        icInventory: detail.icInventory
          ? {
              code: detail.icInventory.code,
              name_1: detail.icInventory.name_1,
              ic_serial_no: detail.icInventory.ic_serial_no,
              is_pharma_serialization: detail.icInventory.is_pharma_serialization,
            }
          : null,
      })),
      serialnumbers: serials.map((serial) => ({
        ic_code: serial.ic_code,
        serial_number: serial.serial_number,
        line_number: serial.roworder,
        doc_line_number: serial.doc_line_number,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
