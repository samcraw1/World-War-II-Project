-- One featured entry per in-war day. `story` paragraphs are separated by blank lines.
CREATE TABLE IF NOT EXISTS timeline (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    story TEXT NOT NULL DEFAULT '',
    date  DATE NOT NULL UNIQUE
);

ALTER TABLE timeline ADD COLUMN IF NOT EXISTS story TEXT NOT NULL DEFAULT '';
