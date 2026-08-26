-- Better Auth >= 1.7 requires account.issuer. Added nullable first so existing
-- rows can be backfilled, then tightened to NOT NULL to match the schema.
--
-- Issuer format (see @better-auth/core db/schema/account):
--   email/password -> 'local:credential'
--   social login   -> 'local:oauth:<providerId>'
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint

UPDATE "account"
SET "issuer" = CASE
    WHEN "provider_id" = 'credential' THEN 'local:credential'
    ELSE 'local:oauth:' || "provider_id"
END
WHERE "issuer" IS NULL;--> statement-breakpoint

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX "unique_issuer_account_id" ON "account" USING btree ("issuer","account_id");
