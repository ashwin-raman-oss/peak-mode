-- Migration 003: Add next_week_commitments column to weekly_reports
-- Run in Supabase SQL editor

ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS next_week_commitments JSONB NOT NULL DEFAULT '[]'::jsonb;
