import { z } from 'zod';
import { TeamDataWithMembers, User, PlatformAdmin } from '@/lib/db/schema';
import { getTeamForUser, getUser, getPlatformAdmin, hasRole } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

/**
 * Get the current platform admin from session
 * Returns null if not authenticated as admin
 */
export async function getPlatformAdminFromSession(): Promise<PlatformAdmin | null> {
  return getPlatformAdmin();
}

/**
 * Require platform admin authentication
 * Redirects to admin login if not authenticated
 */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }
  if (!admin.isActive) {
    redirect('/admin/login?error=inactive');
  }
  return admin;
}

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData | z.infer<S>,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState | z.infer<S>, formData?: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // Handle direct object calls (no FormData)
    let result;
    if (!formData) {
      // prevState is actually the data object in this case
      result = schema.safeParse(prevState);
      if (!result.success) {
        return { error: result.error.errors[0].message };
      }
      return action(result.data, result.data, user);
    }

    // Handle FormData calls (traditional form submissions)
    result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

/**
 * Wrapper for validated actions that require a minimum team role.
 * Use for actions where only owners or admins should have access (e.g., delete, settings).
 */
export function validatedActionWithRole<S extends z.ZodType<any, any>, T>(
  schema: S,
  requiredRole: 'member' | 'admin' | 'owner',
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState | z.infer<S>, formData?: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const allowed = await hasRole(requiredRole);
    if (!allowed) {
      return { error: `This action requires ${requiredRole} or higher role` } as T;
    }

    let result;
    if (!formData) {
      result = schema.safeParse(prevState);
      if (!result.success) {
        return { error: result.error.errors[0].message };
      }
      return action(result.data, result.data, user);
    }

    result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithTeamFunction<T> = (
  formData: FormData,
  team: TeamDataWithMembers
) => Promise<T>;

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    return action(formData, team);
  };
}

/**
 * Wrapper for validated actions that require platform admin access
 */
type ValidatedActionWithPlatformAdminFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData | z.infer<S>,
  admin: PlatformAdmin
) => Promise<T>;

export function validatedActionWithPlatformAdmin<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithPlatformAdminFunction<S, T>
) {
  return async (prevState: ActionState | z.infer<S>, formData?: FormData) => {
    const admin = await getPlatformAdmin();
    if (!admin) {
      throw new Error('Admin is not authenticated');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is inactive');
    }

    // Handle direct object calls (no FormData)
    let result;
    if (!formData) {
      result = schema.safeParse(prevState);
      if (!result.success) {
        return { error: result.error.errors[0].message };
      }
      return action(result.data, result.data, admin);
    }

    // Handle FormData calls (traditional form submissions)
    result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, admin);
  };
}
