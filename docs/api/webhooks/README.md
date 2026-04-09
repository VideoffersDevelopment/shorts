# Webhook Handlers

Webhook endpoints for external service callbacks.

**Location:** `src/app/api/webhooks/`

---

## Webhooks Overview

| Endpoint | Provider | Purpose |
|----------|----------|---------|
| `/api/webhooks/qencode` | Qencode | Video transcoding callbacks |
| `/api/webhooks/przelewy24` | Przelewy24 | Payment confirmation |
| `/api/webhooks/tpay` | Tpay | Payment confirmation |

---

## Qencode Webhook

**Endpoint:** `POST /api/webhooks/qencode`
**File:** `src/app/api/webhooks/qencode/route.ts`

### Headers

| Header | Description |
|--------|-------------|
| `X-Qencode-Signature` | HMAC-SHA256 signature |
| `Content-Type` | `application/json` |

### Signature Verification

```typescript
const signature = createHmac('sha256', QENCODE_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')

// Timing-safe comparison
```

### Payload

```typescript
interface QencodeWebhookPayload {
  task_token: string
  status: 'completed' | 'error' | 'encoding' | 'pending'
  percent?: number
  error_code?: number
  error_message?: string
  videos?: Array<{
    url: string
    type: string
    duration?: number
    size?: number
    width?: number
    height?: number
    thumbnail?: string
  }>
}
```

### Processing Flow

**On `completed`:**
1. Find short by `qencodeTaskId`
2. Extract HLS URL and thumbnail from videos array
3. Update short:
   - hlsPlaylistUrl = videos[0].url
   - thumbnailUrl = videos[0].thumbnail
   - duration = videos[0].duration
   - status = PUBLISHED
   - publishedAt = now()
   - expiresAt = now() + 30 days
4. Send Inngest event: `shorts/transcode.completed`
5. Send "short published" email

**On `error`:**
1. Increment retryCount
2. If retryCount < 3: send `shorts/transcode.retry` event
3. If retryCount >= 3:
   - Refund credit
   - Set status = DRAFT
   - Set processingError
   - Send error email

### Response

| Status | Meaning |
|--------|---------|
| 200 | Webhook processed |
| 401 | Invalid signature |
| 404 | Short not found |
| 500 | Processing error |

---

## Przelewy24 Webhook

**Endpoint:** `POST /api/webhooks/przelewy24`
**File:** `src/app/api/webhooks/przelewy24/route.ts`

### Request Format

Content-Type: `application/x-www-form-urlencoded`

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `merchantId` | number | Merchant ID |
| `posId` | number | POS ID |
| `sessionId` | string | Our payment session ID |
| `orderId` | number | Przelewy24 order ID |
| `amount` | number | Amount in grosze |
| `currency` | string | Currency code |
| `statement` | string | Transaction description |
| `sign` | string | SHA384 signature |

### Signature Verification

```typescript
const signatureData = `${sessionId}|${orderId}|${amount}|${currency}|${CRC}`
const expectedSign = createHash('sha384')
  .update(signatureData)
  .digest('hex')
```

### Processing Flow

1. Verify signature
2. Find payment by sessionId
3. Verify amount matches
4. If status change needed:
   - Update payment status to SUCCEEDED
   - Add credits to user
   - Create CreditTransaction
   - If linked to short: trigger publication
5. Return "OK"

### Response

Must return exactly `OK` string for successful processing.

---

## Tpay Webhook

**Endpoint:** `POST /api/webhooks/tpay`
**File:** `src/app/api/webhooks/tpay/route.ts`

### Request Format

Content-Type: `application/x-www-form-urlencoded`

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Tpay transaction ID |
| `tr_id` | string | Our transaction ID |
| `tr_amount` | string | Amount (decimal) |
| `tr_crc` | string | Our CRC field |
| `tr_status` | string | TRUE/FALSE |
| `tr_error` | string | Error code |
| `md5sum` | string | MD5 checksum |

### Checksum Verification

```typescript
const checksumData = `${id}${tr_id}${tr_amount}${tr_crc}${SECURITY_CODE}`
const expectedMd5 = createHash('md5')
  .update(checksumData)
  .digest('hex')
```

### Processing Flow

Similar to Przelewy24:
1. Verify checksum
2. Find payment
3. Process based on tr_status
4. Update records

### Response

Must return exactly `TRUE` string for successful processing.

---

## Security Considerations

### IP Whitelisting

Consider restricting webhook endpoints to known provider IPs:
- Przelewy24: Check their documentation for IP ranges
- Tpay: Check their documentation for IP ranges
- Qencode: Check their documentation for IP ranges

### Signature Verification

All webhooks must verify signatures before processing:
- Invalid signature: Return 401, log attempt
- Never process without verification

### Idempotency

Webhooks may be delivered multiple times:
- Check if payment already processed
- Use database transactions
- Log all attempts

### Logging

Log all webhook attempts for debugging:
```typescript
console.log('Webhook received:', {
  provider: 'przelewy24',
  sessionId,
  status,
  timestamp: new Date().toISOString()
})
```

---

## Testing

### Local Development

Use ngrok to expose local server:
```bash
ngrok http 3000
```

Configure webhook URLs in provider dashboards to use ngrok URL.

### Sandbox Testing

All providers offer sandbox/test environments:
- Przelewy24: sandbox.przelewy24.pl
- Tpay: test mode in dashboard
- Qencode: test API keys

### Manual Testing

Use curl to test webhook endpoints:
```bash
curl -X POST http://localhost:3000/api/webhooks/qencode \
  -H "Content-Type: application/json" \
  -H "X-Qencode-Signature: test123" \
  -d '{"task_token":"abc","status":"completed"}'
```

---

## Related Documentation

- [Payment Flow](../../features/payments/checkout.md)
- [Publishing Workflow](../../features/shorts/publishing.md)
- [Qencode Integration](../../guides/qencode-integration.md)
- [Payment Providers](../../guides/payment-providers.md)

---

**Last Updated:** 2026-01-01
