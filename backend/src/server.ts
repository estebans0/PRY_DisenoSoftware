import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

async function start() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Routers
  app.use('/api', routes);

  app.use(errorHandler);

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start();
