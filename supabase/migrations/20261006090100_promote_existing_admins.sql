-- Run after the enum migration has committed.
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';
