/**
 * Qencode API client for video transcoding
 *
 * Features:
 * - Start HLS transcoding jobs
 * - Validate webhook payloads
 * - HLS output with multiple quality levels
 */

// Environment variables
const QENCODE_API_KEY = process.env.QENCODE_API_KEY!

// API endpoints
const QENCODE_API_URL = "https://api.qencode.com/v1"

export interface QencodeJobOptions {
  inputUrl: string
  outputBucket: string
  outputPath: string
  webhookUrl: string
}

export interface QencodeJobResult {
  taskToken: string
  statusUrl: string
}

interface QencodeApiResponse<T> {
  error: number
  message?: string
  token?: string
  [key: string]: unknown
}

interface QencodeStartTaskResponse {
  error: number
  task_token?: string
  status_url?: string
  message?: string
}

/**
 * Get an access token from Qencode API
 */
async function getAccessToken(): Promise<string> {
  console.log("[Qencode] Getting access token...")
  console.log("[Qencode] API Key set:", !!QENCODE_API_KEY)
  console.log("[Qencode] API Key length:", QENCODE_API_KEY?.length || 0)

  const response = await fetch(`${QENCODE_API_URL}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      api_key: QENCODE_API_KEY
    })
  })

  console.log("[Qencode] Access token response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Qencode] ❌ Access token request failed:", response.statusText, errorText)
    throw new Error(`Failed to get Qencode access token: ${response.statusText}`)
  }

  const data: QencodeApiResponse<{ token: string }> = await response.json()
  console.log("[Qencode] Access token response:", { error: data.error, hasToken: !!data.token, message: data.message })

  if (data.error !== 0 || !data.token) {
    console.error("[Qencode] ❌ Access token API error:", data)
    throw new Error(`Qencode API error: ${data.message || "Unknown error"}`)
  }

  console.log("[Qencode] ✅ Access token obtained")
  return data.token
}

/**
 * Create a new transcoding task
 */
async function createTask(accessToken: string): Promise<string> {
  console.log("[Qencode] Creating new task...")

  const response = await fetch(`${QENCODE_API_URL}/create_task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      token: accessToken
    })
  })

  console.log("[Qencode] Create task response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Qencode] ❌ Create task failed:", response.statusText, errorText)
    throw new Error(`Failed to create Qencode task: ${response.statusText}`)
  }

  const data: QencodeApiResponse<{ task_token: string }> = await response.json()
  console.log("[Qencode] Create task response:", { error: data.error, hasTaskToken: !!data.task_token, message: data.message })

  if (data.error !== 0) {
    console.error("[Qencode] ❌ Create task API error:", data)
    throw new Error(`Qencode API error: ${data.message || "Unknown error"}`)
  }

  console.log("[Qencode] ✅ Task created:", data.task_token)
  return data.task_token as string
}

/**
 * Start a Qencode transcoding job
 *
 * @param options - Job configuration
 * @returns Task token for tracking the job
 */
export async function startQencodeJob(
  options: QencodeJobOptions
): Promise<QencodeJobResult> {
  const { inputUrl, outputBucket, outputPath, webhookUrl } = options

  console.log("[Qencode] ========== STARTING TRANSCODING JOB ==========")
  console.log("[Qencode] Input URL (first 100 chars):", inputUrl.substring(0, 100) + "...")
  console.log("[Qencode] Output bucket:", outputBucket)
  console.log("[Qencode] Output path:", outputPath)
  console.log("[Qencode] Webhook URL:", webhookUrl)

  // Step 1: Get access token
  const accessToken = await getAccessToken()

  // Step 2: Create task
  const taskToken = await createTask(accessToken)

  // Step 3: Configure and start the task
  // Qencode Cloudflare R2 format (from docs):
  // URL must include account_id: s3://[account_id].r2.cloudflarestorage.com/bucket/path
  // Only 3 fields allowed: url, key, secret (NO host, endpoint, or permissions!)
  // See: https://docs-stage.qencode.com/tutorials/media-storage/third-party-storage/cloudflare/

  const r2Endpoint = process.env.R2_ENDPOINT || ""
  // Extract account_id.r2.cloudflarestorage.com from endpoint
  // e.g., "https://4aee73861ceafb5684fbeef847a37337.r2.cloudflarestorage.com"
  //    -> "4aee73861ceafb5684fbeef847a37337.r2.cloudflarestorage.com"
  const r2Host = r2Endpoint.replace(/^https?:\/\//, "")

  // Format: s3://[account_id].r2.cloudflarestorage.com/bucket/path
  const destinationUrl = `s3://${r2Host}/${outputBucket}/${outputPath}`

  const destination = [
    {
      url: destinationUrl,
      key: process.env.R2_ACCESS_KEY_ID,
      secret: process.env.R2_SECRET_ACCESS_KEY
      // NOTE: Do NOT add 'host', 'endpoint', or 'permissions' - R2 doesn't support them!
    }
  ]

  console.log("[Qencode] Destination config:", {
    url: destination[0].url,
    keySet: !!destination[0].key,
    secretSet: !!destination[0].secret
  })

  // Build query for start_encode2 API
  // The query must be wrapped in a "query" object
  const query = {
    query: {
      source: inputUrl,
      callback_url: webhookUrl,
      format: [
        {
          output: "advanced_hls",
          destination,
          segment_duration: 4,
          stream: [
            {
              // 1080p - High quality
              size: "1080x1920",
              video_codec: "libx264",
              profile: "high",
              bitrate: 4500,
              audio_bitrate: 128,
              audio_sample_rate: 48000
            },
            {
              // 720p - Main quality
              size: "720x1280",
              video_codec: "libx264",
              profile: "main",
              bitrate: 2500,
              audio_bitrate: 128,
              audio_sample_rate: 44100
            },
            {
              // 480p - Low quality
              size: "480x854",
              video_codec: "libx264",
              profile: "main",
              bitrate: 1000,
              audio_bitrate: 96,
              audio_sample_rate: 44100
            }
          ]
        },
        {
          // Thumbnail generation - extract frame at 10% of video duration
          // Note: Qencode expects 'time' as a value from 0 to 1 (percentage of video length)
          output: "thumbnail",
          destination,
          time: 0.1,
          width: 720,
          height: 1280
        }
      ]
    }
  }

  console.log("[Qencode] Starting encode with query:", JSON.stringify({
    query: {
      ...query.query,
      source: query.query.source.substring(0, 50) + "...",
      format: query.query.format.map(f => ({
        ...f,
        destination: f.destination.map((d: { url?: string; key?: string }) => ({
          url: d.url,
          key: d.key,
          secret: "[REDACTED]"
        }))
      }))
    }
  }, null, 2))

  // Use start_encode2 for custom query (start_encode requires preset profiles)
  const response = await fetch(`${QENCODE_API_URL}/start_encode2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      task_token: taskToken,
      query: JSON.stringify(query)
    })
  })

  console.log("[Qencode] Start encode response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Qencode] ❌ Start encode failed:", response.statusText, errorText)
    throw new Error(`Failed to start Qencode job: ${response.statusText}`)
  }

  const data: QencodeStartTaskResponse = await response.json()
  console.log("[Qencode] Start encode response:", { error: data.error, message: data.message, statusUrl: data.status_url })

  if (data.error !== 0) {
    console.error("[Qencode] ❌ Start encode API error:", data)
    throw new Error(`Qencode API error: ${data.message || "Unknown error"}`)
  }

  console.log("[Qencode] ✅ Transcoding job started successfully")
  console.log("[Qencode] Task token:", taskToken)
  console.log("[Qencode] ========== TRANSCODING JOB INITIATED ==========")

  return {
    taskToken,
    statusUrl: data.status_url || `${QENCODE_API_URL}/status?task_tokens=${taskToken}`
  }
}

/**
 * Validate Qencode webhook payload
 *
 * NOTE: Qencode does NOT support HMAC signature verification.
 * They don't send X-Qencode-Signature headers.
 *
 * Security is ensured by:
 * 1. Validating task_token exists in our database
 * 2. Task tokens are unique UUIDs generated by Qencode
 *
 * @param payload - Parsed webhook payload
 * @returns True if payload has valid structure
 */
export function validateQencodePayload(payload: QencodeWebhookPayload): boolean {
  // Validate required fields
  if (!payload.task_token || typeof payload.task_token !== "string") {
    return false
  }

  if (!payload.status || !["completed", "error", "encoding", "pending"].includes(payload.status)) {
    return false
  }

  return true
}

/**
 * Qencode webhook payload types
 */
export interface QencodeWebhookPayload {
  task_token: string
  status: "completed" | "error" | "encoding" | "pending"
  percent?: number
  error_code?: number
  error_message?: string
  videos?: QencodeVideoOutput[]
}

export interface QencodeVideoOutput {
  url: string
  type: string
  duration?: number
  size?: number
  width?: number
  height?: number
  thumbnail?: string
}

/**
 * Parse Qencode webhook payload
 */
export function parseQencodeWebhookPayload(body: string): QencodeWebhookPayload {
  return JSON.parse(body) as QencodeWebhookPayload
}

/**
 * Qencode status API response
 */
interface QencodeStatusResponse {
  error: number
  message?: string
  statuses?: {
    [taskToken: string]: {
      status: "pending" | "downloading" | "queued" | "encoding" | "saving" | "completed" | "error"
      percent?: number
      error?: number
      error_description?: string
      videos?: QencodeVideoOutput[]
    }
  }
}

/**
 * Check the status of a Qencode transcoding job
 *
 * This is used as a fallback when webhooks don't work (e.g., localhost development)
 * or to manually check the status of a job.
 *
 * @param taskToken - The task token returned from startQencodeJob
 * @returns Job status including completion state and output videos
 */
export async function checkQencodeJobStatus(taskToken: string): Promise<{
  status: "pending" | "downloading" | "queued" | "encoding" | "saving" | "completed" | "error"
  percent?: number
  videos?: QencodeVideoOutput[]
  error_message?: string
}> {
  console.log("[Qencode] Checking job status for task:", taskToken)

  const response = await fetch(`${QENCODE_API_URL}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      task_tokens: taskToken
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Qencode] ❌ Status check failed:", response.statusText, errorText)
    throw new Error(`Failed to check Qencode status: ${response.statusText}`)
  }

  const data: QencodeStatusResponse = await response.json()
  console.log("[Qencode] Status response:", JSON.stringify(data, null, 2))

  if (data.error !== 0) {
    console.error("[Qencode] ❌ Status API error:", data)
    throw new Error(`Qencode API error: ${data.message || "Unknown error"}`)
  }

  if (!data.statuses || !data.statuses[taskToken]) {
    console.error("[Qencode] ❌ Task not found in status response")
    throw new Error("Task not found in Qencode status response")
  }

  const taskStatus = data.statuses[taskToken]
  console.log("[Qencode] Task status:", taskStatus.status, "Percent:", taskStatus.percent)

  return {
    status: taskStatus.status,
    percent: taskStatus.percent,
    videos: taskStatus.videos,
    error_message: taskStatus.error_description
  }
}
