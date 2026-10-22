"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardInputSchema } from "@clarivo/shared";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/rpc/client";
import { AuthCard, AuthButton, AuthFeedback } from "@/components/auth-ui";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage } from "./feedback";

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm({
    resolver: zodResolver(onboardInputSchema),
    defaultValues: { name: "" },
  });
  const mutation = useMutation(api.workspace.onboard.mutationOptions());
  return (
    <AuthCard
      title="What’s your business called?"
      description="Set up your workspace to start helping visitors."
    >
      <form
        onSubmit={form.handleSubmit(async (input) => {
          setError("");
          try {
            await mutation.mutateAsync(input);
            router.replace("/dashboard");
            router.refresh();
          } catch (failure) {
            setError(errorMessage(failure));
          }
        })}
      >
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="business-name">Business name</FieldLabel>
            <Input
              id="business-name"
              autoComplete="organization"
              maxLength={120}
              autoFocus
              disabled={mutation.isPending}
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <AuthFeedback message={error} title="Setup wasn’t completed" error />
          <AuthButton
            type="submit"
            disabled={mutation.isPending}
            loading={mutation.isPending}
          >
            {mutation.isPending ? "Creating workspace…" : "Continue"}
          </AuthButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
