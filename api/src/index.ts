import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import jsaRoutes from './routes/jsa.routes';
import eventRoutes from './routes/event.routes';
import jsoRoutes from './routes/jso.routes';
import attachmentRoutes from './routes/attachment.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import configRoutes from './routes/config.routes';

const app = express();

if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '0.1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jsas', jsaRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jsos', jsoRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/config', configRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Connected Worker API running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
