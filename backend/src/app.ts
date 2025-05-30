// src/app.ts
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors(), express.json());

mongoose.connect(process.env.MONGO_URI!, {
  // options…
})
.then(() => console.log('🗄️  Mongo connected'))
.catch(err => console.error(err));

app.get('/ping', (req, res) => res.send('pong'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
