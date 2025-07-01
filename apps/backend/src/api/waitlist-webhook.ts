// import { Hono } from 'hono';
// import { env } from 'hono/adapter';
// import { zValidator } from '@hono/zod-validator';
// import { waitlistMatcherAlg } from '../lib/utils';
// import { CryptoUtils } from '../lib/crypto.utils';
// import { z } from 'zod';

// const waitlistApp = new Hono();

// // Webhook schema for triggering waitlist matching
// const triggerMatchingSchema = z.object({
//   signature: z.string().optional(),
//   timestamp: z.string().optional(),
//   force: z.boolean().optional().default(false)
// });

// // POST /api/waitlist/trigger-matching - Trigger waitlist matching algorithm
// waitlistApp.post('/trigger-matching', zValidator('json', triggerMatchingSchema), async (c) => {
//   try {
//     const { signature, timestamp, force } = c.req.valid('json');
//     const { WAITLIST_WEBHOOK_SECRET } = env<{ WAITLIST_WEBHOOK_SECRET?: string }>(c, 'node');

//     // Verify webhook signature if secret is configured
//     if (WAITLIST_WEBHOOK_SECRET && signature && timestamp) {
//       const body = JSON.stringify(c.req.valid('json'));
//       const isValid = CryptoUtils.verifyWebhookSignature(
//         body,
//         signature,
//         WAITLIST_WEBHOOK_SECRET
//       );

//       if (!isValid) {
//         return c.json({ 
//           ok: false, 
//           error: 'Invalid webhook signature' 
//         }, 401);
//       }

//       // Check timestamp to prevent replay attacks (within 5 minutes)
//       const requestTime = new Date(timestamp).getTime();
//       const currentTime = Date.now();
//       const timeDiff = Math.abs(currentTime - requestTime);
      
//       if (timeDiff > 5 * 60 * 1000) { // 5 minutes
//         return c.json({ 
//           ok: false, 
//           error: 'Request timestamp too old' 
//         }, 401);
//       }
//     }

//     console.log('Triggering waitlist matching algorithm...');
//     const startTime = Date.now();
    
//     // Run the matching algorithm
//     await waitlistMatcherAlg();
    
//     const endTime = Date.now();
//     const duration = endTime - startTime;

//     console.log(`Waitlist matching completed in ${duration}ms`);

//     return c.json({
//       ok: true,
//       message: 'Waitlist matching algorithm executed successfully',
//       data: {
//         executionTime: duration,
//         timestamp: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error('Waitlist matching error:', error);
//     return c.json({
//       ok: false,
//       error: error instanceof Error ? error.message : 'Failed to execute waitlist matching'
//     }, 500);
//   }
// });

// // GET /api/waitlist/matching-status - Get basic status/health check
// waitlistApp.get('/matching-status', async (c) => {
//   try {
//     // Simple health check - could be extended to show last run time, stats, etc.
//     return c.json({
//       ok: true,
//       status: 'healthy',
//       message: 'Waitlist matching service is operational',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     return c.json({
//       ok: false,
//       error: 'Service unavailable'
//     }, 500);
//   }
// });

// // POST /api/waitlist/manual-trigger - Manual trigger for admins (with basic auth)
// waitlistApp.post('/manual-trigger', async (c) => {
//   try {
//     // Get Authorization header
//     const payload = c.get('jwtPayload');

//     console.log(`Manual waitlist matching triggered by admin ${payload?.email} ${payload?.id}`);

//     const startTime = Date.now();
    
//     await waitlistMatcherAlg();
    
//     const endTime = Date.now();
//     const duration = endTime - startTime;

//     console.log(`Manual waitlist matching completed in ${duration}ms`);

//     return c.json({
//       ok: true,
//       message: 'Manual waitlist matching executed successfully',
//       data: {
//         executionTime: duration,
//         timestamp: new Date().toISOString(),
//         triggeredBy: 'admin'
//       }
//     });

//   } catch (error) {
//     console.error('Manual waitlist matching error:', error);
//     return c.json({
//       ok: false,
//       error: error instanceof Error ? error.message : 'Failed to execute manual waitlist matching'
//     }, 500);
//   }
// });

// export { waitlistApp };
