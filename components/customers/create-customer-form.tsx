"use client";

import { createCustomerAction } from "@/app/actions/customers";
import { CustomerForm } from "@/components/customers/customer-form";

type CreateCustomerFormProps = {
  disabled?: boolean;
};

export function CreateCustomerForm({
  disabled = false,
}: CreateCustomerFormProps) {
  return (
    <CustomerForm
      action={createCustomerAction}
      disabled={disabled}
      submitIdleLabel="Create customer"
      submitPendingLabel="Creating customer..."
    />
  );
}
