/*
  # TheMealDB Cache Schema
  
  1. New Tables
    - `meal_cache`
      - `id` (uuid, primary key)
      - `cache_key` (text, unique) - unique identifier for cached data
      - `cache_type` (text) - type of cache (search, category, random, detail)
      - `data` (jsonb) - cached API response data
      - `created_at` (timestamptz) - when cache entry was created
      - `expires_at` (timestamptz) - when cache entry expires
    
    - `cache_stats`
      - `id` (uuid, primary key)
      - `endpoint` (text) - API endpoint called
      - `hit_count` (integer) - number of cache hits
      - `miss_count` (integer) - number of cache misses
      - `last_accessed` (timestamptz) - last access time
  
  2. Indexes
    - Index on `cache_key` for fast lookups
    - Index on `expires_at` for efficient cleanup
    - Index on `cache_type` for filtering
  
  3. Security
    - Enable RLS on both tables
    - Public read access (since this is a public API)
    - No direct write access from client
*/

CREATE TABLE IF NOT EXISTS meal_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  cache_type text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text UNIQUE NOT NULL,
  hit_count integer DEFAULT 0,
  miss_count integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_cache_key ON meal_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_meal_cache_expires ON meal_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_meal_cache_type ON meal_cache(cache_type);

ALTER TABLE meal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to meal cache"
  ON meal_cache FOR SELECT
  TO anon
  USING (expires_at > now());

CREATE POLICY "Allow public read access to cache stats"
  ON cache_stats FOR SELECT
  TO anon
  USING (true);