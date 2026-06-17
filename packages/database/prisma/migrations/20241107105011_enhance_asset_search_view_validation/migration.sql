CREATE OR REPLACE VIEW shelf."AssetSearchView" 
WITH (security_barrier = false, security_invoker = true)  -- Explicitly set security
AS
WITH asset_base AS (
  SELECT 
    a.id,
    a."createdAt",
    a.id as "assetId",
    a.title,
    a.description,
    a."categoryId",
    a."locationId",
    a."organizationId"
  FROM shelf."Asset" a
  WHERE a.id IS NOT NULL
)
SELECT
  ab.id,
  ab."createdAt",
  ab."assetId",
  (
    COALESCE(ab.title, '')
    || ' ' || COALESCE(c.name, '')
    || ' ' || COALESCE(ab.description, '')
    || ' ' || COALESCE(string_agg(tm.name, ' '), '')
    || ' ' || COALESCE(string_agg(t.name, ' '), '')
    || ' ' || COALESCE(l.name, '')
  ) as "searchVector"
FROM
  asset_base ab
  LEFT JOIN shelf."Category" c ON ab."categoryId" = c.id
  LEFT JOIN shelf."Location" l ON ab."locationId" = l.id
  LEFT JOIN shelf."_AssetToTag" atr ON ab.id = atr."A"
  LEFT JOIN shelf."Tag" t ON atr."B" = t.id
  LEFT JOIN shelf."Custody" custd ON ab.id = custd."assetId"
  LEFT JOIN shelf."TeamMember" tm ON custd."teamMemberId" = tm.id
GROUP BY
  ab.id,
  ab."createdAt",
  ab."assetId",
  ab.title,
  ab.description,
  c.id,
  c.name,
  l.id,
  l.name;
