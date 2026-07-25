-- Re-normalize knowledge text for diacritic-insensitive retrieval (unaccent + lower)
UPDATE knowledge_chunks
SET content_normalized = lower(unaccent(content))
WHERE content IS NOT NULL;

UPDATE knowledge_documents
SET title_normalized = lower(unaccent(title))
WHERE title IS NOT NULL;

UPDATE knowledge_chunks
SET content_tsv = to_tsvector('simple', coalesce(content_normalized, lower(unaccent(content))));
