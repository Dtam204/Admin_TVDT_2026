-- SQL Migration to flatten JSON-serialized locale fields to plain Vietnamese strings
-- Targets all modules: Authors, Books, Categories, Courses, Instructors, Members, Settings

-- 1. Authors
UPDATE authors 
SET 
  name = CASE WHEN jsonb_typeof(name) = 'object' THEN name->>'vi' ELSE name::text END,
  pseudonyms = CASE WHEN jsonb_typeof(pseudonyms) = 'object' THEN pseudonyms->>'vi' ELSE pseudonyms::text END,
  bio = CASE WHEN jsonb_typeof(bio) = 'object' THEN bio->>'vi' ELSE bio::text END,
  education = CASE WHEN jsonb_typeof(education) = 'object' THEN education->>'vi' ELSE education::text END,
  awards = CASE WHEN jsonb_typeof(awards) = 'object' THEN awards->>'vi' ELSE awards::text END,
  career_highlights = CASE WHEN jsonb_typeof(career_highlights) = 'object' THEN career_highlights->>'vi' ELSE career_highlights::text END;

-- 2. Book Categories
UPDATE book_categories 
SET 
  name = CASE WHEN jsonb_typeof(name) = 'object' THEN name->>'vi' ELSE name::text END,
  description = CASE WHEN jsonb_typeof(description) = 'object' THEN description->>'vi' ELSE description::text END;

-- 3. Books
UPDATE books 
SET 
  title = CASE WHEN jsonb_typeof(title) = 'object' THEN title->>'vi' ELSE title::text END,
  description = CASE WHEN jsonb_typeof(description) = 'object' THEN description->>'vi' ELSE description::text END,
  keywords = CASE WHEN jsonb_typeof(keywords) = 'object' THEN keywords->>'vi' ELSE keywords::text END;

-- 4. Course Categories
UPDATE course_categories 
SET 
  name = CASE WHEN jsonb_typeof(name) = 'object' THEN name->>'vi' ELSE name::text END,
  description = CASE WHEN jsonb_typeof(description) = 'object' THEN description->>'vi' ELSE description::text END;

-- 5. Instructors
UPDATE instructors 
SET 
  name = CASE WHEN jsonb_typeof(name) = 'object' THEN name->>'vi' ELSE name::text END,
  bio = CASE WHEN jsonb_typeof(bio) = 'object' THEN bio->>'vi' ELSE bio::text END,
  expertise = CASE WHEN jsonb_typeof(expertise) = 'object' THEN expertise->>'vi' ELSE expertise::text END;

-- 6. Courses
UPDATE courses 
SET 
  title = CASE WHEN jsonb_typeof(title) = 'object' THEN title->>'vi' ELSE title::text END,
  description = CASE WHEN jsonb_typeof(description) = 'object' THEN description->>'vi' ELSE description::text END,
  content = CASE WHEN jsonb_typeof(content) = 'object' THEN content->>'vi' ELSE content::text END;

-- 7. Membership Plans
UPDATE membership_plans 
SET 
  name = CASE WHEN jsonb_typeof(name) = 'object' THEN name->>'vi' ELSE name::text END,
  description = CASE WHEN jsonb_typeof(description) = 'object' THEN description->>'vi' ELSE description::text END,
  features = CASE WHEN jsonb_typeof(features) = 'object' THEN features->>'vi' ELSE features::text END;

-- 8. Site Settings (Handle TEXT columns that might contain JSON strings)
-- Only update if the value looks like a JSON object containing "vi"
UPDATE site_settings 
SET setting_value = (setting_value::jsonb->>'vi')
WHERE setting_value LIKE '{"vi":%';

-- 9. News (If any JSON strings were stored in TEXT columns)
UPDATE news
SET 
  title = (title::jsonb->>'vi') WHERE title LIKE '{"vi":%',
  summary = (summary::jsonb->>'vi') WHERE summary LIKE '{"vi":%',
  content = (content::jsonb->>'vi') WHERE content LIKE '{"vi":%';

-- Final Step: You may want to manually convert JSONB columns to TEXT/VARCHAR 
-- if you want to strictly prevent JSON storage in the future, but extracting the value
-- is enough to fix the UI rendering issues immediately.
