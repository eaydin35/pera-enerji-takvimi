---
description: Create and apply Supabase database migrations
---

# Database Migration Workflow

## 1. Understand the Change
Before creating a migration, clearly define:
- What tables/columns are being added, modified, or removed
- What RLS policies need to be created or updated
- Any seed data needed
- Impact on existing data

## 2. Generate Migration File
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && mkdir -p supabase/migrations
```

Create a new migration file with timestamp:
```bash
cd /Users/emrullahaydin/Desktop/PET && touch "supabase/migrations/$(date +%Y%m%d%H%M%S)_<description>.sql"
```

## 3. Write Migration SQL
Write the migration SQL following these rules:
- Always use `IF NOT EXISTS` for CREATE statements
- Always include `-- Description:` comment at the top
- Include both UP and rollback instructions (rollback in comments)
- Add RLS policies for any new tables
- Grant appropriate permissions

Example structure:
```sql
-- Description: Add user_preferences table
-- Rollback: DROP TABLE IF EXISTS user_preferences;

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
```

## 4. Apply Migration
Apply via Supabase CLI if available, or execute directly in Supabase Dashboard SQL Editor.

## 5. Verify
- Check that the table/columns exist
- Verify RLS policies are working
- Test with a sample query
- Update any TypeScript types if needed

## 6. Document
Update relevant documentation or type files to reflect the schema change.
