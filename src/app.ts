import express from 'express';
import { errorHandler } from './middlewares/error_handler';
import { notFound } from './middlewares/not_found';
import authRoutes from './modules/auth';
import usersRoutes from './modules/users';
import playersRoutes from './modules/players';
import teamsRoutes from './modules/teams';
import matchesRoutes from './modules/matches';
import uploadRoutes from './modules/uploads';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// logs request
app.use((req, res, next) => {
  const startTime = Date.now();
  next();
  console.log(`[${new Date().toISOString()}] - ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startTime}ms`);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;