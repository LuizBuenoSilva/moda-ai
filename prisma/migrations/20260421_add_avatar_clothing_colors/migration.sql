-- Add clothing color fields to AvatarProfile
ALTER TABLE "AvatarProfile" ADD COLUMN IF NOT EXISTS "shirtColor" TEXT;
ALTER TABLE "AvatarProfile" ADD COLUMN IF NOT EXISTS "pantsColor" TEXT;
ALTER TABLE "AvatarProfile" ADD COLUMN IF NOT EXISTS "shoeColor"  TEXT;
