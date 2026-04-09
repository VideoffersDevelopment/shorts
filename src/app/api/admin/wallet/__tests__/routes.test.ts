import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as grantPOST } from "../grant/route"
import { POST as freezePOST } from "../freeze/route"
import { POST as unfreezePOST } from "../unfreeze/route"
import { POST as refundPOST } from "../refund/route"
import { GET as walletGET } from "../[userId]/route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  addCredits,
  freezeBatch,
  unfreezeBatch,
  refundToExactBatch,
  getWalletBalance,
} from "@/lib/wallet/wallet-service"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    creditBatch: { findFirst: vi.fn() },
    creditTransaction: { findMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock("@/lib/wallet/wallet-service", () => ({
  addCredits: vi.fn(),
  freezeBatch: vi.fn(),
  unfreezeBatch: vi.fn(),
  refundToExactBatch: vi.fn(),
  getWalletBalance: vi.fn(),
}))

describe("GET /api/admin/wallet/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "USER" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/user-1")
    const params = Promise.resolve({ userId: "user-1" })

    const response = await walletGET(request, { params })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe("Forbidden")
  })

  it("returns 404 for unknown user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request("http://localhost/api/admin/wallet/user-1")
    const params = Promise.resolve({ userId: "user-1" })

    const response = await walletGET(request, { params })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe("User not found")
  })

  it("returns wallet balance and transactions for admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
    } as any)
    vi.mocked(getWalletBalance).mockResolvedValue({
      userId: "user-1",
      wallets: {
        PROMO: { available: 500, frozen: 0, total: 500 },
        MAIN: { available: 1000, frozen: 0, total: 1000 },
      },
      batches: [],
    } as any)
    vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        batchId: "batch-1",
        amount: -100,
        actionType: "PUBLISH",
        shortId: "short-1",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "tx-2",
        batchId: "batch-1",
        amount: 1000,
        actionType: "ADD",
        shortId: null,
        createdAt: new Date("2024-01-01"),
      },
    ] as any)

    const request = new Request("http://localhost/api/admin/wallet/user-1")
    const params = Promise.resolve({ userId: "user-1" })

    const response = await walletGET(request, { params })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.user).toEqual({ id: "user-1", email: "user@test.com" })
    expect(json.wallet).toEqual({
      userId: "user-1",
      wallets: {
        PROMO: { available: 500, frozen: 0, total: 500 },
        MAIN: { available: 1000, frozen: 0, total: 1000 },
      },
      batches: [],
    })
    expect(json.transactions).toHaveLength(2)
  })

  it("returns recent transactions sorted desc", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
    } as any)
    vi.mocked(getWalletBalance).mockResolvedValue({
      userId: "user-1",
      wallets: {
        PROMO: { available: 0, frozen: 0, total: 0 },
        MAIN: { available: 0, frozen: 0, total: 0 },
      },
      batches: [],
    } as any)
    vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([
      { id: "tx-3", createdAt: new Date("2024-01-03") },
      { id: "tx-2", createdAt: new Date("2024-01-02") },
      { id: "tx-1", createdAt: new Date("2024-01-01") },
    ] as any)

    const request = new Request("http://localhost/api/admin/wallet/user-1")
    const params = Promise.resolve({ userId: "user-1" })

    const response = await walletGET(request, { params })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.transactions[0].id).toBe("tx-3")
    expect(json.transactions[1].id).toBe("tx-2")
    expect(json.transactions[2].id).toBe("tx-1")
    expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: expect.any(Object),
    })
  })
})

describe("POST /api/admin/wallet/grant", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "USER" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1", wallet: "MAIN", amount: 1000, reason: "Test" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe("Forbidden")
  })

  it("returns 400 for missing fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain("Missing required fields")
  })

  it("returns 400 for invalid amount (negative)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "MAIN",
        amount: -100,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe("Amount must be positive")
  })

  it("returns 400 for invalid amount (zero)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "MAIN",
        amount: 0,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain("Missing required fields")
  })

  it("returns 400 for invalid wallet type", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "INVALID",
        amount: 1000,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe("Wallet must be PROMO or MAIN")
  })

  it("returns 404 for unknown user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "MAIN",
        amount: 1000,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe("User not found")
  })

  it("grants bonus credits successfully", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as any)
    vi.mocked(addCredits).mockResolvedValue("batch-1")
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "MAIN",
        amount: 1000,
        reason: "Test grant",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.batchId).toBe("batch-1")
    expect(addCredits).toHaveBeenCalledWith("user-1", "MAIN", "BONUS", 1000, {
      metadata: { action: "admin_grant", adminId: "admin-1", reason: "Test grant" },
    })
  })

  it("creates AuditLog entry for grant", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as any)
    vi.mocked(addCredits).mockResolvedValue("batch-1")
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new Request("http://localhost/api/admin/wallet/grant", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        wallet: "PROMO",
        amount: 500,
        reason: "Promotional credits",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await grantPOST(request)

    expect(response.status).toBe(200)
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: "admin-1",
        action: "WALLET_GRANT",
        targetType: "CreditBatch",
        targetId: "batch-1",
        metadata: {
          userId: "user-1",
          wallet: "PROMO",
          amount: 500,
          reason: "Promotional credits",
        },
      },
    })
  })
})

describe("POST /api/admin/wallet/freeze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "USER" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/freeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "batch-1", reason: "Chargeback" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await freezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe("Forbidden")
  })

  it("returns 400 for missing fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/freeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "batch-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await freezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain("Missing required fields")
  })

  it("freezes batch successfully", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(freezeBatch).mockResolvedValue(undefined)

    const request = new Request("http://localhost/api/admin/wallet/freeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "batch-1", reason: "Chargeback" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await freezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(freezeBatch).toHaveBeenCalledWith("batch-1", "admin-1", "Chargeback")
  })

  it("returns 404 for unknown batch", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(freezeBatch).mockRejectedValue(
      new Error("Record to update not found. Cause: Record to update not found.")
    )

    const request = new Request("http://localhost/api/admin/wallet/freeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "unknown-batch", reason: "Test" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await freezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe("Batch not found")
  })
})

describe("POST /api/admin/wallet/unfreeze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "USER" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/unfreeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "batch-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await unfreezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe("Forbidden")
  })

  it("unfreezes batch successfully", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(unfreezeBatch).mockResolvedValue(undefined)

    const request = new Request("http://localhost/api/admin/wallet/unfreeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "batch-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await unfreezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(unfreezeBatch).toHaveBeenCalledWith("batch-1", "admin-1")
  })

  it("returns 404 for unknown batch", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(unfreezeBatch).mockRejectedValue(
      new Error("Record to update not found. Cause: Record to update not found.")
    )

    const request = new Request("http://localhost/api/admin/wallet/unfreeze", {
      method: "POST",
      body: JSON.stringify({ batchId: "unknown-batch" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await unfreezePOST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe("Batch not found")
  })
})

describe("POST /api/admin/wallet/refund", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 403 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "USER" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/refund", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        batchId: "batch-1",
        amount: 500,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await refundPOST(request)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe("Forbidden")
  })

  it("returns 400 for missing fields", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)

    const request = new Request("http://localhost/api/admin/wallet/refund", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1", amount: 500 }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await refundPOST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain("Missing required fields")
  })

  it("returns 404 when batch not found for user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue(null)

    const request = new Request("http://localhost/api/admin/wallet/refund", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        batchId: "batch-1",
        amount: 500,
        reason: "Test",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await refundPOST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe("Batch not found for this user")
  })

  it("refunds to exact batch successfully", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue({ id: "batch-1" } as any)
    vi.mocked(refundToExactBatch).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new Request("http://localhost/api/admin/wallet/refund", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        batchId: "batch-1",
        amount: 500,
        reason: "Customer refund",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await refundPOST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(refundToExactBatch).toHaveBeenCalledWith("user-1", "batch-1", 500)
  })

  it("creates AuditLog entry for refund", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as any)
    vi.mocked(prisma.creditBatch.findFirst).mockResolvedValue({ id: "batch-1" } as any)
    vi.mocked(refundToExactBatch).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new Request("http://localhost/api/admin/wallet/refund", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        batchId: "batch-1",
        amount: 250,
        reason: "Partial refund",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await refundPOST(request)

    expect(response.status).toBe(200)
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: "admin-1",
        action: "WALLET_REFUND",
        targetType: "CreditBatch",
        targetId: "batch-1",
        metadata: {
          userId: "user-1",
          amount: 250,
          reason: "Partial refund",
        },
      },
    })
  })
})
