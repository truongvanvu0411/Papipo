-- AlterTable
ALTER TABLE "UserProfile"
ADD COLUMN "activityPrefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "favoriteFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastCheckInDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN "slug" TEXT;

UPDATE "WorkoutExercise"
SET "slug" = LOWER(REPLACE("name", ' ', '-'))
WHERE "slug" IS NULL;

ALTER TABLE "WorkoutExercise"
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutPlan" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Deduplicate any legacy daily rows before enforcing uniqueness.
DELETE FROM "DailyCheckIn" AS target
USING (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userId", "date"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS row_number
    FROM "DailyCheckIn"
  ) ranked
  WHERE ranked.row_number > 1
) duplicates
WHERE target."id" = duplicates."id";

DELETE FROM "DailyMetric" AS target
USING (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userId", "date"
        ORDER BY "updatedAt" DESC, "id" DESC
      ) AS row_number
    FROM "DailyMetric"
  ) ranked
  WHERE ranked.row_number > 1
) duplicates
WHERE target."id" = duplicates."id";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_userId_date_key" ON "DailyCheckIn"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_userId_date_key" ON "DailyMetric"("userId", "date");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
