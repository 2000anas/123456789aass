import { Router } from 'express';
import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { runMinimalSeed } from '../services/minimalSeed.js';

const router = Router();

router.post('/seed-min', async (req, res, next) => {
  try {
    const secret = req.header('x-setup-secret');
    const expected = process.env.SETUP_SECRET || env.jwtSecret;

    if (!secret || secret !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await connectDatabase();
    const credentials = await runMinimalSeed();

    res.json({
      success: true,
      message: 'Minimal seed completed',
      login: credentials,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
