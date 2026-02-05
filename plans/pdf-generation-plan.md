# PDF Generation API Implementation Plan

## Overview
This plan outlines the implementation of a PDF generation API using `pdfmake` library with Thai font support (`THSarabun`) for generating serial number record documents.

## API Endpoint
- **Endpoint**: `GET /invoice/packing/{invoice_no}/pdf`
- **Authentication**: Bearer token required
- **Response**: PDF binary file with proper content-type headers

## Architecture Diagram

```mermaid
flowchart TD
    A[Client Request] --> B[/invoice/packing/:invoice_no/pdf]
    B --> C[authMiddleware]
    C --> D[invoiceController.generatePackingPDF]
    D --> E[PDF Generation Service]
    E --> F[Fetch Invoice Data]
    F --> G[Fetch Serial Numbers]
    G --> H[Fetch Packer Info]
    H --> I[Build PDF Document Definition]
    I --> J[Generate PDF Buffer]
    J --> K[Return PDF Response]
```

## Implementation Steps

### 1. Install Dependencies

**File**: `package.json`

Add the following dependencies:
```json
{
  "pdfmake": "^0.2.10",
  "@types/pdfmake": "^0.2.9",
  "fs-extra": "^11.2.0"
}
```

**Dev Dependencies**:
```json
{
  "@types/fs-extra": "^11.0.4"
}
```

### 2. Font Configuration

**File**: `src/config/fonts.ts`

Create font configuration for pdfmake with THSarabun:
```typescript
import { TFont } from 'pdfmake/build/pdfmake';

export const fonts: Record<string, TFont> = {
  THSarabun: {
    normal: 'fonts/THSarabun.ttf',
    bold: 'fonts/THSarabun-Bold.ttf',
    italics: 'fonts/THSarabun-Italic.ttf',
    bolditalics: 'fonts/THSarabun-BoldItalic.ttf',
  },
};

export const defaultFont = 'THSarabun';
```

**Note**: Font files (THSarabun.ttf, THSarabun-Bold.ttf, etc.) must be placed in `src/fonts/` directory.

### 3. PDF Generation Service

**File**: `src/services/pdf.service.ts`

Create a service to handle PDF document definition and generation:

```typescript
import { Request, Response, NextFunction } from 'express';
import pdfmake from 'pdfmake';
import { fonts, defaultFont } from '../config/fonts';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { Response as ExpressResponse } from 'express';

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
    item_code: string;
    item_name: string;
    qty: string;
    unit_code: string;
  }>;
  serialnumbers: Array<{
    ic_code: string;
    serial_number: string;
    line_number: number;
  }>;
  packer: {
    user_code: string;
    user_name: string;
  } | null;
}

export const generatePackingPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoice_no } = req.params;

    // Fetch packing data
    const packingData = await getPackingData(invoice_no);
    
    // Build PDF document definition
    const docDefinition = buildPDFDocument(packingData);
    
    // Generate PDF
    const pdfDocGenerator = pdfmake.createPdf(docDefinition);
    
    pdfDocGenerator.getBuffer((buffer) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice_no}.pdf"`);
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
};

function getPackingData(invoice_no: string): Promise<PackingData> {
  // Implementation using prisma queries similar to getPackingPrintData
}

function buildPDFDocument(data: PackingData): any {
  // Build pdfmake document definition matching the required format
}
```

### 4. Update Invoice Controller

**File**: `src/modules/invoice/invoice.controller.ts`

Add new function:
```typescript
import { generatePackingPDF } from '../../services/pdf.service';

export { generatePackingPDF };
```

### 5. Update Invoice Routes

**File**: `src/modules/invoice/invoice.routes.ts`

Add new route:
```typescript
import { generatePackingPDF } from './invoice.controller';

router.get('/packing/:invoice_no/pdf', generatePackingPDF);
```

### 6. Add Swagger Documentation

**File**: `src/modules/invoice/invoice.routes.ts`

Add swagger documentation for the new endpoint:

```typescript
/**
 * @swagger
 * /invoice/packing/{invoice_no}/pdf:
 *   get:
 *     summary: Generate PDF for packing record
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoice_no
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice number
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Packing not found
 */
router.get('/packing/:invoice_no/pdf', generatePackingPDF);
```

## PDF Document Format

Based on the provided example, the PDF should include:

### Header
```
                                                         PAGE : 1/1

                     SERIAL NUMBER RECORD
              ****************************************

              INV.      : T6902/10093
              DATE      : 02/02/2026
              PACKER    : ST03 (พิศาล จันชื่น)
```

### Table
```
--------------------------------------------------------------------------------
Item Code         Item Name                            Qty       Serial Number      
--------------------------------------------------------------------------------
14A01-0500B       อนาดอล (50X10 แคปซูล) บลิสเตอร์       1         9416001001198         
14A01-0500B       อนาดอล (50X10 แคปซูล) บลิสเตอร์       1         9416001000922         
...
```

### Footer
```
รายการในตาราง 55 รายการ/หน้า
```

## PDF Document Definition Structure

```typescript
const docDefinition = {
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: [40, 60, 40, 60],
  defaultStyle: {
    font: 'THSarabun',
    fontSize: 12,
  },
  content: [
    // Header section
    { text: 'SERIAL NUMBER RECORD', style: 'header', alignment: 'center' },
    // Invoice info table
    // Main items table
  ],
  styles: {
    header: { fontSize: 18, bold: true },
    subheader: { fontSize: 14, bold: true },
    tableHeader: { bold: true },
  },
};
```

## Font File Requirements

The following font files must be obtained and placed in `src/fonts/`:
- `THSarabun.ttf` - Regular
- `THSarabun-Bold.ttf` - Bold
- `THSarabun-Italic.ttf` - Italic
- `THSarabun-BoldItalic.ttf` - Bold Italic

**Note**: THSarabun font is a free Thai font. You can download it from:
- [Thai Royal Society](https://www.orst.go.th)
- [Google Fonts](https://fonts.google.com/specimen/Sarabun) (similar)

## Pagination Considerations

Since the table can have many items (55+ per page), implement proper pagination:
- Calculate items per page (approximately 20-25 rows for A4)
- Use pdfmake's `pageBreak` functionality
- Track current page and total pages

## Error Handling

- Return 404 if invoice not found
- Return 400 if no serial numbers found
- Handle font file loading errors
- Handle PDF generation errors

## Testing Plan

1. Test with valid invoice number
2. Test with invalid invoice number (404)
3. Test with invoice having no serial numbers
4. Test pagination with large datasets
5. Verify Thai characters display correctly
6. Verify PDF file downloads correctly

## File Structure Summary

```
src/
├── config/
│   ├── fonts.ts              # Font configuration
│   └── ...
├── modules/
│   └── invoice/
│       ├── invoice.controller.ts  # Add generatePackingPDF export
│       └── invoice.routes.ts      # Add new route
├── services/
│   └── pdf.service.ts        # PDF generation logic
├── fonts/
│   ├── THSarabun.ttf
│   ├── THSarabun-Bold.ttf
│   ├── THSarabun-Italic.ttf
│   └── THSarabun-BoldItalic.ttf
└── ...
```

## Next Steps

1. Obtain THSarabun font files
2. Install npm dependencies
3. Create font configuration
4. Implement PDF service
5. Add route and controller
6. Test and verify
