---
description: React Hook Form, Zod 4, and Server Action validation rules for WebSerbisyo RSVP
globs:
  [
    "src/components/forms/**/*.tsx",
    "src/lib/validations/**/*.ts",
    "src/server/actions/**/*.ts",
    "src/app/**/*.tsx",
  ]
alwaysApply: false
---

# Forms & Validation Rules - WebSerbisyo RSVP

Verified against React Hook Form, @hookform/resolvers, and Zod official docs/releases as of 2026-04-27.

Use installed `package.json` / `package-lock.json` as source of truth. Do not upgrade form dependencies blindly.

Target packages:

```txt
react-hook-form 7.74.x
@hookform/resolvers 5.2.x
zod 4.3.x
```

Do not use React Hook Form v8 beta for this MVP.

---

## 1. RSVP MVP Form Direction

Use forms only where the MVP needs real data collection or admin action.

Current form priority:

```txt
1. Public application form
2. Admin application review/approval actions
3. Admin Meta Pixel settings
4. Client dashboard setup forms later
5. Public RSVP guest form later
6. Guestbook/gift wallet forms later
```

Do not build public RSVP, guestbook, or gift wallet forms until those phases are approved.

---

## 2. Validation Principle

All external input must be validated on the server.

Client-side validation is for UX only.

Rules:

- Use Zod for every Server Action and public Route Handler input.
- Use React Hook Form only for real interactive forms.
- Do not trust hidden inputs, disabled fields, client-calculated prices, plan values, or role values.
- Normalize email/phone/name on the server.
- Return typed action state.
- Never expose raw database errors to public users.

---

## 3. File Boundaries

Preferred structure:

```txt
src/lib/validations/application.schema.ts
src/lib/validations/approval.schema.ts
src/lib/validations/event.schema.ts
src/lib/validations/meta-pixel.schema.ts

src/server/actions/applications.ts
src/server/actions/approvals.ts
src/server/actions/meta-pixels.ts

src/components/forms/application-form.tsx
```

Rules:

- Schemas live in `src/lib/validations`.
- Server Actions live in `src/server/actions`.
- Workflow logic lives in `src/server/services`.
- Form UI lives in `src/components/forms` or route-local components.
- Do not place service-role Supabase logic in form components.

---

## 4. Zod 4 Rules

Use Zod 4 syntax.

Prefer:

```ts
import { z } from "zod";

export const applicationSchema = z.object({
  fullName: z.string().trim().min(1, { error: "Full name is required" }).max(120),
  email: z.email({ error: "Enter a valid email address" }),
  phone: z.string().trim().max(40).optional(),
  eventType: z.enum([
    "wedding",
    "debut",
    "birthday",
    "baptism",
    "reunion",
    "anniversary",
    "corporate",
    "other",
  ]),
  preferredPlan: z.enum(["pro", "max"]),
  message: z.string().trim().max(1000).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
```

Use top-level validators:

```txt
z.email()
z.url()
z.uuid()
z.uuidv4()
z.guid()
z.iso.date()
z.iso.datetime()
```

Use unified error customization:

```ts
z.string({ error: "Required" });
z.string().min(1, { error: "Required" });
```

Avoid old Zod 3 habits:

```txt
z.string().email()
z.string().uuid()
required_error / invalid_type_error
ZodError.format()
.deepPartial()
```

For error shaping, prefer `error.issues` or Zod 4 helpers such as `z.treeifyError()` when needed.

---

## 5. Server Action Pattern

Use Server Actions for trusted app mutations.

Pattern:

```ts
"use server";

import { z } from "zod";
import { applicationSchema } from "@/lib/validations/application.schema";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitApplicationAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    eventType: formData.get("eventType"),
    preferredPlan: formData.get("preferredPlan"),
    message: formData.get("message") || undefined,
  };

  const parsed = applicationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the form.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // Permission checks or public-submit guard here.
  // Then call service/query layer.

  return {
    ok: true,
    message: "Application submitted.",
  };
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));
}
```

Rules:

- Validate before calling services.
- Check permissions for protected actions.
- Keep service-role usage out of actions unless the service itself is server-only.
- Do not return stack traces or raw Supabase errors to public users.
- Use `redirect()` only after successful mutations when navigation is intended.

---

## 6. React Hook Form Pattern

Use React Hook Form for interactive client forms.

```tsx
"use client";

import { useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validations/application.schema";
import { submitApplicationAction } from "@/server/actions/applications";

const initialState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

export function ApplicationForm() {
  const [state, action, isPending] = useActionState(submitApplicationAction, initialState);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    mode: "onBlur",
    defaultValues: {
      preferredPlan: "pro",
    },
  });

  const preferredPlan = useWatch({
    control: form.control,
    name: "preferredPlan",
  });

  return (
    <form action={action} className="space-y-4">
      {/* fields */}
      <input type="hidden" name="preferredPlan" value={preferredPlan} />

      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit application"}
      </button>

      {state.message ? <p>{state.message}</p> : null}
    </form>
  );
}
```

Rules:

- Keep form components as leaf Client Components.
- Use shadcn inputs/selects/buttons where possible.
- Disable submit while pending.
- Show field-level errors where possible.
- Keep server validation as source of truth.

---

## 7. useWatch Over watch

Prefer `useWatch()` for reactive field UI.

Good uses:

```txt
preferredPlan preview
eventType-specific helper copy
conditional sections
character counters
guest count-dependent fields later
```

Use:

```tsx
const preferredPlan = useWatch({
  control: form.control,
  name: "preferredPlan",
});
```

Avoid broad `watch()` subscriptions for large forms because it can cause wider re-renders and has known React Compiler concerns.

Do not call `useWatch()` inline inside JSX. Assign it to a variable or move it to a child component.

---

## 8. @hookform/resolvers v5 Typing

Let resolver infer types when possible.

```ts
const form = useForm({
  resolver: zodResolver(applicationSchema),
});
```

For schemas with transforms, use explicit input/output types:

```ts
const form = useForm<
  z.input<typeof applicationSchema>,
  unknown,
  z.output<typeof applicationSchema>
>({
  resolver: zodResolver(applicationSchema),
});
```

Use transforms carefully in public forms. Prefer simple validation + explicit normalization in server services.

---

## 9. Controlled shadcn/Radix Inputs

For native inputs, use `register`.

For controlled shadcn/Radix components such as Select, use `Controller` or shadcn form helpers.

```tsx
import { Controller } from "react-hook-form";

<Controller
  control={form.control}
  name="preferredPlan"
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      {/* SelectTrigger / SelectContent */}
    </Select>
  )}
/>;
```

Rules:

- Use `Controller` only when `register` is not enough.
- Do not overwrap every input.
- Keep accessibility labels and error messages connected.

---

## 10. Field Arrays

Use `useFieldArray` only when the form truly has repeatable fields.

Future good uses:

```txt
additional guests
custom RSVP questions
gift wallet entries
schedule sections
```

Do not add field arrays to the admin-first application form unless required.

For React Hook Form v7, field array items use `field.id` as the React key. Do not pre-adopt v8 beta field-array changes.

---

## 11. Public Form Security

Public forms need stricter handling.

For `/apply`:

- Validate with Zod on server.
- Normalize email and phone.
- Store only approved fields.
- Rate limiting later before ads/production.
- Turnstile later if spam risk appears.
- Do not let the user set admin-only fields.
- Do not expose internal IDs unnecessarily.
- Do not send onboarding email until admin approval/payment confirmation.

For future public RSVP:

- Validate by event slug.
- Accept submissions only for published/active events.
- Use edit token for update/cancel.
- Do not require guest login in v1.

---

## 12. Action State Shape

Use one consistent action state shape.

```ts
export type ActionState<TData = undefined> = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: TData;
};
```

Rules:

- `ok: true` means mutation succeeded.
- `ok: false` means user-correctable or permission/business error.
- Use `fieldErrors` for input fields.
- Use `message` for form-level feedback.
- Keep returned data minimal.

---

## 13. Anti-Patterns

Avoid:

```txt
client validation only
raw FormData inserted into database
raw Supabase errors shown to users
business logic inside form components
service-role Supabase in client components
trusting hidden fields for price/plan/role
React Hook Form for static pages
watch() for large reactive forms
useWatch() inline in JSX
building RSVP guest forms before approved
building payment/downpayment forms before approved
Zod 3 error customization patterns
v8 beta RHF changes in v7 code
```

---

## 14. MVP Usage Priority

Implement form work in this order:

```txt
1. Application schema
2. Application Server Action
3. Application form UI
4. Admin approval schema/action
5. Admin Meta Pixel schema/action
6. Client setup forms later
7. Public RSVP guest forms later
```

After form/validation changes, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```
