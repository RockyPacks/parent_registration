-- Add signature_image column to declarations table to store digital signatures
ALTER TABLE public.declarations
ADD COLUMN signature_image TEXT;

-- Update comments/documentation
COMMENT ON COLUMN public.declarations.signature_image IS 'Digital signature image as data URL (base64 encoded)';
