-- ==========================================================
-- SQL MIGRATION: COMPLETE FLATTEN JSONB TO TEXT (VIETNAMESE ONLY)
-- DATE: 2026-04-04
-- ==========================================================

-- 0. Helper Function
CREATE OR REPLACE FUNCTION get_clean_value_sql(val ANYELEMENT) RETURNS TEXT AS $$
DECLARE
    json_val JSONB;
BEGIN
    IF val IS NULL THEN RETURN ''; END IF;
    
    -- Check if it's already text-like
    IF pg_typeof(val) IN ('text'::regtype, 'varchar'::regtype, 'character varying'::regtype) THEN
        RETURN val::TEXT;
    END IF;

    -- Try to cast to jsonb
    BEGIN
        json_val := val::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN val::TEXT;
    END;

    IF json_val IS NULL THEN RETURN ''; END IF;
    
    -- If it's a JSON object with 'vi' key
    IF jsonb_typeof(json_val) = 'object' AND json_val ? 'vi' THEN
        RETURN (json_val->>'vi')::TEXT;
    ELSIF jsonb_typeof(json_val) = 'object' THEN
        -- Return first value if no 'vi'
        RETURN (SELECT value FROM jsonb_each_text(json_val) LIMIT 1);
    ELSE
        -- If it's just a JSON string or other type
        RETURN json_val::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

BEGIN;

-- 0.5 Drop GIN indexes that depend on JSONB columns (they will be incompatible with TEXT)
DROP INDEX IF EXISTS idx_books_title_gin;
DROP INDEX IF EXISTS idx_courses_title_gin;

-- 1. AUTHORS
ALTER TABLE authors 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN pseudonyms TYPE TEXT USING (get_clean_value_sql(pseudonyms)),
  ALTER COLUMN bio TYPE TEXT USING (get_clean_value_sql(bio)),
  ALTER COLUMN education TYPE TEXT USING (get_clean_value_sql(education)),
  ALTER COLUMN awards TYPE TEXT USING (get_clean_value_sql(awards)),
  ALTER COLUMN career_highlights TYPE TEXT USING (get_clean_value_sql(career_highlights));

-- 2. BOOK_CATEGORIES
ALTER TABLE book_categories 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description));

-- 3. BOOKS
ALTER TABLE books 
  ALTER COLUMN title TYPE TEXT USING (get_clean_value_sql(title)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description)),
  ALTER COLUMN keywords TYPE TEXT USING (get_clean_value_sql(keywords)),
  ALTER COLUMN toc TYPE TEXT USING (get_clean_value_sql(toc));

-- 4. COURSE_CATEGORIES
ALTER TABLE course_categories 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description));

-- 5. INSTRUCTORS
ALTER TABLE instructors 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN bio TYPE TEXT USING (get_clean_value_sql(bio)),
  ALTER COLUMN expertise TYPE TEXT USING (get_clean_value_sql(expertise));

-- 6. COURSES
ALTER TABLE courses 
  ALTER COLUMN title TYPE TEXT USING (get_clean_value_sql(title)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description)),
  ALTER COLUMN content TYPE TEXT USING (get_clean_value_sql(content)),
  ALTER COLUMN requirements TYPE TEXT USING (get_clean_value_sql(requirements)),
  ALTER COLUMN what_you_learn TYPE TEXT USING (get_clean_value_sql(what_you_learn)),
  ALTER COLUMN target_audience TYPE TEXT USING (get_clean_value_sql(target_audience));

-- 7. MEMBERSHIP_PLANS
ALTER TABLE membership_plans 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description));

-- 8. NEWS
ALTER TABLE news 
  ALTER COLUMN title TYPE TEXT USING (get_clean_value_sql(title)),
  ALTER COLUMN content TYPE TEXT USING (get_clean_value_sql(content)),
  ALTER COLUMN summary TYPE TEXT USING (get_clean_value_sql(summary));

-- 9. NEWS_CATEGORIES
ALTER TABLE news_categories 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description));

-- 10. MENUS & MENU_ITEMS
ALTER TABLE menus 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name));

ALTER TABLE menu_items 
  ALTER COLUMN label TYPE TEXT USING (get_clean_value_sql(label));

-- 11. PUBLISHERS
ALTER TABLE publishers 
  ALTER COLUMN name TYPE TEXT USING (get_clean_value_sql(name)),
  ALTER COLUMN description TYPE TEXT USING (get_clean_value_sql(description));

COMMIT;
