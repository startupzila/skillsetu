-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 004_seed_extra_blocks.sql
-- Adds more varied content blocks to the "What is Excel?" lesson
-- to showcase the content-block renderer (code, table, quote, example, related_content).
-- Run AFTER 001_seed.sql.
-- ═══════════════════════════════════════════════════════════

-- Append blocks 8-13 to the EN translation of "What is Excel?" lesson
-- (lesson_translation_id = 1d000000-0000-0000-0000-000000000001)
INSERT INTO lesson_blocks (lesson_translation_id, block_type, sort_order, data) VALUES
  -- Example block
  ('1d000000-0000-0000-0000-000000000001', 'example', 8,
   '{"title":"Example: A simple budget","text":"Open Excel and type \"Rent\" in cell A1, then 5000 in B1. Type \"Groceries\" in A2 and 2000 in B2. Now in B3 type =SUM(B1:B2) and press Enter — Excel adds them up automatically!"}'::jsonb),
  -- Code block
  ('1d000000-0000-0000-0000-000000000001', 'code', 9,
   '{"language":"excel","code":"=SUM(B1:B2)\n=AVERAGE(B1:B10)\n=COUNT(A1:A100)\n=MAX(B1:B5)"}'::jsonb),
  -- Table block
  ('1d000000-0000-0000-0000-000000000001', 'table', 10,
   '{"headers":["Task","Excel Feature","Use"],"rows":[["Add numbers","SUM formula","=SUM(B1:B5)"],["Average","AVERAGE formula","=AVERAGE(B1:B5)"],["Count items","COUNT formula","=COUNT(A1:A10)"],["Find highest","MAX formula","=MAX(B1:B5)"]]}'::jsonb),
  -- Quote block
  ('1d000000-0000-0000-0000-000000000001', 'quote', 11,
   '{"text":"Excel is to data what a calculator is to numbers — essential, ubiquitous and quietly powerful.","author":"SkillSetu"}'::jsonb),
  -- Related content block
  ('1d000000-0000-0000-0000-000000000001', 'related_content', 12,
   '{"title":"Related lessons","items":[{"title":"Entering and Formatting Data","url":"/courses/excel-fundamentals/working-with-cells/entering-and-formatting-data"},{"title":"Excel Basics Quiz","url":"/courses/excel-fundamentals/getting-started/what-is-excel"}]}'::jsonb)
ON CONFLICT DO NOTHING;
