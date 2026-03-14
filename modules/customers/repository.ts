import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateCustomerInput,
  CustomerFilters,
  CustomerRecord,
  CustomerRiskLevel,
  UpdateCustomerInput,
} from "@/modules/customers/types";

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  country_code: string | null;
  risk_level: CustomerRiskLevel;
  created_at: string;
};

type CustomerRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
};

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    countryCode: row.country_code,
    riskLevel: row.risk_level,
    createdAt: row.created_at,
  };
}

function sanitizeSearchValue(value: string) {
  return value.replace(/[%(),]/g, " ").trim();
}

const CUSTOMER_SELECT_FIELDS =
  "id, first_name, last_name, email, phone, date_of_birth, country_code, risk_level, created_at";

export async function listCustomers(
  { supabase, tenantId }: CustomerRepositoryParams,
  filters: CustomerFilters,
) {
  let query = supabase
    .from("customers")
    .select(CUSTOMER_SELECT_FIELDS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.query) {
    const search = sanitizeSearchValue(filters.query);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
  }

  if (filters.risk) {
    query = query.eq("risk_level", filters.risk);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load customers.");
  }

  return (data ?? []).map((row) => mapCustomer(row as CustomerRow));
}

export async function createCustomer(
  { supabase, tenantId }: CustomerRepositoryParams,
  input: CreateCustomerInput,
) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      country_code: input.countryCode ?? null,
      risk_level: input.riskLevel,
    })
    .select(CUSTOMER_SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new Error("Unable to create the customer.");
  }

  return mapCustomer(data as CustomerRow);
}

export async function getCustomerById(
  { supabase, tenantId }: CustomerRepositoryParams,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT_FIELDS)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Customer was not found.");
  }

  return mapCustomer(data as CustomerRow);
}

export async function updateCustomer(
  { supabase, tenantId }: CustomerRepositoryParams,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      country_code: input.countryCode ?? null,
      risk_level: input.riskLevel,
    })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", customerId)
    .select(CUSTOMER_SELECT_FIELDS)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Unable to update the customer.");
  }

  return mapCustomer(data as CustomerRow);
}
