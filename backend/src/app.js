require('./config/env');

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const organizerRoutes = require('./routes/organizer.routes');
const adminRoutes = require('./routes/admin.routes');
const clubsRoutes = require('./routes/clubs.routes');
const eventsRoutes = require('./routes/events.routes');
const participantsRoutes = require('./routes/participants.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const developmentOrigins =
  process.env.NODE_ENV === 'production'
    ? []
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
      ];

const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

app.set('trust proxy', true);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is healthy',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/favorites', favoritesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
