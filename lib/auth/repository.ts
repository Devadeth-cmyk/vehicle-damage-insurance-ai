import { User, UserRole, AccountStatus, CustomerRegistrationInput, ServiceCenterRegistrationInput } from "@/types/auth";
import { hashPassword } from "./password";

/**
 * UserRepository interface.
 * Abstracts user data access so real databases (PostgreSQL, Supabase, MongoDB, Prisma)
 * can be plugged in seamlessly without changing auth logic.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createCustomer(input: CustomerRegistrationInput): Promise<User>;
  createServiceCenterRequest(input: ServiceCenterRegistrationInput): Promise<User>;
  updateServiceCenterStatus(
    userId: string,
    status: AccountStatus.APPROVED | AccountStatus.REJECTED,
    adminId: string,
    rejectionReason?: string
  ): Promise<User | null>;
  listServiceCenters(statusFilter?: AccountStatus): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
}

// Global in-memory storage holding seeded and newly registered users
// (Using global to persist across hot reloads in Next.js dev server)
const globalForUsers = global as unknown as {
  __autoinsight_users_db?: Map<string, User>;
};

function initializeSeedUsers(): Map<string, User> {
  const users = new Map<string, User>();

  // 1. Admin account: admin@autoinsight.com / Admin123!
  const adminPwd = hashPassword("Admin123!");
  const adminUser: User = {
    id: "usr_admin_001",
    name: "System Administrator",
    email: "admin@autoinsight.com",
    passwordHash: adminPwd.hash,
    passwordSalt: adminPwd.salt,
    role: UserRole.ADMIN,
    status: AccountStatus.APPROVED,
    createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  };
  users.set(adminUser.email.toLowerCase(), adminUser);

  // 2. Approved Service Center: approved@service.com / Service123!
  const approvedScPwd = hashPassword("Service123!");
  const approvedScUser: User = {
    id: "usr_sc_approved_001",
    name: "Apex Auto Care - Downtown",
    email: "approved@service.com",
    passwordHash: approvedScPwd.hash,
    passwordSalt: approvedScPwd.salt,
    role: UserRole.SERVICE_CENTER,
    status: AccountStatus.APPROVED,
    createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-01-12T14:30:00Z").toISOString(),
    serviceCenterProfile: {
      serviceCenterName: "Apex Auto Care - Downtown",
      contactPerson: "Robert Sterling",
      businessEmail: "approved@service.com",
      phone: "+1 (555) 234-5678",
      address: "100 Industrial Parkway, Metro City, CA 90210",
      registrationNumber: "CA-REG-2024-8891",
      supportingDocumentName: "business_license_apex_2026.pdf",
      supportingDocumentUrl: "/docs/sample-license.pdf",
      reviewedBy: "usr_admin_001",
      reviewedAt: new Date("2026-01-12T14:30:00Z").toISOString(),
    },
  };
  users.set(approvedScUser.email.toLowerCase(), approvedScUser);

  // 3. Pending Service Center: pending@service.com / Service123!
  const pendingScPwd = hashPassword("Service123!");
  const pendingScUser: User = {
    id: "usr_sc_pending_001",
    name: "Precision Body & Paint",
    email: "pending@service.com",
    passwordHash: pendingScPwd.hash,
    passwordSalt: pendingScPwd.salt,
    role: UserRole.SERVICE_CENTER,
    status: AccountStatus.PENDING,
    createdAt: new Date("2026-09-17T09:15:00Z").toISOString(),
    updatedAt: new Date("2026-09-17T09:15:00Z").toISOString(),
    serviceCenterProfile: {
      serviceCenterName: "Precision Body & Paint",
      contactPerson: "Marcus Vance",
      businessEmail: "pending@service.com",
      phone: "+1 (555) 987-6543",
      address: "450 Auto Mall Boulevard, Suite 12, West Valley, NV 89101",
      registrationNumber: "NV-AUTO-44029",
      supportingDocumentName: "precision_garage_certification.pdf",
      supportingDocumentUrl: "/docs/sample-cert.pdf",
    },
  };
  users.set(pendingScUser.email.toLowerCase(), pendingScUser);

  // 4. Rejected Service Center: rejected@service.com / Service123!
  const rejectedScPwd = hashPassword("Service123!");
  const rejectedScUser: User = {
    id: "usr_sc_rejected_001",
    name: "QuickFix Garage",
    email: "rejected@service.com",
    passwordHash: rejectedScPwd.hash,
    passwordSalt: rejectedScPwd.salt,
    role: UserRole.SERVICE_CENTER,
    status: AccountStatus.REJECTED,
    createdAt: new Date("2026-08-01T11:00:00Z").toISOString(),
    updatedAt: new Date("2026-08-03T16:00:00Z").toISOString(),
    serviceCenterProfile: {
      serviceCenterName: "QuickFix Garage",
      contactPerson: "Dave Miller",
      businessEmail: "rejected@service.com",
      phone: "+1 (555) 321-7654",
      address: "77 Side St, Harbor View, OR 97201",
      registrationNumber: "OR-UNV-0021",
      supportingDocumentName: "expired_insurance_proof.pdf",
      supportingDocumentUrl: "/docs/sample-doc.pdf",
      reviewedBy: "usr_admin_001",
      reviewedAt: new Date("2026-08-03T16:00:00Z").toISOString(),
      rejectionReason: "Supporting business license is expired. Please re-apply with current valid certification.",
    },
  };
  users.set(rejectedScUser.email.toLowerCase(), rejectedScUser);

  // 5. Customer account: customer@autoinsight.com / Customer123!
  const customerPwd = hashPassword("Customer123!");
  const customerUser: User = {
    id: "usr_cust_001",
    name: "Jane Doe",
    email: "customer@autoinsight.com",
    passwordHash: customerPwd.hash,
    passwordSalt: customerPwd.salt,
    role: UserRole.CUSTOMER,
    status: AccountStatus.APPROVED,
    createdAt: new Date("2026-02-01T08:00:00Z").toISOString(),
    updatedAt: new Date("2026-02-01T08:00:00Z").toISOString(),
  };
  users.set(customerUser.email.toLowerCase(), customerUser);

  return users;
}

const usersDb: Map<string, User> = globalForUsers.__autoinsight_users_db || initializeSeedUsers();
if (process.env.NODE_ENV !== "production") {
  globalForUsers.__autoinsight_users_db = usersDb;
}

export class InMemoryUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const user = usersDb.get(normalized);
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<User | null> {
    for (const user of usersDb.values()) {
      if (user.id === id) {
        return { ...user };
      }
    }
    return null;
  }

  async createCustomer(input: CustomerRegistrationInput): Promise<User> {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (usersDb.has(normalizedEmail)) {
      throw new Error("An account with this email already exists");
    }

    const { hash, salt } = hashPassword(input.password);
    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: UserRole.CUSTOMER,
      status: AccountStatus.APPROVED, // Customer accounts are approved upon registration
      createdAt: now,
      updatedAt: now,
    };

    usersDb.set(normalizedEmail, newUser);
    return { ...newUser };
  }

  async createServiceCenterRequest(input: ServiceCenterRegistrationInput): Promise<User> {
    const normalizedEmail = input.businessEmail.trim().toLowerCase();
    if (usersDb.has(normalizedEmail)) {
      throw new Error("An account with this business email already exists");
    }

    const { hash, salt } = hashPassword(input.password);
    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.serviceCenterName.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role: UserRole.SERVICE_CENTER,
      status: AccountStatus.PENDING, // Strictly pending until admin approval
      createdAt: now,
      updatedAt: now,
      serviceCenterProfile: {
        serviceCenterName: input.serviceCenterName.trim(),
        contactPerson: input.contactPerson.trim(),
        businessEmail: normalizedEmail,
        phone: input.phone.trim(),
        address: input.address.trim(),
        registrationNumber: input.registrationNumber.trim(),
        supportingDocumentName: input.supportingDocumentName || "submitted_document.pdf",
        supportingDocumentUrl: input.supportingDocumentData || undefined,
      },
    };

    usersDb.set(normalizedEmail, newUser);
    return { ...newUser };
  }

  async updateServiceCenterStatus(
    userId: string,
    status: AccountStatus.APPROVED | AccountStatus.REJECTED,
    adminId: string,
    rejectionReason?: string
  ): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user || user.role !== UserRole.SERVICE_CENTER) {
      throw new Error("Service center account not found");
    }

    const now = new Date().toISOString();
    user.status = status;
    user.updatedAt = now;

    if (user.serviceCenterProfile) {
      user.serviceCenterProfile.reviewedBy = adminId;
      user.serviceCenterProfile.reviewedAt = now;
      if (status === AccountStatus.REJECTED && rejectionReason) {
        user.serviceCenterProfile.rejectionReason = rejectionReason;
      } else if (status === AccountStatus.APPROVED) {
        user.serviceCenterProfile.rejectionReason = undefined;
      }
    }

    usersDb.set(user.email.toLowerCase(), user);
    return { ...user };
  }

  async listServiceCenters(statusFilter?: AccountStatus): Promise<User[]> {
    const list: User[] = [];
    for (const user of usersDb.values()) {
      if (user.role === UserRole.SERVICE_CENTER) {
        if (!statusFilter || user.status === statusFilter) {
          list.push({ ...user });
        }
      }
    }
    // Sort latest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(usersDb.values()).map((u) => ({ ...u }));
  }
}

// Default repository singleton instance
export const userRepository = new InMemoryUserRepository();
