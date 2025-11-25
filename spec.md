# Backend Development Specification
## คู่มือการใช้งาน API - TOC Pharma Packing System

### เกี่ยวกับระบบ
ระบบ Backend API สำหรับการจัดการการแพ็คสินค้าในโกดัง รองรับการสแกน Serial Number และตรวจสอบความถูกต้องของการจัดสินค้าตามใบเสร็จ (Invoice)

### Base URL
```
http://localhost:3000/api
```

### Authentication
ระบบใช้ JWT (JSON Web Token) สำหรับการยืนยันตัวตน
- ส่ง Token ผ่าน Header: `Authorization: Bearer <token>`
- Token จะได้รับหลังจาก Login สำเร็จ
- Endpoints ที่ต้องใช้ Authentication: `/employee/*`, `/invoice/*`, `/product/*`

---

## 1. Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Documentation**: Swagger (OpenAPI)

## 2. Database Schema (PostgreSQL)
*ตารางหลักที่ต้องใช้งานและเชื่อมต่อ*
- **MisUser (`mis_user`)**: ข้อมูลผู้ใช้งานระบบ Login
- **ErpUser (`erp_user`)**: ข้อมูลพนักงาน (Employee)
- **IcTrans (`ic_trans`)**: หัวบิล/ใบเสร็จ (Invoice Header)
- **IcTransDetail (`ic_trans_detail`)**: รายละเอียดสินค้าในบิล (Invoice Details)
- **IcInventory (`ic_inventory`)**: ข้อมูลสินค้า Master
- **IcSerial (`ic_serial`)**: ข้อมูล Serial Number และสถานะ
- **ArCustomer (`ar_customer`)**: ข้อมูลลูกค้า
- **IcTransSerialNumber (`ic_trans_serial_number`)**: บันทึก Serial Number ที่ใช้ในแต่ละ Transaction

---

## 3. API Specifications

### 📋 สรุป API Endpoints

| Method | Endpoint | จุดประสงค์ | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ | ❌ |
| POST | `/api/employee/validate-employee` | ตรวจสอบรหัสพนักงาน | ✅ |
| POST | `/api/invoice/get-invoice-details` | ดึงข้อมูล Invoice | ✅ |
| POST | `/api/product/get-product-by-serial` | ตรวจสอบ Serial | ✅ |
| POST | `/api/invoice/shipment-confirm` | ยืนยันการจัดสินค้า | ✅ |
| GET | `/api/invoice/packing/{invoice_no}` | ข้อมูลพิมพ์ใบปะหน้า | ✅ |

---

## 3. API Specifications

### 3.1 Authentication
#### 🔐 Login - เข้าสู่ระบบ

**Endpoint:** `POST /api/auth/login`

**Purpose:** ตรวจสอบสิทธิ์การเข้าใช้งานและรับ JWT Token

**Authentication Required:** ❌ ไม่ต้องใช้

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Request Example:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "role": "user"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Please provide username and password"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Incorrect username or password"
}
```

**การใช้งาน Token:**
```bash
# นำ token ที่ได้ไปใส่ใน Header ของ request ถัดไป
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3.2 Employee Verification
#### 👤 Validate Employee - ตรวจสอบรหัสพนักงาน

**Endpoint:** `POST /api/employee/validate-employee`

**Purpose:** ตรวจสอบว่ารหัสพนักงานมีอยู่ในระบบหรือไม่ และดึงข้อมูลพนักงาน

**Authentication Required:** ✅ ต้องใช้ Bearer Token

**Request Body:**
```json
{
  "employee_id": "string"
}
```

**Request Example:**
```json
{
  "employee_id": "EMP001"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "employee": {
    "code": "EMP001",
    "name": "สมชาย ใจดี"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Please provide employee_id"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Employee not found"
}
```

**Use Case:**
- ใช้สำหรับระบุว่าใครเป็นคนจัดสินค้า
- ตรวจสอบก่อนเริ่มกระบวนการแพ็ค

---

### 3.3 Invoice & Packing Process

#### 📦 Get Invoice Details - ดึงข้อมูลใบเสร็จและรายการสินค้า

**Endpoint:** `POST /api/invoice/get-invoice-details`

**Purpose:** ดึงข้อมูลรายละเอียดของ Invoice พร้อมรายการสินค้าที่ต้องจัด

**Authentication Required:** ✅ ต้องใช้ Bearer Token

**Request Body:**
```json
{
  "invoice_no": "string"
}
```

**Request Example:**
```json
{
  "invoice_no": "INV2025001"
}
```

**Response (Success - 200):**
```json
{
  "doc_no": "INV2025001",
  "trans_flag": 44,
  "doc_date": "2025-11-25T00:00:00.000Z",
  "cust_code": "C001",
  "total_amount": "15000.00",
  "arCustomer": {
    "code": "C001",
    "name_1": "บริษัท ABC จำกัด"
  },
  "details": [
    {
      "roworder": 1,
      "item_code": "PROD001",
      "item_name": "ยาแก้ปวด 500mg",
      "qty": "100",
      "unit_code": "BOX",
      "price": "150.00",
      "icInventory": {
        "code": "PROD001",
        "name_1": "ยาแก้ปวด 500mg",
        "ic_serial_no": 1,
        "is_pharma_serialization": 1
      }
    }
  ]
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invoice number is required"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

**Field Descriptions:**
- `trans_flag`: 44 = ใบเสร็จขาย (Invoice)
- `ic_serial_no`: 1 = สินค้าต้องมี Serial Number, 0 = ไม่ต้องมี
- `is_pharma_serialization`: 1 = ต้องสแกน Serial แบบยาเสพติด, 0 = สแกนปกติ

**Use Case:**
- ดึงข้อมูลเมื่อพนักงานสแกนหรือพิมพ์เลข Invoice
- ใช้แสดงรายการสินค้าที่ต้องจัด
- นับจำนวนที่ต้องสแกน Serial

---

#### 🔍 Get Product by Serial - ตรวจสอบ Serial Number

**Endpoint:** `POST /api/product/get-product-by-serial`

**Purpose:** ตรวจสอบว่า Serial Number มีในระบบหรือไม่ และดึงข้อมูลสินค้า (Validate Only - ไม่บันทึกลง DB)

**Authentication Required:** ✅ ต้องใช้ Bearer Token

**Request Body:**
```json
{
  "serial_number": "string"
}
```

**Request Example:**
```json
{
  "serial_number": "SN20250001"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Product found",
  "icInventory": {
    "code": "PROD001",
    "name_1": "ยาแก้ปวด 500mg",
    "status": 0,
    "ic_serial_no": 1,
    "is_pharma_serialization": 1
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Serial number is required"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Serial number not found"
}
```

**หรือ**
```json
{
  "success": false,
  "message": "Product not found for this serial"
}
```

**Field Descriptions:**
- `status`: สถานะของ Serial Number (0 = ยังไม่ถูกใช้, อื่นๆ = ถูกใช้แล้ว)

**Logic Flow:**
1. รับ Serial Number จาก Client
2. ค้นหาใน `ic_serial` table
3. ดึงข้อมูลสินค้าที่เชื่อมโยง
4. **ไม่มี**การบันทึกข้อมูลใดๆ ลง Database

**Use Case:**
- ใช้ตอนพนักงานสแกน Serial แต่ละตัว
- แสดงข้อมูลสินค้าที่สแกนเพื่อยืนยัน
- ตรวจสอบก่อนจะยืนยันการจัดสินค้า

**⚠️ ข้อสำคัญ:**
- API นี้เป็นเพียงการ Query ข้อมูล
- ไม่ได้ทำการบันทึกหรืออัปเดตสถานะใดๆ
- การบันทึกจริงจะเกิดที่ `/shipment-confirm`

---

#### ✅ Shipment Confirm - ยืนยันการจัดสินค้า

**Endpoint:** `POST /api/invoice/shipment-confirm`

**Purpose:** บันทึกการจัดสินค้าและ Serial Number ทั้งหมดที่สแกนแล้ว

**Authentication Required:** ✅ ต้องใช้ Bearer Token

**Request Body:**
```json
{
  "invoice_no": "string",
  "serials": [
    {
      "doc_no": "string",
      "trans_flag": number,
      "doc_line_number": number,
      "ic_code": "string",
      "serial_number": "string",
      "cust_code": "string"
    }
  ]
}
```

**Request Example:**
```json
{
  "invoice_no": "INV2025001",
  "serials": [
    {
      "doc_no": "INV2025001",
      "trans_flag": 44,
      "doc_line_number": 1,
      "ic_code": "PROD001",
      "serial_number": "SN20250001",
      "cust_code": "C001"
    },
    {
      "doc_no": "INV2025001",
      "trans_flag": 44,
      "doc_line_number": 1,
      "ic_code": "PROD001",
      "serial_number": "SN20250002",
      "cust_code": "C001"
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Shipment confirmed successfully"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invoice number is required"
}
```

**หรือ**
```json
{
  "success": false,
  "message": "Serials list is required"
}
```

**หรือ**
```json
{
  "success": false,
  "message": "Item code PROD999 (Serial: SN20250099) is not in this invoice"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

**Logic Flow:**
1. รับ Invoice Number และ List ของ Serial ทั้งหมด
2. ตรวจสอบว่า Invoice มีอยู่จริงในระบบ
3. ตรวจสอบว่าแต่ละ Serial อยู่ในรายการสินค้าของ Invoice นี้
4. บันทึก Serial ทั้งหมดลงใน `ic_trans_serial_number` table
5. ใช้ Transaction เพื่อความปลอดภัยของข้อมูล

**Field Descriptions:**
- `doc_line_number`: เลขบรรทัดของสินค้าใน Invoice (ใช้เชื่อมโยง)
- `trans_flag`: 44 = Invoice
- `ic_code`: รหัสสินค้า
- `serial_number`: หมายเลข Serial ที่สแกน

**Use Case:**
- เรียกเมื่อพนักงานสแกน Serial ครบตามจำนวนแล้ว
- กดปุ่ม "ยืนยัน" หรือ "Confirm"
- บันทึกประวัติการจัดสินค้า

**⚠️ ข้อควรระวัง:**
- ต้องส่ง Serial ทั้งหมดที่สแกนมาในครั้งเดียว
- ถ้า Serial ไหนไม่อยู่ใน Invoice จะ Return Error
- ใช้ Transaction ดังนั้นถ้าเกิด Error ตัวใดตัวหนึ่ง ทั้งหมดจะไม่ถูกบันทึก

---

### 3.4 Reporting

#### 🖨️ Get Packing Print Data - ข้อมูลสำหรับพิมพ์ใบปะหน้า

**Endpoint:** `GET /api/invoice/packing/{invoice_no}`

**Purpose:** ดึงข้อมูลสำหรับสร้างใบปะหน้า (Packing Slip) พร้อม Serial Number ที่จัดแล้ว

**Authentication Required:** ✅ ต้องใช้ Bearer Token

**URL Parameters:**
- `invoice_no` (required): หมายเลขใบเสร็จ

**Request Example:**
```bash
GET /api/invoice/packing/INV2025001
```

**Response (Success - 200):**
```json
{
  "doc_no": "INV2025001",
  "trans_flag": 44,
  "doc_date": "2025-11-25T00:00:00.000Z",
  "cust_code": "C001",
  "total_amount": "15000.00",
  "arCustomer": {
    "code": "C001",
    "name_1": "บริษัท ABC จำกัด",
    "address": "",
    "telephone": ""
  },
  "details": [
    {
      "roworder": 1,
      "item_code": "PROD001",
      "item_name": "ยาแก้ปวด 500mg",
      "qty": "100",
      "unit_code": "BOX",
      "price": "150.00",
      "icInventory": {
        "code": "PROD001",
        "name_1": "ยาแก้ปวด 500mg",
        "ic_serial_no": 1,
        "is_pharma_serialization": 1
      }
    }
  ],
  "serialnumbers": [
    {
      "ic_code": "PROD001",
      "serial_number": "SN20250001",
      "line_number": 1,
      "doc_line_number": 1
    },
    {
      "ic_code": "PROD001",
      "serial_number": "SN20250002",
      "line_number": 2,
      "doc_line_number": 1
    }
  ]
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Invoice not found"
}
```

**Field Descriptions:**
- `serialnumbers`: รายการ Serial Number ทั้งหมดที่บันทึกไว้สำหรับ Invoice นี้
- `line_number`: ลำดับที่ของ Serial ในระบบ (roworder)
- `doc_line_number`: บรรทัดสินค้าใน Invoice ที่ Serial นี้เป็นของ

**Use Case:**
- ดึงข้อมูลเมื่อต้องการพิมพ์ใบปะหน้า (Packing Slip)
- แสดงรายการสินค้าและ Serial ที่จัดไปแล้ว
- ใช้สำหรับการตรวจสอบย้อนหลัง

**การใช้งานจริง:**
1. เรียก API หลังจาก Shipment Confirm สำเร็จ
2. นำข้อมูลที่ได้ไปแสดงในหน้าจอหรือ Generate PDF
3. พิมพ์ออกมาติดกับกล่องสินค้า

---

## 4. Workflow การใช้งานทั่วไป

### 🔄 Flow การจัดสินค้า (Packing Process)

```
1. Login
   POST /api/auth/login
   ↓ รับ Token

2. ตรวจสอบพนักงาน
   POST /api/employee/validate-employee
   ↓ ยืนยันตัวตนพนักงาน

3. สแกน/ใส่เลข Invoice
   POST /api/invoice/get-invoice-details
   ↓ ได้รายการสินค้าที่ต้องจัด

4. สแกน Serial (ทำซ้ำจนครบ)
   POST /api/product/get-product-by-serial
   ↓ ตรวจสอบแต่ละ Serial
   ↓ เก็บข้อมูลไว้ใน Client

5. ยืนยันการจัดสินค้า
   POST /api/invoice/shipment-confirm
   ↓ ส่ง Serial ทั้งหมดที่สแกน

6. พิมพ์ใบปะหน้า
   GET /api/invoice/packing/{invoice_no}
   ↓ ได้ข้อมูลสำหรับพิมพ์
```

### 📊 Error Handling

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (ข้อมูลไม่ครบหรือไม่ถูกต้อง)
- `401` - Unauthorized (ไม่มี Token หรือ Token หมดอายุ)
- `404` - Not Found (ไม่พบข้อมูล)
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "success": false,
  "message": "คำอธิบาย error"
}
```

### 🔐 Security Best Practices

1. **Token Management:**
   - เก็บ Token ใน secure storage (NOT localStorage)
   - ตั้งเวลา Token expiry
   - Refresh token เมื่อใกล้หมดอายุ

2. **Input Validation:**
   - ตรวจสอบข้อมูลที่ส่งมาทุกครั้ง
   - ใช้ HTTPS ในการส่งข้อมูล

3. **Error Messages:**
   - ไม่แสดงข้อมูล sensitive ใน error message
   - Log errors สำหรับ debugging

---

## 5. Database Schema Details