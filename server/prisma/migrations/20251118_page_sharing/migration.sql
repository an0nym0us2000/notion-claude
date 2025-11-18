-- Add permissions to WorkspaceMember
ALTER TABLE "workspace_members" ADD COLUMN IF NOT EXISTS "permissions" JSONB;

-- Add shares relation to Page (handled by Prisma)

-- Create PageShare table
CREATE TABLE IF NOT EXISTS "page_shares" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pageId" UUID NOT NULL REFERENCES "pages"("id") ON DELETE CASCADE,
  "token" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255),
  "expiresAt" TIMESTAMP,
  "allowEdit" BOOLEAN NOT NULL DEFAULT false,
  "allowComment" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" UUID NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for PageShare
CREATE INDEX IF NOT EXISTS "page_shares_pageId_idx" ON "page_shares"("pageId");
CREATE INDEX IF NOT EXISTS "page_shares_token_idx" ON "page_shares"("token");
CREATE INDEX IF NOT EXISTS "page_shares_expiresAt_idx" ON "page_shares"("expiresAt");

-- Comments
COMMENT ON TABLE "page_shares" IS 'Public sharing links for pages with optional password and expiration';
COMMENT ON COLUMN "page_shares"."token" IS 'Unique token used in public sharing URL';
COMMENT ON COLUMN "page_shares"."password" IS 'Optional password required to access shared page';
COMMENT ON COLUMN "page_shares"."expiresAt" IS 'Optional expiration date for share link';
COMMENT ON COLUMN "page_shares"."allowEdit" IS 'Whether public viewers can edit the page';
COMMENT ON COLUMN "page_shares"."allowComment" IS 'Whether public viewers can add comments';
COMMENT ON COLUMN "workspace_members"."permissions" IS 'JSON object with permission flags: canEdit, canComment, canShare, canInvite, canCreatePage, canDeletePage';
