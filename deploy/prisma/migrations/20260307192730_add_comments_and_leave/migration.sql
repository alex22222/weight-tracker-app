-- CreateTable
CREATE TABLE "ChannelComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ChannelComment_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FitnessChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChannelComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "LeaveRequest_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FitnessChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FitnessChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "weeklyCheckInCount" INTEGER NOT NULL DEFAULT 3,
    "checkInMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxLeaveDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "FitnessChannel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FitnessChannel" ("checkInMinutes", "createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt", "weeklyCheckInCount") SELECT "checkInMinutes", "createdAt", "description", "endDate", "id", "name", "ownerId", "startDate", "status", "updatedAt", "weeklyCheckInCount" FROM "FitnessChannel";
DROP TABLE "FitnessChannel";
ALTER TABLE "new_FitnessChannel" RENAME TO "FitnessChannel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
