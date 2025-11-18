-- Add GIN indexes for full-text search on PostgreSQL

-- Create a text search vector for Page titles
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "title_tsv" tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

-- Create GIN index on Page title text search vector
CREATE INDEX IF NOT EXISTS "Page_title_tsv_idx" ON "Page" USING GIN (title_tsv);

-- Create index on Page title for case-insensitive search
CREATE INDEX IF NOT EXISTS "Page_title_lower_idx" ON "Page" (LOWER(title));

-- Note: Block content is JSON, so we create an expression index
-- This allows searching within JSON content text
CREATE INDEX IF NOT EXISTS "Block_content_text_idx" ON "Block" USING GIN (
  to_tsvector('english',
    COALESCE(
      (content::jsonb->'content')::text,
      ''
    )
  )
);

-- Create index on pageId for faster block lookups
CREATE INDEX IF NOT EXISTS "Block_pageId_idx" ON "Block" (page" WHERE "pageId" IS NOT NULL;

-- Create composite index for faster workspace page searches
CREATE INDEX IF NOT EXISTS "Page_workspaceId_updatedAt_idx" ON "Page" ("workspaceId", "updatedAt" DESC);

-- Create index on Page updatedAt for recent pages queries
CREATE INDEX IF NOT EXISTS "Page_updatedAt_idx" ON "Page" ("updatedAt" DESC);

-- Comments explaining the indexes
COMMENT ON INDEX "Page_title_tsv_idx" IS 'Full-text search index for page titles using PostgreSQL tsvector';
COMMENT ON INDEX "Page_title_lower_idx" IS 'Case-insensitive search index for page titles';
COMMENT ON INDEX "Block_content_text_idx" IS 'Full-text search index for block JSON content';
COMMENT ON INDEX "Page_workspaceId_updatedAt_idx" IS 'Composite index for workspace page listing and recent pages';
COMMENT ON INDEX "Page_updatedAt_idx" IS 'Index for recent pages queries';
