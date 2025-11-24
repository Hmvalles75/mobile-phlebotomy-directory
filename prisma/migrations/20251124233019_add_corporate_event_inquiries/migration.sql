-- CreateTable
CREATE TABLE "corporate_event_inquiries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "eventVenue" TEXT,
    "eventDates" TEXT NOT NULL,
    "estimatedDraws" TEXT NOT NULL,
    "estimatedPhlebotomists" TEXT,
    "eventType" TEXT NOT NULL,
    "additionalDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "ipAddress" TEXT,
    "userAgent" TEXT
);
