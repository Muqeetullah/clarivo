"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// All auth forms prevent native credential submission before hydration.
export function useAuthReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
