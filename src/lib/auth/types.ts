export type UserRole = "admin" | "driver" | "viewer" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: AuthSession;
  expired?: boolean;
}

export type SignInFormData = {
  email: string;
  password: string;
};

export type ForgotPasswordFormData = {
  email: string;
};

export interface CreateDriverInput {
  name: string;
  phone: string;
  licenseNumber?: string;
}

export interface DriverWithUser {
  id: string;
  userId: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
