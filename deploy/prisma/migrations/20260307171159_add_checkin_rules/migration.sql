-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "checkDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "note" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CheckIn_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FitnessChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CheckIn" ("channelId", "checkDate", "createdAt", "id", "imageUrl", "note", "userId") SELECT "channelId", "checkDate", "createdAt", "id", "imageUrl", "note", "userId" FROM "CheckIn";
DROP TABLE "CheckIn";
ALTER TABLE "new_CheckIn" RENAME TO "CheckIn";
CREATE UNIQUE INDEX "CheckIn_channelId_userId_checkDate_key" ON "CheckIn"("channelId", "userId", "checkDate");
CREATE TABLE "new_FitnessChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "weeklyCheckInCount" INTEGER NOT NULL DEFAULT 3,
    "checkInMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "FitnessChannel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FitnessChannel" ("createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt" FROM "FitnessChannel";
DROP TABLE "FitnessChannel";
ALTER TABLE "new_FitnessChannel" RENAME TO "FitnessChannel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
