-- Fix: associate admin_abola with tenant "A Bola TV"
UPDATE public.profiles
SET tenant_id = '44d2badf-4767-4ad3-9754-9061bfab4b07'
WHERE id = '695ba150-8b04-476c-a882-69811f4c6e94' AND tenant_id IS NULL;
