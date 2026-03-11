/* scripts/appwrite-sync-schema.js
 * Sync your Appwrite DB schema (create/update). Optional --clean flag
 * removes attributes that aren't part of the target schema.
 *
 * Usage:
 *   node -r dotenv/config scripts/appwrite-sync-schema.js dotenv_config_path=.env.appwrite.local
 *   node -r dotenv/config scripts/appwrite-sync-schema.js dotenv_config_path=.env.appwrite.local --clean
 */

const sdk = require("node-appwrite");

// ---- env ----
const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DB_ID = "nutrition_db",
  APPWRITE_PROFILES_COLLECTION_ID = "profiles",
  APPWRITE_HEALTH_COLLECTION_ID = "health_profiles",
  // optional env still works, but we also accept --clean CLI flag:
  DELETE_EXTRA,
} = process.env;

// Windows-friendly flag handling
const DELETE_EXTRA_FLAG = !!(DELETE_EXTRA || process.argv.includes("--clean") || process.argv.includes("-c"));

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error("❌ Missing APPWRITE_* env vars. Fill .env.appwrite.local");
  process.exit(1);
}

// ---- client / db ----
const client = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const db = new sdk.Databases(client);

// ---- target schema (source of truth) ----
const SCHEMA = {
  dbId: APPWRITE_DB_ID,
  collections: {
    [APPWRITE_PROFILES_COLLECTION_ID]: {
      name: "Profiles",
      // Only non-PHI here
      attributes: {
        displayName: { type: "string", size: 128 },
        email:       { type: "string", size: 255 },
        image:       { type: "string", size: 2048 },
      },
    },
    [APPWRITE_HEALTH_COLLECTION_ID]: {
      name: "Health Profiles",
      // PHI + onboarding here
      attributes: {
        dateOfBirth:         { type: "string",   size: 32 },
        sex:                 { type: "string",   size: 16 },
        activityLevel:       { type: "string",   size: 32 },
        goal:                { type: "string",   size: 32 },
        height:              { type: "string",  size: 32 },
        weight:              { type: "string",  size: 32 },
        flags:               { type: "json"                },
        diets:               { type: "string[]", size: 64 },
        allergens:           { type: "string[]", size: 64 },
        intolerances:        { type: "string[]", size: 64 },
        dislikedIngredients: { type: "string[]", size: 64 },
        major_conditions:    { type: "string[]", size: 128 },
        diet_codes:          { type: "string[]", size: 64 },
        diet_ids:            { type: "string[]", size: 36 },
        allergen_codes:      { type: "string[]", size: 64 },
        allergen_ids:        { type: "string[]", size: 36 },
        condition_codes:     { type: "string[]", size: 64 },
        condition_ids:       { type: "string[]", size: 36 },
        onboardingComplete:  { type: "boolean"            },
      },
    },
  },
};

// ---- helpers ----
const ok = async (fn, label) => {
  try { await fn(); console.log(`+ ${label}`); }
  catch (e) {
    const c = e?.code || e?.response?.status;
    if (c === 409) console.log(`✓ ${label} exists`);
    else console.warn(`(!) ${label}:`, e?.message || e);
  }
};

async function ensureDatabase(dbId, name) {
  try { await db.get(dbId); console.log(`✓ db ${dbId}`); }
  catch { await db.create(dbId, name); console.log(`+ db ${dbId}`); }
}

async function ensureCollection(dbId, collId, name) {
  try {
    const coll = await db.getCollection(dbId, collId);
    console.log(`✓ collection ${collId}`);
    // Make sure collection has Users create permission and documentSecurity
    const wantCreate = [sdk.Permission.create(sdk.Role.users())];
    const needsUpdate =
      coll.documentSecurity !== true ||
      coll.name !== name ||
      !Array.isArray(coll.$permissions) ||
      !String(coll.$permissions).includes('create("users")');

    if (needsUpdate) {
      await db.updateCollection(
        dbId,
        collId,
        name,
        wantCreate,
        true, // documentSecurity
        coll.enabled ?? true
      );
      console.log(`• updated collection meta for ${collId}`);
    }
  } catch {
    await db.createCollection(
      dbId,
      collId,
      name,
      [sdk.Permission.create(sdk.Role.users())],
      true, // documentSecurity
      true
    );
    console.log(`+ created collection ${collId}`);
  }
}

async function listExistingAttributes(dbId, collId) {
  try {
    const res = await db.listAttributes(dbId, collId);
    const attrs = (res?.attributes || []).map(a => a.key);
    return new Set(attrs);
  } catch (e) {
    console.warn(`(!) listAttributes failed for ${collId}:`, e?.message || e);
    return new Set();
  }
}

async function createAttr(dbId, collId, key, spec) {
  const { type, size } = spec;
  switch (type) {
    case "string":
      await ok(() => db.createStringAttribute(dbId, collId, key, size || 64, false), `${collId}.${key} (string)`);
      break;
    case "string[]":
      await ok(() => db.createStringAttribute(dbId, collId, key, size || 64, false, undefined, true), `${collId}.${key} (string[])`);
      break;
    case "boolean":
      await ok(() => db.createBooleanAttribute(dbId, collId, key, false), `${collId}.${key} (boolean)`);
      break;
    case "json":
      await ok(() => db.createJsonAttribute(dbId, collId, key, false), `${collId}.${key} (json)`);
      break;
    default:
      console.warn(`(!) Unsupported type for ${collId}.${key}: ${type}`);
  }
}

async function deleteAttr(dbId, collId, key) {
  try {
    await db.deleteAttribute(dbId, collId, key);
    console.log(`- deleted stray ${collId}.${key}`);
  } catch (e) {
    console.warn(`(!) deleteAttribute failed for ${collId}.${key}:`, e?.message || e);
  }
}

// ---- main ----
(async function run() {
  const { dbId, collections } = SCHEMA;
  console.log("🔧 Syncing Appwrite schema…");
  await ensureDatabase(dbId, "Nutrition DB");

  for (const [collId, { name, attributes }] of Object.entries(collections)) {
    await ensureCollection(dbId, collId, name);

    const have = await listExistingAttributes(dbId, collId);

    // Create any missing attributes
    for (const [key, spec] of Object.entries(attributes)) {
      if (!have.has(key)) await createAttr(dbId, collId, key, spec);
    }

    // Optionally delete extras not in target schema
    if (DELETE_EXTRA_FLAG) {
      for (const key of have) {
        if (!attributes[key]) await deleteAttr(dbId, collId, key);
      }
    }
  }

  console.log(
    "✅ Schema sync complete.",
    DELETE_EXTRA_FLAG ? "(Deleted extras)" : "(No deletions)"
  );
})().catch(e => {
  console.error("❌ Sync failed:", e?.message || e);
  process.exit(1);
});
