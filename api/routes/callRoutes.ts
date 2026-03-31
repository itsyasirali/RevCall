import express from 'express';
// import { saveCall, getCallHistory } from '../controllers/callController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Call logging and history are now handled locally on the frontend via AsyncStorage

export default router;
