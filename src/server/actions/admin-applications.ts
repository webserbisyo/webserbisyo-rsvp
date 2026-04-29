"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import {
  ApproveApplicationSchema,
  ApproveApplicationForPaymentSchema,
  BulkApproveApplicationsSchema,
  BulkRejectAndDeleteApplicationsSchema,
  CancelApplicationSchema,
  MarkApplicationReviewingSchema,
  RejectAndDeleteApplicationSchema,
  RejectApplicationSchema,
} from "@/lib/validations/admin-workflow.schema";
import {
  approveApplication,
  approveApplicationsBulk,
  approveApplicationForPayment,
  cancelApplication,
  markApplicationReviewing,
  rejectAndDeleteApplication,
  rejectAndDeleteApplicationsBulk,
  rejectApplication,
} from "@/server/services/admin-workflow/applications";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function markApplicationReviewingAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(MarkApplicationReviewingSchema, input);
    const application = await markApplicationReviewing(payload, admin.id);

    revalidateWorkflowRoutes();

    return actionSuccess({
      applicationId: application.id,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function rejectApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(RejectApplicationSchema, input);
    const application = await rejectApplication(payload, admin.id);

    revalidateWorkflowRoutes();

    return actionSuccess({
      applicationId: application.id,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function cancelApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(CancelApplicationSchema, input);
    const application = await cancelApplication(payload, admin.id);

    revalidateWorkflowRoutes();

    return actionSuccess({
      applicationId: application.id,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function approveApplicationForPaymentAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ApproveApplicationForPaymentSchema, input);
    const result = await approveApplicationForPayment(payload, admin.id);

    revalidateWorkflowRoutes();

    return actionSuccess({
      applicationId: result.application.id,
      paymentId: result.payment.id,
      status: result.application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function approveApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ApproveApplicationSchema, input);
    const result = await approveApplication(payload, admin.id);

    revalidateWorkflowRoutes();
    revalidatePath(result.href);

    return actionSuccess({
      applicationId: result.application.id,
      clientId: result.client.id,
      href: result.href,
      status: result.application.status,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function rejectAndDeleteApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(RejectAndDeleteApplicationSchema, input);
    const result = await rejectAndDeleteApplication(payload, admin.id);

    revalidateWorkflowRoutes();

    return actionSuccess({
      applicationId: result.id,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function approveApplicationsBulkAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkApproveApplicationsSchema, input);
    const result = await approveApplicationsBulk(payload, admin.id);

    revalidateWorkflowCollectionRoutes();

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function rejectAndDeleteApplicationsBulkAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkRejectAndDeleteApplicationsSchema, input);
    const result = await rejectAndDeleteApplicationsBulk(payload, admin.id);

    revalidateWorkflowCollectionRoutes();

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

function revalidateWorkflowRoutes() {
  revalidateWorkflowCollectionRoutes();
}

function revalidateWorkflowCollectionRoutes() {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/clients");
}
