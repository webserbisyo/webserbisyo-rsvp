import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
assert(url && serviceKey, "Supabase test environment is not configured");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const targetEmail = `deletion-target-${nonce}@example.test`;
const otherEmail = `deletion-control-${nonce}@example.test`;
let targetUserId;
let targetClientId;
let controlClientId;

try {
  const targetUser = await createAuthUser(targetEmail);
  targetUserId = targetUser.id;

  targetClientId = await insertOne("clients", {
    contact_email: targetEmail,
    custom_frontend_status: "connected",
    custom_frontend_url: "https://synthetic.example.test",
    hosting_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    hosting_starts_at: new Date().toISOString(),
    name: "Synthetic deletion target",
    plan_type: "pro",
    status: "active",
  });
  controlClientId = await insertOne("clients", {
    contact_email: otherEmail,
    name: "Synthetic deletion control",
    plan_type: "max",
    status: "active",
  });

  const eventId = await insertOne("rsvp_events", {
    client_id: targetClientId,
    custom_frontend_enabled: true,
    custom_frontend_url: "https://synthetic.example.test",
    event_slug: `delete-${nonce}`.replace(/[^a-z0-9-]/g, ""),
    event_type: "wedding",
    published_at: new Date().toISOString(),
    status: "published",
    title: "Synthetic Live Event",
    visibility: "public",
  });
  const applicationId = await insertOne("rsvp_applications", {
    approved_at: new Date().toISOString(),
    approved_client_id: targetClientId,
    approved_event_id: eventId,
    email: targetEmail,
    event_type: "wedding",
    full_name: "Synthetic Applicant",
    preferred_plan: "pro",
    status: "approved",
  });
  const paymentId = await insertOne("payments", {
    amount_due: 1000,
    amount_paid: 1000,
    application_id: applicationId,
    client_id: targetClientId,
    event_id: eventId,
    paid_at: new Date().toISOString(),
    payment_status: "paid",
    plan_type: "pro",
  });
  await insert("payment_refunds", {
    amount: 1000,
    client_id: targetClientId,
    confirmed_at: new Date().toISOString(),
    payment_id: paymentId,
    reason_note: "Synthetic refund",
  });
  const responseId = await insertOne("rsvp_responses", {
    attendance_status: "attending",
    client_id: targetClientId,
    event_id: eventId,
    guest_name: "Synthetic Guest",
    message: "Synthetic guestbook entry",
    party_size: 2,
  });
  await insert("rsvp_response_companions", {
    full_name: "Synthetic Companion",
    response_id: responseId,
  });
  await Promise.all([
    insert("event_content", { event_id: eventId, hero_title: "Synthetic" }),
    insert("meta_pixels", {
      event_id: eventId,
      name: "Synthetic Pixel",
      pixel_id: "synthetic-pixel",
      tracking_scope: "event",
    }),
    insert("client_custom_websites", {
      client_id: targetClientId,
      custom_frontend_enabled: true,
      event_id: eventId,
      status: "enabled",
    }),
    insert("email_logs", {
      application_id: applicationId,
      client_id: targetClientId,
      email_type: "client_onboarding",
      event_id: eventId,
      recipient_email: targetEmail,
    }),
    insert("client_deletion_tombstones", {
      client_email: targetEmail,
      client_name: "Synthetic deletion target",
      event_id: eventId,
      metadata: { nested: { client_id: targetClientId } },
      original_client_id: targetClientId,
    }),
  ]);

  const auditId = await insertOne("audit_logs", {
    action: "synthetic_client_action",
    client_id: targetClientId,
    entity_id: paymentId,
    entity_type: "payments",
    event_id: eventId,
    metadata: { linked_client_id: targetClientId },
  });
  const directAuditDelete = await supabase.from("audit_logs").delete().eq("id", auditId);
  assert.match(
    directAuditDelete.error?.message ?? "",
    /audit_logs is append-only|permission denied for table audit_logs/,
  );

  const storagePath = `event-website-gifts/${targetClientId}/test/synthetic.txt`;
  const upload = await supabase.storage
    .from("payment-qr-images")
    .upload(storagePath, new Blob(["synthetic"]), { contentType: "text/plain" });
  assert.equal(upload.error, null, upload.error?.message);
  const removal = await supabase.storage.from("payment-qr-images").remove([storagePath]);
  assert.equal(removal.error, null, removal.error?.message);

  const authDelete = await supabase.auth.admin.deleteUser(targetUserId);
  assert.equal(authDelete.error, null, authDelete.error?.message);
  const purge = await supabase.rpc("admin_purge_client_permanently", {
    p_client_id: targetClientId,
    p_profile_ids: [targetUserId],
  });
  assert.equal(purge.error, null, purge.error?.message);
  assert.equal(purge.data?.deleted, true, "canonical purge did not report deletion");

  for (const [table, column] of [
    ["clients", "id"],
    ["rsvp_events", "client_id"],
    ["payments", "client_id"],
    ["rsvp_responses", "client_id"],
    ["client_custom_websites", "client_id"],
    ["rsvp_applications", "approved_client_id"],
    ["email_logs", "client_id"],
    ["client_deletion_tombstones", "original_client_id"],
    ["audit_logs", "client_id"],
    ["notification_preferences", "client_id"],
    ["push_subscriptions", "client_id"],
  ]) {
    assert.equal(
      await count(table, column, targetClientId),
      0,
      `${table} still contains target data`,
    );
  }

  assert.equal(await count("clients", "id", controlClientId), 1, "control client was modified");
  console.info("Synthetic permanent client deletion passed.");
} finally {
  if (targetUserId) await supabase.auth.admin.deleteUser(targetUserId);
  if (targetClientId) {
    await supabase.rpc("admin_purge_client_permanently", {
      p_client_id: targetClientId,
      p_profile_ids: targetUserId ? [targetUserId] : [],
    });
  }
  if (controlClientId) await supabase.from("clients").delete().eq("id", controlClientId);
}

async function createAuthUser(email) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `Synthetic-${crypto.randomUUID()}-Aa1!`,
  });
  assert.equal(error, null, error?.message);
  assert(data.user, "Auth user was not created");
  return data.user;
}

async function insertOne(table, values) {
  const { data, error } = await supabase.from(table).insert(values).select("id").single();
  assert.equal(error, null, `${table}: ${error?.message}`);
  return data.id;
}

async function insert(table, values) {
  const { error } = await supabase.from(table).insert(values);
  assert.equal(error, null, `${table}: ${error?.message}`);
}

async function count(table, column, value) {
  const { count: result, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  assert.equal(error, null, `${table}: ${error?.message}`);
  return result ?? 0;
}
