import { Request, Response, NextFunction } from "express";
import pdfmake from "pdfmake";
import { pdfmakeFonts } from "../config/fonts";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";

interface PackingData {
  doc_no: string;
  doc_date: string | null;
  cust_code: string | null;
  arCustomer: {
    code: string;
    name_1: string;
  };
  details: Array<{
    roworder: number;
    item_code: string | null;
    item_name: string | null;
    qty: string;
    unit_code: string | null;
  }>;
  serialnumbers: Array<{
    ic_code: string | null;
    serial_number: string | null;
    line_number: number;
    doc_line_number: number | null;
  }>;
  packer: {
    user_code: string;
    user_name: string;
    packing_date: string | null;
  } | null;
}

async function getPackingData(invoice_no: string): Promise<PackingData> {
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
        orderBy: {
          roworder: "asc",
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  const serials = await prisma.icTransSerialNumber.findMany({
    where: {
      doc_no: invoice_no,
      trans_flag: 44,
    },
    orderBy: {
      roworder: "asc",
    },
  });

  const packingConfirmed = await prisma.psmPackingConfirmed.findUnique({
    where: {
      doc_no: invoice_no,
    },
    include: {
      erpUser: true,
    },
  });

  return {
    doc_no: invoice.doc_no,
    doc_date: invoice.doc_date ? invoice.doc_date.toISOString() : null,
    cust_code: invoice.cust_code,
    arCustomer: {
      code: invoice.arCustomer?.code || "",
      name_1: invoice.arCustomer?.name_1 || "",
    },
    details: invoice.details.map((detail) => ({
      roworder: detail.roworder,
      item_code: detail.item_code || "",
      item_name: detail.item_name || "",
      qty: detail.qty?.toString() || "0",
      unit_code: detail.unit_code || "",
    })),
    serialnumbers: serials.map((serial) => ({
      ic_code: serial.ic_code || "",
      serial_number: serial.serial_number || "",
      line_number: serial.roworder,
      doc_line_number: serial.doc_line_number || 0,
    })),
    packer: packingConfirmed
      ? {
          user_code: packingConfirmed.user_code,
          user_name: packingConfirmed.erpUser?.name_1 || "",
          packing_date: packingConfirmed.packing_date
            ? packingConfirmed.packing_date.toISOString()
            : null,
        }
      : null,
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildTableBody(data: PackingData): any[][] {
  const body: any[][] = [];

  // Table header
  body.push([
    { text: "Item Code", style: "tableHeader" },
    { text: "Item Name", style: "tableHeader" },
    { text: "Qty", style: "tableHeader", alignment: "center" },
    { text: "Serial Number", style: "tableHeader" },
  ]);

  // Build rows by grouping serials with their items
  const itemsWithSerials: Array<{
    item_code: string;
    item_name: string;
    qty: string;
    serials: string[];
  }> = [];

  for (const detail of data.details) {
    const itemSerials = data.serialnumbers
      .filter((s) => s.ic_code === detail.item_code && s.serial_number !== null)
      .map((s) => s.serial_number as string);

    if (itemSerials.length > 0) {
      for (const serial of itemSerials) {
        itemsWithSerials.push({
          item_code: detail.item_code || "",
          item_name: detail.item_name || "",
          qty: "1",
          serials: [serial],
        });
      }
    }
  }

  // // Add header rows
  // body.push([
  //   {
  //     text: "Item Code",
  //     style: "tableHeader",
  //     border: [false, true, false, true],
  //   },
  //   {
  //     text: "Item Name",
  //     style: "tableHeader",
  //     border: [false, true, false, true],
  //   },
  //   {
  //     text: "Qty",
  //     style: "tableHeader",
  //     alignment: "center",
  //     border: [false, true, false, true],
  //   },
  //   {
  //     text: "Serial Number",
  //     style: "tableHeader",
  //     border: [false, true, false, true],
  //   },
  // ]);

  // Add data rows
  let rowIndex = 1;
  for (const item of itemsWithSerials) {
    body.push([
      rowIndex++,
      item.item_code,
      item.item_name,
      { text: item.qty, alignment: "center" },
      item.serials[0] || "",
    ]);
  }

  return body;
}

function buildPDFDocument(data: PackingData): any {
  const tableBody = buildTableBody(data);
  const itemsPerPage = 55;
  const totalPages = Math.ceil(tableBody.length / itemsPerPage);

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 110, 40, 40],
    defaultStyle: {
      font: "Sarabun",
      fontSize: 8,
    },
    header: function (currentPage: number, pageCount: number) {
      return [
        {
          text: `PAGE : ${currentPage}/${pageCount}`,
          alignment: "right",
          margin: [0, 20, 40, 0],
        }, 
        {
          text: "SERIAL NUMBER RECORD",
          style: "header",
          alignment: "center",
          margin: [40, 10, 40, 10],
        },
        {
          table: {
            widths: [30, "30%", "*", 40, "30%"],
            body: [
              [{ text: "INV. :", bold: true }, data.doc_no, "", "", ""],
              // [{ text: "CUST.     :", bold: true }, data.arCustomer.code, "", ""],
              // [
              //   { text: "CUST NAME :", bold: true },
              //   { text: data.arCustomer.name_1, colSpan: 3 },
              //   "",
              //   "",
              // ],
              [
                { text: "DATE :", bold: true },
                formatDate(data.doc_date),
                "",
                { text: "PACKER :", bold: true },
                data.packer
                  ? `(${data.packer.user_code}) ${data.packer.user_name}`
                  : "",
              ],
            ],
          },
          layout: "noBorders",
          margin: [40, 0, 40, 0],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
            },
          ],
          margin: [40, 0, 0, 0],
        },
        // Divider line

        // Main table header
        {
          table: {
            widths: [20, "15%", "*", "10%", "20%"],
            // headerRows: 1,
            body: [
              [
                { text: "No.", style: "tableHeader" },
                { text: "Item Code", style: "tableHeader" },
                { text: "Item Name", style: "tableHeader" },
                { text: "Qty", style: "tableHeader", alignment: "center" },
                { text: "Serial Number", style: "tableHeader" },
              ],
            ],
          },
          layout: "noBorders",
          margin: [40, 0, 40, 0],
        },
        // Divider line
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
            },
          ],
          margin: [40, 0, 40, 0],
        },
      ];
    },
    styles: {
      header: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 0],
      },
      subheader: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 0],
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
      },
      tableBody: {
        fontSize: 8,
        bordersize: 1,
        margin: [0, 0, 0, 0],
        lineHeight: 0.7,
      },
      footer: {
        fontSize: 9,
        italics: true,
      },
    },
    content: [
      // Page number (top right)
      // {
      //   text: `PAGE : 1/${totalPages}`,
      //   alignment: "right",
      //   margin: [0, 0, 0, 0],
      // },
      // Header title
      // {
      //   text: "SERIAL NUMBER RECORD",
      //   style: "header",
      //   alignment: "center",
      // },
      // Decorative line
      // {
      //   text: "****************************************",
      //   alignment: "center",
      // },
      // Invoice info table

      // Divider line
      // {
      //   canvas: [
      //     {
      //       type: "line",
      //       x1: 0,
      //       y1: 0,
      //       x2: 515,
      //       y2: 0,
      //       lineWidth: 1,
      //     },
      //   ],
      //   margin: [0, 0, 0, 0],
      // },
      // Main table header
      // {
      //   table: {
      //     widths: ["15%", "45%", "10%", "30%"],
      //     headerRows: 1,
      //     body: [
      //       [
      //         { text: "Item Code", style: "tableHeader" },
      //         { text: "Item Name", style: "tableHeader" },
      //         { text: "Qty", style: "tableHeader", alignment: "center" },
      //         { text: "Serial Number", style: "tableHeader" },
      //       ],
      //     ],
      //   },
      //   layout: "noBorders",
      // },
      // Divider line
      // {
      //   canvas: [
      //     {
      //       type: "line",
      //       x1: 0,
      //       y1: 0,
      //       x2: 515,
      //       y2: 0,
      //       lineWidth: 1,
      //     },
      //   ],
      //   margin: [0, 0, 0, 0],
      // },
      // Data rows with pagination
      {
        table: {
          widths: [20, "15%", "*", "10%", "20%"],
          body: tableBody.slice(1), // Skip header row (already added)
          dontBreakRows: true,
        },
        style: "tableBody",
        layout: "noBorders",
      },
      // Bottom divider
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
          },
        ],
        margin: [0, 5, 0, 0],
      },
      // Footer info
      {
        text: `รวม ${tableBody.length - 1} รายการ`,
        alignment: "left",
        style: "footer",
      },
    ],
  };
}

export const generatePackingPDF = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { invoice_no } = req.params;

    // Decode URL-encoded invoice number (e.g., MK6902%2f00001 -> MK6902/00001)
    const decodedInvoiceNo = decodeURIComponent(invoice_no);

    console.log("Gen PDF FOR : " + decodedInvoiceNo);
    // Fetch packing data
    const packingData = await getPackingData(decodedInvoiceNo);

    // Build PDF document definition
    const docDefinition = buildPDFDocument(packingData);

    //console.log(pdfmakeFonts);
    //     const pdfFont = {
    //   Sarabun: {
    //     normal: '../fonts/Sarabun-Regular.ttf',
    //     bold: '../fonts/Sarabun-Medium.ttf',
    //     italics: '../fonts/Sarabun-Italic.ttf',
    //     bolditalics: '../fonts/Sarabun-MediumItalic.ttf',
    //   },
    // };
    // console.log(docDefinition);

    // Generate PDF with custom fonts
    pdfmake.addFonts(pdfmakeFonts);

    const pdfDocGenerator = pdfmake.createPdf(docDefinition);

    // pdfDocGenerator.getBlob().then((blob:any) => {
    //       res.setHeader("Content-Type", "application/pdf");
    //       res.setHeader(
    //         "Content-Disposition",
    //         `attachment; filename="${decodedInvoiceNo}.pdf"`,
    //       );
    //       res.send(blob);
    //     });

    // pdfDocGenerator.write("./tmp/basics.pdf").then(
    //   () => {
    //     console.log("Successfully wrote PDF file.");

    //     pdfDocGenerator.getBlob().then((blob:any) => {
    //       res.setHeader("Content-Type", "application/pdf");
    //       res.setHeader(
    //         "Content-Disposition",
    //         `attachment; filename="${decodedInvoiceNo}.pdf"`,
    //       );
    //       res.send(blob);
    //     });
    //   },
    //   (err: any) => {
    //     console.error(err);
    //   },
    // );
    pdfDocGenerator.getBuffer().then((dataUrl) => {
      // console.log(dataUrl)
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${decodedInvoiceNo}.pdf"`,
      );
      res.send(dataUrl);
    });

    // res.send();
  } catch (error) {
    next(error);
  }
};
