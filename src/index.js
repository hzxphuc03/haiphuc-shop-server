import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to HAIPHUC SHOP API' });
});
// Database Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haiphuc-shop';
mongoose.connect(mongoUri)
    .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(port, () => {
        console.log(`🚀 Server is running on http://localhost:${port}`);
    });
})
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});
//# sourceMappingURL=index.js.map