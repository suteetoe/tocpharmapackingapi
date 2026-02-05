import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const pathPrefix = config.pathPrefix.replace(/\/$/, ''); // Remove trailing slash if present
const serverUrl = `${config.hostName}:${config.port}${pathPrefix}/api`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TOC Pharma Packing API',
      version: '1.0.0',
      description: 'API documentation for TOC Pharma Packing application - Generates OpenAPI specification for client SDK generation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: serverUrl,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export default specs;
