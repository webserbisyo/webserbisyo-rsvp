import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert(url && serviceKey && anonKey, "Supabase synthetic test environment is not configured");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const nonce = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const email = `event-revision-${nonce}@example.test`;
const password = `Synthetic-${crypto.randomUUID()}-Aa1!`;
let userId;
let targetClientId;
let controlClientId;

try {
  const authCreate = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });
  assert.equal(authCreate.error, null, authCreate.error?.message);
  assert(authCreate.data.user, "Synthetic Auth user was not created");
  userId = authCreate.data.user.id;

  targetClientId = await insertOne("clients", {
    contact_email: email,
    name: "Synthetic revision target",
    plan_type: "pro",
    status: "active",
  });
  controlClientId = await insertOne("clients", {
    contact_email: `event-control-${nonce}@example.test`,
    name: "Synthetic revision control",
    plan_type: "pro",
    status: "active",
  });

  await provisionSyntheticProfile({ clientId: targetClientId, email, userId });

  const targetEventId = await createEvent(targetClientId, `revision-${nonce}`);
  const controlEventId = await createEvent(controlClientId, `control-${nonce}`);
  const initialContent = draftContent("initial", true);
  await insert("event_content", { event_id: targetEventId, content_json: initialContent });
  await insert("event_content", { event_id: controlEventId, content_json: initialContent });

  const firstContent = draftContent("first-save", false);
  const firstSave = await admin.rpc("save_event_website_draft_revision", {
    p_actor_user_id: userId,
    p_canonical_event_patch: canonicalPatch("First Venue"),
    p_client_id: targetClientId,
    p_client_sequence: 1,
    p_content: firstContent,
    p_event_id: targetEventId,
    p_expected_revision: 0,
  });
  assert.equal(firstSave.error, null, firstSave.error?.message);
  assert.equal(firstSave.data?.status, "saved");
  assert.equal(firstSave.data?.savedRevision, 1);
  assert.equal(firstSave.data?.clientSequence, 1);

  const staleSave = await admin.rpc("save_event_website_draft_revision", {
    p_actor_user_id: userId,
    p_canonical_event_patch: canonicalPatch("Stale Venue"),
    p_client_id: targetClientId,
    p_client_sequence: 2,
    p_content: draftContent("stale-write", true),
    p_event_id: targetEventId,
    p_expected_revision: 0,
  });
  assert.equal(staleSave.error, null, staleSave.error?.message);
  assert.equal(staleSave.data?.status, "conflict");
  assert.equal(staleSave.data?.serverRevision, 1);

  const afterConflict = await loadContent(targetEventId);
  assert.equal(afterConflict.saved_revision, 1);
  assert.equal(afterConflict.content_json.testMarker, "first-save");
  assert.equal(afterConflict.content_json.layout.enabledSections.guestbook, false);

  const secondContent = draftContent("second-save", true);
  const secondSave = await admin.rpc("save_event_website_draft_revision", {
    p_actor_user_id: userId,
    p_canonical_event_patch: canonicalPatch("Second Venue"),
    p_client_id: targetClientId,
    p_client_sequence: 3,
    p_content: secondContent,
    p_event_id: targetEventId,
    p_expected_revision: 1,
  });
  assert.equal(secondSave.error, null, secondSave.error?.message);
  assert.equal(secondSave.data?.savedRevision, 2);

  const stalePublish = await admin.rpc("publish_event_website_revision", {
    p_actor_user_id: userId,
    p_client_id: targetClientId,
    p_event_id: targetEventId,
    p_expected_saved_revision: 1,
    p_private_access_token: null,
  });
  assert.equal(stalePublish.error, null, stalePublish.error?.message);
  assert.equal(stalePublish.data?.status, "conflict");

  const publish = await admin.rpc("publish_event_website_revision", {
    p_actor_user_id: userId,
    p_client_id: targetClientId,
    p_event_id: targetEventId,
    p_expected_saved_revision: 2,
    p_private_access_token: null,
  });
  assert.equal(publish.error, null, publish.error?.message);
  assert.equal(publish.data?.status, "published");
  assert.equal(publish.data?.publishedRevision, 2);

  const publishedContent = await loadContent(targetEventId);
  assert.equal(publishedContent.saved_revision, 2);
  assert.equal(publishedContent.published_revision, 2);
  assert.deepEqual(publishedContent.published_content_json, publishedContent.content_json);

  const tenant = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await tenant.auth.signInWithPassword({ email, password });
  assert.equal(signIn.error, null, signIn.error?.message);
  const unauthorizedRpc = await tenant.rpc("save_event_website_draft_revision", {
    p_actor_user_id: userId,
    p_canonical_event_patch: canonicalPatch("Denied Venue"),
    p_client_id: targetClientId,
    p_client_sequence: 4,
    p_content: draftContent("denied-write", false),
    p_event_id: targetEventId,
    p_expected_revision: 2,
  });
  assert(unauthorizedRpc.error, "Authenticated users must not execute the revision RPC");

  const controlContent = await loadContent(controlEventId);
  assert.equal(controlContent.saved_revision, 0);
  assert.equal(controlContent.published_revision, 0);
  assert.equal(controlContent.content_json.testMarker, "initial");

  process.stdout.write("Synthetic Event Website revision verification passed.\n");
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
  if (targetClientId) await purgeClient(targetClientId, userId ? [userId] : []);
  if (controlClientId) await purgeClient(controlClientId, []);
}

function draftContent(marker, guestbookEnabled) {
  return {
    layout: {
      enabledSections: {
        guestbook: guestbookEnabled,
        host_info: true,
        main_event: true,
        rsvp_form: true,
        venue: true,
      },
      sectionOrder: ["host_info", "main_event", "venue", "guestbook", "rsvp_form"],
    },
    testMarker: marker,
  };
}

function canonicalPatch(venueName) {
  return {
    event_date: "2030-02-14",
    event_time: "15:00:00",
    rsvp_close_at: "2030-02-01T00:00:00Z",
    venue_address: "Synthetic Address",
    venue_name: venueName,
  };
}

async function createEvent(clientId, slug) {
  return insertOne("rsvp_events", {
    client_id: clientId,
    draft_event_slug: slug,
    draft_visibility: "public",
    event_slug: slug,
    event_type: "wedding",
    status: "draft",
    title: "Synthetic Revision Event",
    visibility: "public",
  });
}

async function insertOne(table, values) {
  const { data, error } = await admin.from(table).insert(values).select("id").single();
  assert.equal(error, null, `${table}: ${error?.message}`);
  return data.id;
}

async function insert(table, values) {
  const { error } = await admin.from(table).insert(values);
  assert.equal(error, null, `${table}: ${error?.message}`);
}

async function loadContent(eventId) {
  const { data, error } = await admin
    .from("event_content")
    .select("content_json, published_content_json, published_revision, saved_revision")
    .eq("event_id", eventId)
    .single();
  assert.equal(error, null, error?.message);
  return data;
}

async function purgeClient(clientId, profileIds) {
  const { error } = await admin.rpc("admin_purge_client_permanently", {
    p_client_id: clientId,
    p_profile_ids: profileIds,
  });
  assert.equal(error, null, error?.message);
}

async function provisionSyntheticProfile(input) {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();
  assert.equal(error, null, error?.message);
  const sql = data
    ? `update public.profiles set client_id = '${input.clientId}'::uuid, is_active = true, role = 'client_owner' where id = '${input.userId}'::uuid;`
    : `insert into public.profiles (id, client_id, email, role, is_active) values ('${input.userId}'::uuid, '${input.clientId}'::uuid, '${input.email}', 'client_owner', true);`;
  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", sql], {
    encoding: "utf8",
    env: process.env,
  });
  assert.equal(
    result.status,
    0,
    result.stderr || "Supabase CLI could not provision the synthetic profile.",
  );
}
