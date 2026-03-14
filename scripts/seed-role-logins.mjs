import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

function parseDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }

  return entries;
}

function loadEnv() {
  const localEnv = parseDotEnvFile(envPath);
  for (const [key, value] of Object.entries(localEnv)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function failIfError(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
}

async function resolveTenant(supabase, slug) {
  if (slug) {
    const bySlug = await supabase
      .from("tenants")
      .select("id, name, slug, created_at")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    failIfError(bySlug, "Unable to resolve tenant by slug");
    if (bySlug.data) return bySlug.data;
  }

  const latest = await supabase
    .from("tenants")
    .select("id, name, slug, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  failIfError(latest, "Unable to resolve tenant");

  if (!latest.data) {
    throw new Error("No tenant found. Create workspace first.");
  }

  return latest.data;
}

async function listAllAuthUsers(supabase) {
  const all = [];
  let page = 1;
  const perPage = 200;

  for (;;) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });
    failIfError(result, "Unable to list auth users");
    const users = result.data?.users ?? [];
    all.push(...users);
    if (users.length < perPage) break;
    page += 1;
  }

  return all;
}

async function ensureAuthUser(supabase, account, existingUsersByEmail) {
  const emailKey = account.email.toLowerCase();
  let user = existingUsersByEmail.get(emailKey);

  if (!user) {
    const createResult = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    failIfError(createResult, `Unable to create auth user ${account.email}`);
    user = createResult.data.user;
  } else {
    const updateResult = await supabase.auth.admin.updateUserById(user.id, {
      password: account.password,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: account.fullName,
      },
    });
    failIfError(updateResult, `Unable to update auth user ${account.email}`);
    user = updateResult.data.user;
  }

  if (!user?.id) {
    throw new Error(`Auth user id missing for ${account.email}`);
  }

  return user;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const tenantSlug = getArg("tenant-slug") || process.env.SEED_TENANT_SLUG;
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tenant = await resolveTenant(supabase, tenantSlug);

  const accounts = [
    {
      role: "admin",
      fullName: "Seed Admin",
      email: "admin.seed@smartcompliance.local",
      password: "Admin@12345",
    },
    {
      role: "compliance_officer",
      fullName: "Seed Compliance Officer",
      email: "officer.seed@smartcompliance.local",
      password: "Officer@12345",
    },
    {
      role: "developer",
      fullName: "Seed Developer",
      email: "developer.seed@smartcompliance.local",
      password: "Developer@12345",
    },
  ];

  const existingUsers = await listAllAuthUsers(supabase);
  const existingUsersByEmail = new Map(
    existingUsers
      .filter((user) => typeof user.email === "string")
      .map((user) => [user.email.toLowerCase(), user]),
  );

  const created = [];
  for (const account of accounts) {
    const authUser = await ensureAuthUser(supabase, account, existingUsersByEmail);
    existingUsersByEmail.set(account.email.toLowerCase(), authUser);

    const upsertResult = await supabase.from("users").upsert(
      {
        id: authUser.id,
        tenant_id: tenant.id,
        email: account.email,
        full_name: account.fullName,
        role: account.role,
      },
      {
        onConflict: "id",
      },
    );
    failIfError(upsertResult, `Unable to upsert profile for ${account.email}`);

    created.push({
      role: account.role,
      email: account.email,
      password: account.password,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        tenant: `${tenant.name} (${tenant.slug})`,
        credentials: created,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`[seed:roles] ${error.message}\n`);
  process.exit(1);
});
