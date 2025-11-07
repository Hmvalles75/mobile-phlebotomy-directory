-- CreateTable
CREATE TABLE "provider_corrections_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT,
    "urlSlug" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" DATETIME,
    "handledBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "provider_corrections_queue_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
