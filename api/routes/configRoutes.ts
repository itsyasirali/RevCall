import express from 'express';
import { getIceServers } from '../controllers/configController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Fetch STUN/TURN configurations
router.get('/ice-servers', auth, getIceServers);

export default router;
