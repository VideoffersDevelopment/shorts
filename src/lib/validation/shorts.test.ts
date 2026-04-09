import { describe, it, expect } from "vitest"
import {
  createShortSchema,
  updateShortSchema,
  shortIdSchema,
  type CreateShortInput,
  type UpdateShortInput,
  type ShortIdInput
} from "./shorts"

describe("shorts validation schemas", () => {
  // ===========================================================================
  // createShortSchema - VALID DATA
  // ===========================================================================

  describe("createShortSchema", () => {
    describe("valid data", () => {
      it("accepts complete valid data", () => {
        const validData: CreateShortInput = {
          rawVideoKey: "uploads/abc123/video.mp4",
          title: "My awesome short",
          description: "This is a great video about cats",
          categoryId: "clrwxyz1234567890abcde",
          tags: ["cats", "funny", "pets"],
          latitude: 52.2297,
          longitude: 21.0122,
          address: "Warsaw, Poland",
          ctaLink: "https://example.com/product",
          thumbnailUrl: "https://cdn.example.com/thumb.jpg",
          customThumbnail: true,
          duration: 30,
          aspectRatio: "9:16"
        }

        const result = createShortSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it("accepts minimal required data", () => {
        const minimalData = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(minimalData)

        expect(result.success).toBe(true)
      })

      it("accepts empty string for ctaLink", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          ctaLink: ""
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // createShortSchema - REQUIRED FIELDS
    // ===========================================================================

    describe("required fields", () => {
      it("rejects missing rawVideoKey", () => {
        const data = {
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          const issues = result.error.issues
          expect(issues.some((i) => i.path.includes("rawVideoKey"))).toBe(true)
        }
      })

      it("rejects empty rawVideoKey", () => {
        const data = {
          rawVideoKey: "",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Video key is required")
        }
      })

      it("rejects missing title", () => {
        const data = {
          rawVideoKey: "key123",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          const issues = result.error.issues
          expect(issues.some((i) => i.path.includes("title"))).toBe(true)
        }
      })

      it("rejects empty title", () => {
        const data = {
          rawVideoKey: "key123",
          title: "",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title is required")
        }
      })

      it("rejects missing categoryId", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          const issues = result.error.issues
          expect(issues.some((i) => i.path.includes("categoryId"))).toBe(true)
        }
      })
    })

    // ===========================================================================
    // createShortSchema - FIELD VALIDATION
    // ===========================================================================

    describe("field validation", () => {
      it("rejects title longer than 100 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "a".repeat(101),
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title too long")
        }
      })

      it("accepts title exactly 100 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "a".repeat(100),
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("rejects description longer than 500 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          description: "a".repeat(501)
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Description too long")
        }
      })

      it("rejects invalid categoryId (not cuid)", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "not-a-cuid"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid category")
        }
      })

      it("rejects invalid ctaLink (not URL)", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          ctaLink: "not-a-url"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid URL")
        }
      })

      it("rejects invalid thumbnailUrl (not URL)", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          thumbnailUrl: "invalid"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid thumbnail URL")
        }
      })
    })

    // ===========================================================================
    // createShortSchema - LATITUDE/LONGITUDE VALIDATION
    // ===========================================================================

    describe("latitude/longitude validation", () => {
      it("rejects latitude below -90", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          latitude: -91
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects latitude above 90", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          latitude: 91
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("accepts latitude at boundary -90", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          latitude: -90
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("accepts latitude at boundary 90", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          latitude: 90
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("rejects longitude below -180", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          longitude: -181
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects longitude above 180", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          longitude: 181
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("accepts longitude at boundary -180", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          longitude: -180
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("accepts longitude at boundary 180", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          longitude: 180
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // createShortSchema - TAGS VALIDATION
    // ===========================================================================

    describe("tags validation", () => {
      it("accepts empty tags array", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          tags: []
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("accepts up to 10 tags", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          tags: Array(10).fill("tag")
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("rejects more than 10 tags", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          tags: Array(11).fill("tag")
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Too many tags")
        }
      })

      it("rejects tag longer than 50 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          tags: ["a".repeat(51)]
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Tag too long")
        }
      })

      it("accepts tag exactly 50 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          tags: ["a".repeat(50)]
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // createShortSchema - DURATION VALIDATION
    // ===========================================================================

    describe("duration validation", () => {
      it("rejects duration over 60 seconds", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          duration: 61
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Duration exceeds 60 seconds"
          )
        }
      })

      it("accepts duration exactly 60 seconds", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          duration: 60
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("rejects negative duration", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          duration: -1
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects zero duration", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          duration: 0
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects non-integer duration", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          duration: 30.5
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })

    // ===========================================================================
    // createShortSchema - ADDRESS VALIDATION
    // ===========================================================================

    describe("address validation", () => {
      it("rejects address longer than 500 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          address: "a".repeat(501)
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Address too long")
        }
      })

      it("accepts address exactly 500 characters", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde",
          address: "a".repeat(500)
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // createShortSchema - OPTIONAL FIELDS
    // ===========================================================================

    describe("optional fields", () => {
      it("accepts missing description", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.description).toBeUndefined()
        }
      })

      it("accepts missing tags", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.tags).toBeUndefined()
        }
      })

      it("accepts missing geolocation fields", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.latitude).toBeUndefined()
          expect(result.data.longitude).toBeUndefined()
          expect(result.data.address).toBeUndefined()
        }
      })

      it("accepts missing customThumbnail", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.customThumbnail).toBeUndefined()
        }
      })

      it("accepts missing aspectRatio", () => {
        const data = {
          rawVideoKey: "key123",
          title: "Test",
          categoryId: "clrwxyz1234567890abcde"
        }

        const result = createShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.aspectRatio).toBeUndefined()
        }
      })
    })
  })

  // ===========================================================================
  // updateShortSchema
  // ===========================================================================

  describe("updateShortSchema", () => {
    describe("valid data", () => {
      it("accepts complete update data", () => {
        const validData: UpdateShortInput = {
          title: "Updated title",
          description: "Updated description",
          tags: ["new", "tags"],
          ctaLink: "https://example.com/updated"
        }

        const result = updateShortSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it("accepts partial update with only title", () => {
        const data = {
          title: "New title"
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("accepts empty object (no updates)", () => {
        const data = {}

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(true)
      })

      it("accepts null for ctaLink (to clear)", () => {
        const data = {
          ctaLink: null
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.ctaLink).toBeNull()
        }
      })
    })

    describe("field validation", () => {
      it("rejects title longer than 100 characters", () => {
        const data = {
          title: "a".repeat(101)
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title too long")
        }
      })

      it("rejects empty title", () => {
        const data = {
          title: ""
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Title is required")
        }
      })

      it("rejects description longer than 500 characters", () => {
        const data = {
          description: "a".repeat(501)
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Description too long")
        }
      })

      it("rejects invalid ctaLink URL", () => {
        const data = {
          ctaLink: "not-valid"
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid URL")
        }
      })

      it("rejects more than 10 tags", () => {
        const data = {
          tags: Array(11).fill("tag")
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects tag longer than 50 characters", () => {
        const data = {
          tags: ["a".repeat(51)]
        }

        const result = updateShortSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })
  })

  // ===========================================================================
  // shortIdSchema
  // ===========================================================================

  describe("shortIdSchema", () => {
    describe("valid data", () => {
      it("accepts valid cuid", () => {
        const data: ShortIdInput = {
          shortId: "clrwxyz1234567890abcde"
        }

        const result = shortIdSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.shortId).toBe("clrwxyz1234567890abcde")
        }
      })
    })

    describe("invalid data", () => {
      it("rejects missing shortId", () => {
        const data = {}

        const result = shortIdSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects invalid shortId format", () => {
        const data = {
          shortId: "not-a-cuid"
        }

        const result = shortIdSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid short ID")
        }
      })

      it("rejects empty shortId", () => {
        const data = {
          shortId: ""
        }

        const result = shortIdSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })
  })

  // ===========================================================================
  // TYPE INFERENCE
  // ===========================================================================

  describe("type inference", () => {
    it("CreateShortInput type is correctly inferred", () => {
      const input: CreateShortInput = {
        rawVideoKey: "key",
        title: "title",
        categoryId: "clrwxyz1234567890abcde"
      }

      // TypeScript compile-time check
      expect(input.rawVideoKey).toBe("key")
      expect(input.title).toBe("title")
      expect(input.categoryId).toBe("clrwxyz1234567890abcde")
    })

    it("UpdateShortInput type allows all optional fields", () => {
      const input: UpdateShortInput = {}

      // TypeScript compile-time check - empty object is valid
      expect(input.title).toBeUndefined()
    })

    it("ShortIdInput type requires shortId", () => {
      const input: ShortIdInput = {
        shortId: "clrwxyz1234567890abcde"
      }

      expect(input.shortId).toBe("clrwxyz1234567890abcde")
    })
  })
})
