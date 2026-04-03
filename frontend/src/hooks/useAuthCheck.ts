"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

export function useAuthCheck() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  /**
   * Wraps an action with an authentication check.
   * If the user is not signed in, it opens the login modal.
   * If the user is signed in, it executes the action.
   */
  const withAuth = <T extends (...args: any[]) => any>(action: T) => {
    return ((...args: Parameters<T>) => {
      if (!isSignedIn) {
        openSignIn();
        return;
      }
      return action(...args);
    }) as T;
  };

  /**
   * Checks if the user is signed in. If not, opens the login modal and returns false.
   * Use this inside event handlers.
   */
  const checkAuth = () => {
    if (!isSignedIn) {
      openSignIn();
      return false;
    }
    return true;
  };

  return { withAuth, checkAuth, isSignedIn };
}
