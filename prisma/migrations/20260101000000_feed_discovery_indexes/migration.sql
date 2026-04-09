-- Enable extensions (run in Neon console first if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Published shorts index (partial index for feed queries)
CREATE INDEX IF NOT EXISTS idx_shorts_published
ON "Short"("publishedAt" DESC)
WHERE status = 'PUBLISHED';

-- Category filter on published shorts
CREATE INDEX IF NOT EXISTS idx_shorts_category_published
ON "Short"("categoryId")
WHERE status = 'PUBLISHED';

-- Geospatial index (composite for lat/lng queries)
CREATE INDEX IF NOT EXISTS idx_shorts_location
ON "Short"(latitude, longitude)
WHERE status = 'PUBLISHED' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search index (simple dictionary — polish config added separately if available)
CREATE INDEX IF NOT EXISTS idx_shorts_search
ON "Short" USING GIN(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Trigram index for fuzzy title matching
CREATE INDEX IF NOT EXISTS idx_shorts_title_trigram
ON "Short" USING GIST(title gist_trgm_ops);

-- Company name search for autocomplete
CREATE INDEX IF NOT EXISTS idx_company_name_trigram
ON "CompanyProfile" USING GIST("companyName" gist_trgm_ops);

-- Tags search index
CREATE INDEX IF NOT EXISTS idx_tags_search
ON "Tag" USING GIN(to_tsvector('simple', name));

-- ShortStats join optimization
CREATE INDEX IF NOT EXISTS idx_short_stats_shortid
ON "ShortStats"("shortId");

-- Tags by usage (for popular tags)
CREATE INDEX IF NOT EXISTS idx_tags_usage
ON "Tag"("usageCount" DESC);
