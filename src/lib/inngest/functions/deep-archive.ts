import { inngest } from "../client"
import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2"

/**
 * Inngest function: Deep Archive Expired Shorts
 *
 * Phase 2 of the video lifecycle.
 * Runs monthly (1st of month at 5 AM) to find all EXPIRED shorts
 * that have been expired for 12+ months, delete their R2 files,
 * and mark them as ARCHIVED.
 *
 * ARCHIVED shorts have no media files — they are permanently archived.
 *
 * Cron: 0 5 1 * * (1st of month at 5 AM)
 */
export const deepArchiveExpiredShorts = inngest.createFunction(
  {
    id: "deep-archive-expired-shorts",
    name: "Deep Archive Expired Shorts",
    retries: 2,
  },
  { cron: "0 5 1 * *" },
  async ({ step }) => {
    const now = new Date()
    const cutoffDate = new Date(now)
    cutoffDate.setMonth(cutoffDate.getMonth() - 12)

    // Step 1: Find EXPIRED shorts older than 12 months
    const staleShorts = await step.run("find-stale-expired", async () => {
      return prisma.short.findMany({
        where: {
          status: "EXPIRED",
          expiresAt: {
            lte: cutoffDate,
          },
        },
        select: {
          id: true,
          companyId: true,
          title: true,
          rawVideoKey: true,
          hlsPlaylistUrl: true,
          thumbnailUrl: true,
          expiresAt: true,
        },
      })
    })

    if (staleShorts.length === 0) {
      return {
        success: true,
        archivedCount: 0,
        message: "No stale expired shorts found",
      }
    }

    // Step 2: Delete R2 files for each short
    const cleanupResults = await step.run("cleanup-r2-files", async () => {
      const results: { shortId: string; filesDeleted: number; errors: string[] }[] = []

      for (const short of staleShorts) {
        const errors: string[] = []
        let filesDeleted = 0

        // Delete raw video
        if (short.rawVideoKey) {
          try {
            await deleteObject(short.rawVideoKey)
            filesDeleted++
          } catch (err) {
            errors.push(`raw: ${err instanceof Error ? err.message : String(err)}`)
          }
        }

        // Delete HLS directory (master.m3u8 + segments)
        // HLS files are at: shorts/{companyId}/{shortId}/
        const hlsPrefix = `shorts/${short.companyId}/${short.id}/`
        try {
          // Delete known HLS files
          await deleteObject(`${hlsPrefix}master.m3u8`)
          filesDeleted++
        } catch (err) {
          errors.push(`hls: ${err instanceof Error ? err.message : String(err)}`)
        }

        // Delete thumbnail
        if (short.thumbnailUrl) {
          const thumbKey = `shorts/${short.companyId}/${short.id}/thumbnail.jpg`
          try {
            await deleteObject(thumbKey)
            filesDeleted++
          } catch (err) {
            errors.push(`thumb: ${err instanceof Error ? err.message : String(err)}`)
          }
        }

        results.push({ shortId: short.id, filesDeleted, errors })
      }

      return results
    })

    // Step 3: Mark as ARCHIVED
    const archiveResult = await step.run("archive-shorts", async () => {
      const updated = await prisma.short.updateMany({
        where: {
          id: {
            in: staleShorts.map((s) => s.id),
          },
          status: "EXPIRED",
        },
        data: {
          status: "ARCHIVED",
          archivedAt: now,
          hlsPlaylistUrl: null,
          thumbnailUrl: null,
          rawVideoKey: null,
        },
      })

      return { count: updated.count }
    })

    // Step 4: Log results
    await step.run("log-results", async () => {
      console.log(`[deep-archive] Archived ${archiveResult.count} shorts`)
      cleanupResults.forEach((r) => {
        const status = r.errors.length > 0 ? `⚠ ${r.errors.length} errors` : "✓"
        console.log(`  - ${r.shortId}: ${r.filesDeleted} files deleted ${status}`)
      })
    })

    return {
      success: true,
      archivedCount: archiveResult.count,
      archivedIds: staleShorts.map((s) => s.id),
      cleanupResults,
    }
  }
)
