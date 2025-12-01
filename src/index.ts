import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config';

export const app = express();
const port = config.port;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';
import swaggerUi from 'swagger-ui-express';
import specs from './config/swagger';

app.get('/', (req, res) => {
  res.json({ message: 'TOC Pharma Packing API is running' });
});

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api', routes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

