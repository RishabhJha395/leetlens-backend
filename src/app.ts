import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';

// Routes imports
import authRoutes from './routes/auth.routes';
import leetcodeRoutes from './routes/leetcode.routes';
import friendRoutes from './routes/friend.routes';
import goalRoutes from './routes/goal.routes';
import noteRoutes from './routes/note.routes';
import aiRoutes from './routes/ai.routes';
import achievementRoutes from './routes/achievement.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import { setupSwagger } from './config/swagger';

const app: Application = express();

// 1. GLOBAL MIDDLEWARES
app.use(helmet()); // Set security HTTP headers

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection & XSS
// In a real app, use express-mongo-sanitize & xss-clean

app.use(compression());

// CORS config
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// 2. ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leetcode', leetcodeRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);

// Setup Swagger UI
setupSwagger(app);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'LeetLens API is running normally.' });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3. GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
