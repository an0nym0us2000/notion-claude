-- Create Comment table for Phase 7
CREATE TABLE IF NOT EXISTS "comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" TEXT NOT NULL,
  "pageId" UUID NOT NULL,
  "blockId" UUID,
  "parentId" UUID REFERENCES "comments"("id") ON DELETE CASCADE,
  "authorId" UUID NOT NULL,
  "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedBy" UUID,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for Comment table
CREATE INDEX IF NOT EXISTS "comments_pageId_idx" ON "comments"("pageId");
CREATE INDEX IF NOT EXISTS "comments_blockId_idx" ON "comments"("blockId");
CREATE INDEX IF NOT EXISTS "comments_authorId_idx" ON "comments"("authorId");
CREATE INDEX IF NOT EXISTS "comments_parentId_idx" ON "comments"("parentId");
CREATE INDEX IF NOT EXISTS "comments_resolved_idx" ON "comments"("resolved");

-- Comments
COMMENT ON TABLE "comments" IS 'Comments and threaded discussions on pages and blocks';
COMMENT ON COLUMN "comments"."content" IS 'The comment text content';
COMMENT ON COLUMN "comments"."pageId" IS 'Page where the comment was made';
COMMENT ON COLUMN "comments"."blockId" IS 'Optional: specific block being commented on';
COMMENT ON COLUMN "comments"."parentId" IS 'Parent comment ID for threaded replies';
COMMENT ON COLUMN "comments"."authorId" IS 'User who wrote the comment';
COMMENT ON COLUMN "comments"."mentions" IS 'Array of user IDs mentioned in the comment (@mentions)';
COMMENT ON COLUMN "comments"."resolved" IS 'Whether the comment thread is resolved';
COMMENT ON COLUMN "comments"."resolvedBy" IS 'User ID who resolved the comment';
COMMENT ON COLUMN "comments"."resolvedAt" IS 'Timestamp when comment was resolved';
