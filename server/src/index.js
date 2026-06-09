require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const classRoutes        = require('./routes/classes');
const canvasRoutes       = require('./routes/canvas');
const assignmentRoutes   = require('./routes/assignments');
const syllabusRoutes     = require('./routes/syllabus');
const dayRoutes          = require('./routes/day');
const studyPlanRoutes    = require('./routes/studyplan');
const checkinRoutes      = require('./routes/checkin');
const performanceRoutes  = require('./routes/performance');
const settingsRoutes     = require('./routes/settings');
const viewRoutes         = require('./routes/view');
const subscriptionRoutes    = require('./routes/subscription');
const googleCalendarRoutes  = require('./routes/googleCalendar');
const preferencesRoutes     = require('./routes/preferences');
const { startCron }         = require('./cron');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    // Production
    'https://navi-eosin-alpha.vercel.app',
    'https://mynaviapp.com',
    'https://www.mynaviapp.com',
    // Local development
    'http://localhost:5173',
    'http://localhost:5176',
    'http://localhost:5178',
  ],
  credentials: true,
}));

// Stripe webhook needs raw body — must come before express.json()
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), require('./routes/subscription').webhookHandler);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Navi API is running' });
});

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/classes',      classRoutes);
app.use('/api/canvas',       canvasRoutes);
app.use('/api/assignments',  assignmentRoutes);
app.use('/api/syllabus',     syllabusRoutes);
app.use('/api/day',          dayRoutes);
app.use('/api/studyplan',    studyPlanRoutes);
app.use('/api/checkin',      checkinRoutes);
app.use('/api/performance',  performanceRoutes);
app.use('/api/settings',     settingsRoutes);
app.use('/api/view',         viewRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/google',       googleCalendarRoutes);
app.use('/api/preferences',  preferencesRoutes);

startCron();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
