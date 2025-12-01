import request from 'supertest';

jest.mock('../../../modules/token/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../../config/prisma', () => ({
    __esModule: true,
    default: {
        icSerial: {
            findFirst: jest.fn(),
        },
    },
}));

import { app } from '../../../index';
import prisma from '../../../config/prisma';

describe('POST /product/serial-number', () => {
    const endpoint = '/api/product/serial-number';

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return product details for a valid serial number', async () => {
        const serialNumber = 'ABC123';
        const mockSerial = {
            serial_number: serialNumber,
            status: 1,
            ic_code: 'P001',
            wh_code: 'WH01',
            shelf_code: 'S01',
            icInventory: {
                code: 'P001',
                name_1: 'Product Name',
                ic_serial_no: 100,
                is_pharma_serialization: 1,
            },
        };

        (prisma.icSerial.findFirst as jest.Mock).mockResolvedValue(mockSerial);

        const response = await request(app)
            .post(endpoint)
            .send({ serial_number: serialNumber })
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            message: 'Product found',
            data: {
                ic_code: 'P001',
                serial_number: serialNumber,
                status: 1,
                wh_code: 'WH01',
                shelf_code: 'S01',
                icInventory: {
                    code: 'P001',
                    name_1: 'Product Name',
                    ic_serial_no: 100,
                    is_pharma_serialization: 1,
                },
            },
        });

        expect(prisma.icSerial.findFirst).toHaveBeenCalledWith({
            where: { serial_number: serialNumber },
            include: { icInventory: true },
        });
    });

    it('should return 400 when serial_number is missing', async () => {
        const response = await request(app).post(endpoint).send({}).expect(400);
        expect(response.body).toMatchObject({
            success: false,
            message: 'Serial number is required'
        });
    });

    it('should return 404 when serial not found', async () => {
        (prisma.icSerial.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post(endpoint)
            .send({ serial_number: 'NONEXIST' })
            .expect(404);

        expect(response.body).toMatchObject({
            success: false,
            message: 'Serial number not found'
        });
    });
});
