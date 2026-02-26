
-- Migration 1: Add enum value only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'global_admin';
