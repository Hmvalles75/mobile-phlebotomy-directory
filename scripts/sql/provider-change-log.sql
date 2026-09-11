-- Provider change log trigger. Applied with scripts/apply-provider-change-log.ts
-- (idempotent). Companion to lib/providerAudit.ts; the table itself is defined
-- in prisma/schema.prisma (model ProviderChangeLog) and created by db push.
--
-- Records one row per tracked column that changed on every UPDATE of
-- providers, whoever made it. Actor comes from the app's stamp when the same
-- UPDATE set auditAt; otherwise "db" (database tool, script, migration).

CREATE OR REPLACE FUNCTION provider_change_log_fn() RETURNS trigger AS $$
DECLARE
  actor text;
  src text;
  col text;
  oldv text;
  newv text;
  tracked text[] := ARRAY[
    'eligibleForLeads','notifyEnabled','isFeatured','priorityRouting','featuredTier','listingTier','status',
    'serviceRadiusMiles','zipCodes','primaryCity','primaryState',
    'email','notificationEmail','claimEmail','phonePublic',
    'removedAt','removedReason','leadsPausedAt','dormantWarnedAt','leadsResumedAt',
    'stripeCustomerId','onboardingStatus'
  ];
BEGIN
  IF NEW."auditAt" IS DISTINCT FROM OLD."auditAt" AND NEW."auditActor" IS NOT NULL THEN
    actor := split_part(NEW."auditActor", '|', 1);
    src := NULLIF(split_part(NEW."auditActor", '|', 2), '');
  ELSE
    actor := 'db';
    src := NULL;
  END IF;

  FOREACH col IN ARRAY tracked LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col) INTO oldv, newv USING OLD, NEW;
    IF oldv IS DISTINCT FROM newv THEN
      INSERT INTO provider_change_log (id, "providerId", "changedAt", actor, source, field, "oldValue", "newValue")
      VALUES (
        'pcl_' || replace(gen_random_uuid()::text, '-', ''),
        NEW.id, now(), actor, src, col, left(oldv, 500), left(newv, 500)
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_change_log_trg ON providers;
CREATE TRIGGER provider_change_log_trg
  AFTER UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION provider_change_log_fn();
