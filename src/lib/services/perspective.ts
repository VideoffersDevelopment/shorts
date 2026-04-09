/**
 * Perspective API client for comment toxicity analysis.
 *
 * Fail-open: if the API key is missing or the request fails,
 * comments pass through unflagged (dev-friendly default).
 */

interface ToxicityResult {
  score: number
  flagged: boolean
}

export async function checkToxicity(text: string): Promise<ToxicityResult> {
  const apiKey = process.env.PERSPECTIVE_API_KEY
  if (!apiKey) {
    return { score: 0, flagged: false }
  }

  try {
    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: { text },
          languages: ["pl"],
          requestedAttributes: { TOXICITY: {} },
        }),
      }
    )

    if (!response.ok) {
      console.warn(
        `Perspective API returned ${response.status}: ${response.statusText}`
      )
      return { score: 0, flagged: false }
    }

    const data = await response.json()
    const score: number =
      data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0

    return {
      score,
      flagged: score >= 0.7,
    }
  } catch (error) {
    console.warn("Perspective API error, passing through:", error)
    return { score: 0, flagged: false }
  }
}
