-- create view for searching assets

CREATE OR REPLACE VIEW "AssetSearchView" AS
SELECT
    a.id,
    a."createdAt",
    a.id as "assetId",
    COALESCE(a.title, '') 
    || ' ' || COALESCE(c.name, '') 
    || ' ' || COALESCE(a.description, '') 
    || ' ' || COALESCE(string_agg(tm.name, ' '), '') 
    || ' ' || COALESCE(string_agg(t.name, ' '), '') 
    || ' ' || COALESCE(l.name, '') as "searchVector"
FROM
    shelf."Asset" a
LEFT JOIN
    shelf."Category" c ON a."categoryId" = c.id
LEFT JOIN
    shelf."Location" l ON a."locationId" = l.id
LEFT JOIN
    shelf."_AssetToTag" atr ON a.id = atr."A"
LEFT JOIN
    shelf."Tag" t ON atr."B" = t.id
LEFT JOIN
    shelf."Custody" custd ON a.id = custd."assetId"
LEFT JOIN
    shelf."TeamMember" tm ON custd."teamMemberId" = tm.id
GROUP BY
    a.id, c.id, l.id;
