-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "phonePublic" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bookingUrl" TEXT,
    "description" TEXT,
    "rating" REAL,
    "reviewsCount" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredTier" TEXT,
    "stripeCustomerId" TEXT,
    "leadCredit" INTEGER NOT NULL DEFAULT 0,
    "claimEmail" TEXT,
    "claimToken" TEXT,
    "claimVerifiedAt" DATETIME,
    "twilioNumber" TEXT,
    "zipCodes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address1" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "notes" TEXT,
    "source" TEXT NOT NULL,
    "gclid" TEXT,
    "routedToId" TEXT,
    "routedAt" DATETIME,
    "priceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    CONSTRAINT "leads_routedToId_fkey" FOREIGN KEY ("routedToId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "durationSec" INTEGER,
    "callStatus" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "providerId" TEXT,
    "recordingUrl" TEXT,
    "leadId" TEXT,
    "callSid" TEXT,
    CONSTRAINT "call_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "city_numbers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "twilioNumber" TEXT NOT NULL,
    "providerId" TEXT
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "provider_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abbr" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_coverage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT,
    CONSTRAINT "provider_coverage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_coverage_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "provider_coverage_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    CONSTRAINT "provider_addresses_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_coords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    CONSTRAINT "provider_coords_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "provider_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_availability_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "availability" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "provider_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    CONSTRAINT "provider_payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "provider_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    CONSTRAINT "provider_badges_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_corrections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterEmail" TEXT,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    CONSTRAINT "provider_corrections_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_callSid_key" ON "call_logs"("callSid");

-- CreateIndex
CREATE UNIQUE INDEX "city_numbers_twilioNumber_key" ON "city_numbers"("twilioNumber");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_services_providerId_serviceId_key" ON "provider_services"("providerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_abbr_key" ON "states"("abbr");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_stateId_key" ON "cities"("name", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_coverage_providerId_stateId_cityId_key" ON "provider_coverage"("providerId", "stateId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_addresses_providerId_key" ON "provider_addresses"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_coords_providerId_key" ON "provider_coords"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_name_key" ON "availability"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_availability_providerId_availabilityId_key" ON "provider_availability"("providerId", "availabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_name_key" ON "payments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payments_providerId_paymentId_key" ON "provider_payments"("providerId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_badges_providerId_badgeId_key" ON "provider_badges"("providerId", "badgeId");
