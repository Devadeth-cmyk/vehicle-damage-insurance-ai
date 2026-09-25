export enum UserRole {
  CUSTOMER = "customer",
  SERVICE_CENTER = "service_center",
  ADMIN = "admin",
}

export enum AccountStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface ServiceCenterProfile {
  serviceCenterName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  address: string;
  registrationNumber: string;
  supportingDocumentName?: string;
  supportingDocumentUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  serviceCenterProfile?: ServiceCenterProfile;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  serviceCenterName?: string;
}

export interface AuthSession {
  user: SessionUser;
  expiresAt: number; // Unix timestamp in ms
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CustomerRegistrationInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ServiceCenterRegistrationInput {
  serviceCenterName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  address: string;
  registrationNumber: string;
  supportingDocumentName?: string;
  supportingDocumentData?: string; // base64 or mock file reference
  password: string;
}

export interface ServiceCenterReviewInput {
  userId: string;
  status: AccountStatus.APPROVED | AccountStatus.REJECTED;
  rejectionReason?: string;
}
