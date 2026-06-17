-- This is an manual migration.
-- already created orgs by user should have 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- for gen_random_uuid()::text there is no cuid extention at the moment, still it should not be a problem as we treat ids as nothing more than unique strings and all users should have orgIds, this is just a backup logic

INSERT INTO "UserOrganization" (id,"userId", "organizationId", roles,"updatedAt")
SELECT gen_random_uuid()::text,o."userId", o.id, ARRAY['OWNER']::"OrganizationRoles"[],NOW()
FROM "Organization" o
ON CONFLICT ("userId", "organizationId") DO NOTHING;
