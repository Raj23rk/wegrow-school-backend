import bcrypt from 'bcryptjs';
import { AdminUserModel } from '../models/AdminUser.js';
import { isMongoConnected } from '../db/mongo.js';

export interface AdminCredential {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  password: string;
  passwordHash: string;
  role: 'admin';
  department: string;
  avatar?: string;
  phone?: string;
}

// 23 Institutional Admin & Faculty Credentials configured for WeGrow
export const RAW_ADMIN_CREDENTIALS = [
  { email: 'vijay909232@gmail.com', employeeId: 'WG-EMP-023', password: 'Vijay@2004', name: 'Vijay' },
  { email: 'www.shiekabdulla78@gmail.com', employeeId: 'WG-EMP-022', password: 'WG@Shi5#Qx72', name: 'Shiek Abdulla' },
  { email: 'dr.thavabalan@gmail.com', employeeId: 'WG26001', password: 'WG@Tha7!Nx58', name: 'Dr. Thavabalan' },
  { email: 'lakshmipriya@psr.edu.in', employeeId: 'WG26002', password: 'WG@Lak5$Rt39', name: 'Lakshmipriya (PSR)' },
  { email: 'ak45ashokkumar@gmail.com', employeeId: 'WG-ADMIN-05', password: 'WG@Aka5#Rx93', name: 'Ashok Kumar' },
  { email: 'srisaigopi31@gmail.com', employeeId: 'WG-ADMIN-06', password: '12345678', name: 'Sri Sai Gopi' },
  { email: 'kumarrk23dev@gmail.com', employeeId: 'WG-ADMIN-07', password: 'Raj@2310', name: 'Kumar RK' },
  { email: 'mkrv0617@gmail.com', employeeId: 'WG-ADMIN-08', password: 'MkRv@0617', name: 'M. K. R. Vignesh' },
  { email: 'lakshmipriya.srbe@gmail.com', employeeId: 'WG-ADMIN-09', password: 'WG@Lak4!Qz71', name: 'Lakshmipriya S' },
  { email: 'muthuselvip04@gmail.com', employeeId: 'WG-ADMIN-10', password: 'WG@Mut9$Kr26', name: 'Muthuselvi P' },
  { email: 'sgssubhashini@gmail.com', employeeId: 'WG-ADMIN-11', password: 'WG@Sgs5#Wp84', name: 'Subhashini S' },
  { email: 'devisudalai2003@gmail.com', employeeId: 'WG-ADMIN-12', password: 'WG@Dev8!Mx39', name: 'Devi Sudalai' },
  { email: 'jsmareeswaran47@gmail.com', employeeId: 'WG-ADMIN-13', password: 'WG@Jsm3$Qn67', name: 'Mareeswaran J' },
  { email: 'mfvat.vicky@gmail.com', employeeId: 'WG-ADMIN-14', password: 'WG@Mfv7#Rt42', name: 'Vicky (MFVAT)' },
  { email: 'geethagurumoorthy93@gmail.com', employeeId: 'WG-ADMIN-15', password: 'WG@Gee6!Xp58', name: 'Geetha Gurumoorthy' },
  { email: 'umarajofficial@gmail.com', employeeId: 'WG-ADMIN-16', password: 'WG@Uma8#Lp47', name: 'Uma Raj' },
  { email: 'sujac1991@gmail.com', employeeId: 'WG-ADMIN-17', password: 'WG@Suj4!Nx82', name: 'Suja C' },
  { email: 'navenn919@gmail.com', employeeId: 'WG-ADMIN-18', password: 'WG@Nav6$Qr31', name: 'Naveen Kumar' },
  { email: 'prabhu1996prabha@gmail.com', employeeId: 'WG-ADMIN-19', password: 'WG@Pra9#Tk54', name: 'Prabhu P' },
  { email: 'nandhakumar19052005@gmail.com', employeeId: 'WG-ADMIN-20', password: 'WG@Nan3!Vz76', name: 'Nandha Kumar' },
  { email: 'pandiselvam.pps@gmail.com', employeeId: 'WG-ADMIN-21', password: 'selvaoct10', name: 'Pandiselvam P' },
  { email: 'ajithkumar.bba.anjac@gmail.com', employeeId: 'WG-ADMIN-22', password: 'WG@Aji4#Qx82', name: 'Ajith Kumar' },
  { email: 'euginrahul@gmail.com', employeeId: 'WG-EMP-024', password: 'WG@Eug4#Rx82', name: 'Eugin Rahul' },
  // Master Campus Administrator
  { email: 'admin@wegrow.edu', employeeId: 'WG-ADMIN-01', password: 'admin123', name: 'Campus Director' },
];

export const ADMIN_USERS: AdminCredential[] = RAW_ADMIN_CREDENTIALS.map((u, idx) => ({
  id: `adm_${(idx + 1).toString().padStart(3, '0')}`,
  name: u.name,
  email: u.email.trim().toLowerCase(),
  employeeId: (u.employeeId || `WG-ADMIN-${String(idx + 1).padStart(2, '0')}`).trim().toUpperCase(),
  password: u.password,
  passwordHash: bcrypt.hashSync(u.password, 8),
  role: 'admin',
  department: 'Administration & Faculty Lead',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  phone: '+91 98765 00001',
}));

// Find admin user by email, employee ID, or username
export async function findAdminUser(identifier: string): Promise<AdminCredential | undefined> {
  const clean = (identifier || '').trim().toLowerCase();
  if (!clean) return undefined;

  // 1. Direct master admin alias
  if (clean === 'admin' || clean === 'admin@wegrow.edu' || clean === 'admin@edupulse.edu') {
    return ADMIN_USERS.find((a) => a.email === 'admin@wegrow.edu') || ADMIN_USERS[0];
  }

  // 2. Search in preloaded memory array
  const memoryMatch = ADMIN_USERS.find(
    (a) =>
      a.email.toLowerCase() === clean ||
      a.employeeId.toLowerCase() === clean
  );
  if (memoryMatch) return memoryMatch;

  // 3. Search in MongoDB AdminUser collection if connected
  if (isMongoConnected()) {
    try {
      const dbAdmin = await AdminUserModel.findOne({
        $or: [
          { email: clean },
          { employeeId: clean.toUpperCase() },
        ],
      });
      if (dbAdmin) {
        return {
          id: dbAdmin._id.toString(),
          name: dbAdmin.name,
          email: dbAdmin.email,
          employeeId: dbAdmin.employeeId,
          password: '',
          passwordHash: dbAdmin.passwordHash,
          role: 'admin',
          department: dbAdmin.department || 'Campus Administration',
          avatar: dbAdmin.avatar,
          phone: dbAdmin.phone,
        };
      }
    } catch (e) {
      console.warn('[AdminAuth] Error checking Mongo AdminUser:', e);
    }
  }

  return undefined;
}

// Password verification helper for admin accounts
export function verifyAdminPassword(admin: { password?: string; passwordHash?: string; email: string }, candidate: string): boolean {
  if (!admin || !candidate) return false;
  const cleanCandidate = candidate.trim();

  // Master fallback
  if (admin.email === 'admin@wegrow.edu' && (cleanCandidate === 'admin123' || cleanCandidate === 'admin')) {
    return true;
  }
  // Plaintext direct match
  if (admin.password && admin.password === cleanCandidate) {
    return true;
  }
  // Bcrypt hash match
  if (admin.passwordHash) {
    try {
      if (bcrypt.compareSync(cleanCandidate, admin.passwordHash)) {
        return true;
      }
    } catch {}
  }
  return false;
}

// Format Admin object compatible with Student schema used across frontend
export function toAdminResponseUser(admin: any) {
  const adminId = admin.id || admin._id || 'admin_user';
  return {
    id: adminId,
    _id: adminId,
    name: admin.name || 'Campus Administrator',
    email: admin.email,
    rollNumber: admin.employeeId || 'WG-ADMIN',
    role: 'admin' as const,
    grade: admin.department || 'Administration & Faculty Lead',
    section: 'WeGrow Sivakasi Campus',
    avatar: admin.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    phone: admin.phone || '+91 98765 00001',
    address: 'Administrative Block, WeGrow Skill Campus, Sivakasi, Tamil Nadu',
    parentName: 'Board of Trustees',
    parentEmail: admin.email,
    parentWhatsApp: admin.phone || '+919876543210',
    totalFees: 0,
    paidFees: 0,
    dueFees: 0,
  };
}

// Sync all 23 Institutional Admin users into MongoDB AdminUser collection
export async function syncAdminUsersToDatabase(): Promise<void> {
  if (!isMongoConnected()) {
    console.log(`[AdminAuth] MongoDB offline; all ${ADMIN_USERS.length} institutional admin accounts ready in-memory.`);
    return;
  }

  try {
    for (const admin of ADMIN_USERS) {
      await AdminUserModel.findOneAndUpdate(
        { email: admin.email },
        {
          $set: {
            name: admin.name,
            email: admin.email,
            employeeId: admin.employeeId,
            passwordHash: admin.passwordHash,
            role: 'admin',
            department: admin.department,
            avatar: admin.avatar,
            phone: admin.phone,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[AdminAuth] Successfully synchronized ${ADMIN_USERS.length} Admin users into MongoDB.`);
  } catch (err: any) {
    console.warn('[AdminAuth] MongoDB synchronization warning:', err.message);
  }
}
