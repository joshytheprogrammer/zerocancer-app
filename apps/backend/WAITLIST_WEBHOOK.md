# Waitlist Matching Webhook Documentation

The waitlist matching algorithm can be triggered via webhook endpoints for automated or manual execution.

## Webhook Endpoints

### 1. Automated Trigger with Signature Verification

```
POST /api/v1/waitlist/trigger-matching
```

**Request Body:**

```json
{
  "signature": "sha256=...", // Optional: HMAC signature for verification
  "timestamp": "2025-06-28T12:00:00.000Z", // Optional: Request timestamp
  "force": false // Optional: Force execution even if conditions aren't met
}
```

**Response:**

```json
{
  "ok": true,
  "message": "Waitlist matching algorithm executed successfully",
  "data": {
    "executionTime": 1234,
    "timestamp": "2025-06-28T12:00:00.000Z"
  }
}
```

### 2. Manual Admin Trigger

```
POST /api/v1/waitlist/manual-trigger
Authorization: Bearer YOUR_ADMIN_API_KEY
```

**Response:**

```json
{
  "ok": true,
  "message": "Manual waitlist matching executed successfully",
  "data": {
    "executionTime": 1234,
    "timestamp": "2025-06-28T12:00:00.000Z",
    "triggeredBy": "admin"
  }
}
```

### 3. Health Check

```
GET /api/v1/waitlist/matching-status
```

**Response:**

```json
{
  "ok": true,
  "status": "healthy",
  "message": "Waitlist matching service is operational",
  "timestamp": "2025-06-28T12:00:00.000Z"
}
```

## Environment Variables

### Required for Production

- `WAITLIST_WEBHOOK_SECRET`: Secret key for webhook signature verification (recommended)
- `ADMIN_API_KEY`: API key for manual admin triggers (recommended)

### Example .env

```env
WAITLIST_WEBHOOK_SECRET=your_webhook_secret_key_here
ADMIN_API_KEY=your_admin_api_key_here
```

## Webhook Signature Verification

For secure automated triggers, the webhook verifies HMAC-SHA256 signatures:

1. Calculate signature: `HMAC-SHA256(request_body, webhook_secret)`
2. Send as: `sha256=calculated_signature`
3. Include current timestamp in request body
4. Request must be within 5 minutes of timestamp

**Example in Node.js:**

```javascript
const crypto = require("crypto");

const payload = JSON.stringify({
  timestamp: new Date().toISOString(),
  force: false,
});

const signature = crypto
  .createHmac("sha256", process.env.WAITLIST_WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

const response = await fetch("/api/v1/waitlist/trigger-matching", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ...JSON.parse(payload),
    signature: `sha256=${signature}`,
  }),
});
```

## Cron Job Examples

### Using cURL (Linux/Unix)

```bash
# Add to crontab (runs every hour)
0 * * * * curl -X POST https://your-domain.com/api/v1/waitlist/manual-trigger \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json"
```

### Using Node.js Script

```javascript
// scheduler.js
const cron = require("node-cron");

// Run every hour
cron.schedule("0 * * * *", async () => {
  try {
    const response = await fetch(
      "https://your-domain.com/api/v1/waitlist/manual-trigger",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    console.log("Waitlist matching result:", result);
  } catch (error) {
    console.error("Waitlist matching failed:", error);
  }
});
```

### Using GitHub Actions

```yaml
# .github/workflows/waitlist-matching.yml
name: Waitlist Matching
on:
  schedule:
    - cron: "0 * * * *" # Every hour

jobs:
  trigger-matching:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Waitlist Matching
        run: |
          curl -X POST ${{ secrets.API_BASE_URL }}/api/v1/waitlist/manual-trigger \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}" \
            -H "Content-Type: application/json"
```

## Algorithm Behavior

The waitlist matching algorithm:

1. **Processes up to 10 patients per screening type** (FCFS order)
2. **Skips patients with 3+ unclaimed allocations** (prevents over-allocation)
3. **Skips patients already matched for the same screening type**
4. **Prioritizes campaigns by:**
   - Most specific (fewest screening types supported)
   - Highest available amount
   - Earliest created date
5. **Falls back to general donor pool** if no specific campaign matches
6. **Creates notifications** for matched patients
7. **Updates campaign balances** and waitlist statuses atomically

## Monitoring

Monitor the webhook execution by:

1. **Checking logs** for execution time and success/failure
2. **Using the health check endpoint** for uptime monitoring
3. **Tracking response times** and error rates
4. **Monitoring database** for successful matches and notifications

## Security Best Practices

1. **Use HTTPS** for all webhook calls
2. **Implement signature verification** for automated triggers
3. **Rotate API keys** regularly
4. **Monitor for replay attacks** (timestamp validation)
5. **Rate limit** webhook endpoints if needed
6. **Log all webhook calls** for audit purposes
