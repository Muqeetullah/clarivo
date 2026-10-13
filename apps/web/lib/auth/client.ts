"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Neon owns OAuth exchange and cookies through the same-origin /api/auth handler.
export const authClient = createAuthClient();
