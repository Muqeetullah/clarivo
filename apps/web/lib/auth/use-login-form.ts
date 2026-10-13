"use client";
import { useState } from "react";
import { useAuthNavigation } from "@/components/auth-navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth/client";
import { useAuthReady } from "@/lib/auth/use-auth-ready";
import {
  loginSchema,
  signupSchema,
  type Credentials,
} from "@/lib/auth/credentials";
import { google as rungoogle } from "./google-sign-in";
import { magicLink as runmagicLink } from "./magic-link-sign-in";
import { credentialError } from "@/lib/auth/credential-error";

export function useLoginForm(signup: boolean) {
  const hydrated = useAuthReady();
  const { navigate, navigating } = useAuthNavigation();
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [magic, setMagic] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<Credentials>({
    resolver: zodResolver(signup ? signupSchema : loginSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const callbackURL = () => `${window.location.origin}/dashboard`;

  async function submit(values: Credentials) {
    if (pending) return;
    setPending(true);
    setMessage("");
    setVerificationEmail("");
    let accountCreated = false;
    setMessageIsError(true);
    try {
      const result = signup
        ? await authClient.signUp.email({
            ...values,
            callbackURL: callbackURL(),
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
            callbackURL: callbackURL(),
          });
      if (result.error) {
        const feedback = credentialError(result.error, signup);
        setMessage(feedback.message);
        if (feedback.verify) setVerificationEmail(values.email);
        return;
      }
      if (signup) {
        accountCreated = true;
        const sent = await authClient.emailOtp.sendVerificationOtp({
          email: values.email,
          type: "email-verification",
        });
        navigate(
          `/verify-email?email=${encodeURIComponent(values.email)}&sent=${sent.error ? "0" : "1"}`,
          { replace: true, refreshSession: true },
        );
      } else navigate("/dashboard", { replace: true, refreshSession: true });
    } catch (error) {
      if (accountCreated) {
        setVerificationEmail(values.email);
        setMessage(
          "Your account was created, but we couldn’t send the verification code. Request a new code below.",
        );
      } else {
        const feedback = credentialError(error, signup);
        setMessage(feedback.message);
        if (feedback.verify) setVerificationEmail(values.email);
      }
    } finally {
      setPending(false);
    }
  }
  function toggleMethod() {
    setMagic(!magic);
    setVerificationEmail("");
    setShowPassword(false);
    setMessage("");
    form.clearErrors();
  }

  const workflow = {
    pending,
    setPending,
    setMessage,
    setMessageIsError,
    callbackURL,
  };
  const google = () => rungoogle({ ...workflow, setGooglePending });
  const magicLink = () => runmagicLink({ ...workflow, form });
  return {
    hydrated,
    pending: pending || navigating,
    googlePending,
    message,
    messageIsError,
    verificationEmail,
    magic,
    showPassword,
    setShowPassword,
    form,
    submit,
    google,
    magicLink,
    toggleMethod,
  };
}
