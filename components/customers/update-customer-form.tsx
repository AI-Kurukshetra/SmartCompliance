"use client";

import { updateCustomerAction } from "@/app/actions/customers";
import { CustomerForm } from "@/components/customers/customer-form";
import type { CustomerRecord } from "@/modules/customers/types";

type UpdateCustomerFormProps = {
  customer: CustomerRecord;
  disabled?: boolean;
};

export function UpdateCustomerForm({
  customer,
  disabled = false,
}: UpdateCustomerFormProps) {
  return (
    <CustomerForm
      action={updateCustomerAction}
      disabled={disabled}
      initialValues={{
        customerId: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        dateOfBirth: customer.dateOfBirth ?? "",
        countryCode: customer.countryCode ?? "",
        riskLevel: customer.riskLevel,
      }}
      submitIdleLabel="Save changes"
      submitPendingLabel="Updating customer..."
    />
  );
}
