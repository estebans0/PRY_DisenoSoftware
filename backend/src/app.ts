// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api', routes);

export default app;
