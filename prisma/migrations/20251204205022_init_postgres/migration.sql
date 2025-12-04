-- CreateEnum
CREATE TYPE "public"."ProviderStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "public"."FeaturedTier" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'DELIVERED', 'REFUNDED', 'UNSOLD');

-- CreateEnum
CREATE TYPE "public"."Urgency" AS ENUM ('STANDARD', 'STAT');

-- CreateEnum
CREATE TYPE "public"."CorrectionStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."CorrectionQueueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."CorporateInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'COMPLETED', 'DECLINED');

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "phonePublic" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bookingUrl" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ProviderStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredTier" "public"."FeaturedTier",
    "stripeCustomerId" TEXT,
    "leadCredit" INTEGER NOT NULL DEFAULT 0,
    "claimEmail" TEXT,
    "claimToken" TEXT,
    "claimVerifiedAt" TIMESTAMP(3),
    "twilioNumber" TEXT,
    "zipCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address1" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "urgency" "public"."Urgency" NOT NULL,
    "notes" TEXT,
    "source" TEXT NOT NULL,
    "gclid" TEXT,
    "routedToId" TEXT,
    "routedAt" TIMESTAMP(3),
    "priceCents" INTEGER NOT NULL,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."call_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."city_numbers" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "twilioNumber" TEXT NOT NULL,
    "providerId" TEXT,

    CONSTRAINT "city_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_services" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbr" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_coverage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT,

    CONSTRAINT "provider_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_addresses" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,

    CONSTRAINT "provider_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_coords" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "provider_coords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."availability" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_availability" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_payments" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,

    CONSTRAINT "provider_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_badges" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,

    CONSTRAINT "provider_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_corrections" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterEmail" TEXT,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "provider_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_corrections_queue" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "urlSlug" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),
    "handledBy" TEXT,
    "status" "public"."CorrectionQueueStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "provider_corrections_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "zipCode" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pending_submissions" (
    "id" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "serviceArea" TEXT,
    "yearsExperience" TEXT,
    "licensed" BOOLEAN NOT NULL DEFAULT false,
    "insurance" BOOLEAN NOT NULL DEFAULT false,
    "certifications" TEXT,
    "specialties" TEXT,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "weekendAvailable" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "pending_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."corporate_event_inquiries" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "status" "public"."CorporateInquiryStatus" NOT NULL DEFAULT 'NEW',
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "corporate_event_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "public"."providers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_callSid_key" ON "public"."call_logs"("callSid");

-- CreateIndex
CREATE UNIQUE INDEX "city_numbers_twilioNumber_key" ON "public"."city_numbers"("twilioNumber");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "public"."services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_services_providerId_serviceId_key" ON "public"."provider_services"("providerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "public"."states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_abbr_key" ON "public"."states"("abbr");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_stateId_key" ON "public"."cities"("name", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_coverage_providerId_stateId_cityId_key" ON "public"."provider_coverage"("providerId", "stateId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_addresses_providerId_key" ON "public"."provider_addresses"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_coords_providerId_key" ON "public"."provider_coords"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_name_key" ON "public"."availability"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_availability_providerId_availabilityId_key" ON "public"."provider_availability"("providerId", "availabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_name_key" ON "public"."payments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payments_providerId_paymentId_key" ON "public"."provider_payments"("providerId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "public"."badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_badges_providerId_badgeId_key" ON "public"."provider_badges"("providerId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "public"."waitlist"("email");

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_routedToId_fkey" FOREIGN KEY ("routedToId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."call_logs" ADD CONSTRAINT "call_logs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_services" ADD CONSTRAINT "provider_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_services" ADD CONSTRAINT "provider_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_coverage" ADD CONSTRAINT "provider_coverage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_coverage" ADD CONSTRAINT "provider_coverage_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_coverage" ADD CONSTRAINT "provider_coverage_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_addresses" ADD CONSTRAINT "provider_addresses_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_coords" ADD CONSTRAINT "provider_coords_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_availability" ADD CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_availability" ADD CONSTRAINT "provider_availability_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "public"."availability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_payments" ADD CONSTRAINT "provider_payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_payments" ADD CONSTRAINT "provider_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_badges" ADD CONSTRAINT "provider_badges_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_badges" ADD CONSTRAINT "provider_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_corrections" ADD CONSTRAINT "provider_corrections_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_corrections_queue" ADD CONSTRAINT "provider_corrections_queue_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
