ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_stars INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_stars INTEGER DEFAULT 0;

UPDATE profiles SET bonus_stars = tokens WHERE tokens > 5 AND bonus_stars = 0;
UPDATE profiles SET sub_stars = 5, tokens = 5 + bonus_stars WHERE id IS NOT NULL;

CREATE OR REPLACE FUNCTION deduct_stars(user_id uuid, amount int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub_stars int;
  v_bonus_stars int;
BEGIN
  IF auth.uid() != user_id THEN
    RETURN false;
  END IF;

  v_sub_stars := (SELECT sub_stars FROM profiles WHERE id = user_id LIMIT 1);
  v_bonus_stars := (SELECT bonus_stars FROM profiles WHERE id = user_id LIMIT 1);

  IF (COALESCE(v_sub_stars, 0) + COALESCE(v_bonus_stars, 0)) < amount THEN
    RETURN false;
  END IF;

  IF COALESCE(v_sub_stars, 0) >= amount THEN
    UPDATE profiles 
    SET sub_stars = sub_stars - amount, 
        tokens = (sub_stars - amount) + bonus_stars 
    WHERE id = user_id;
  ELSE
    UPDATE profiles 
    SET sub_stars = 0, 
        bonus_stars = bonus_stars - (amount - COALESCE(v_sub_stars, 0)), 
        tokens = bonus_stars - (amount - COALESCE(v_sub_stars, 0))
    WHERE id = user_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION add_bonus_stars(user_id uuid, amount int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() != user_id THEN
    RETURN false;
  END IF;

  UPDATE profiles 
  SET bonus_stars = COALESCE(bonus_stars, 0) + amount, 
      tokens = COALESCE(tokens, 0) + amount 
  WHERE id = user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_stars(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION add_bonus_stars(uuid, int) TO authenticated;
