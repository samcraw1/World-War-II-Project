-- Optional image for a day's entry, stored as a URL. Set by hand; the story generator leaves it NULL.
ALTER TABLE timeline ADD COLUMN IF NOT EXISTS pic TEXT;
