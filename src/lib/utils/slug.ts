import slugify from "slugify"

interface SlugModel {
  findUnique(args: { where: { slug: string } }): Promise<unknown>
}

export async function generateSlug(
  text: string,
  model: SlugModel,
  maxRetries = 10
): Promise<string> {
  let baseSlug = slugify(text, {
    lower: true,
    strict: true,
    locale: "pl"
  })

  let slug = baseSlug
  let attempt = 0

  while (attempt < maxRetries) {
    const existing = await model.findUnique({
      where: { slug }
    })

    if (!existing) {
      return slug
    }

    // Append number
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // Fallback: add timestamp
  return `${baseSlug}-${Date.now()}`
}
