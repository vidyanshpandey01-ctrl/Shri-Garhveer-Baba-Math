import {
  Donation,
  DonationPurpose,
  DonationStatus,
  Member,
  MemberStatus,
  Post,
  PostCategory,
} from '../types';

export interface MembershipFormInput {
  name: string;
  gotra: string;
  phone: string;
  address: string;
  city: string;
  role?: string;
}

export interface DonationFormInput {
  donorName: string;
  phone: string;
  amount: number;
  purpose: DonationPurpose;
  utrReference: string;
}

export interface PostFormInput {
  authorName: string;
  title: string;
  content: string;
  category: PostCategory;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

export function validateIndianMobile(phone: string): string | null {
  const clean = normalizePhone(phone);
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }
  return null;
}

export function validateOtpCode(otp: string): string | null {
  const clean = otp.trim();
  if (!/^\d{6}$/.test(clean)) {
    return 'Enter the 6-digit numeric OTP.';
  }
  return null;
}

export function validateAdminPinFormat(pin: string): string | null {
  const clean = pin.trim();
  if (!/^\d{4,8}$/.test(clean)) {
    return 'Secret Admin PIN must be 4 to 8 digits.';
  }
  return null;
}

export function maskPhone(phone: string): string {
  const clean = normalizePhone(phone);
  if (clean.length !== 10) return phone;
  return `••••••${clean.slice(-4)}`;
}

export function validateMembershipInput(input: MembershipFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  const name = input.name.trim();
  const gotra = input.gotra.trim();
  const phoneDigits = normalizePhone(input.phone);
  const address = input.address.trim();
  const city = input.city.trim();

  if (name.length < 2) {
    errors.name = 'Please enter full name (at least 2 characters).';
  }
  if (gotra.length < 2) {
    errors.gotra = 'Please enter Gotra.';
  }
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (address.length < 5) {
    errors.address = 'Please enter full residential address.';
  }
  if (city.length < 2) {
    errors.city = 'Please enter city or village name.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDonationInput(input: DonationFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (input.donorName.trim().length < 2) {
    errors.donorName = 'Please enter donor full name.';
  }

  const phoneDigits = normalizePhone(input.phone);
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }

  if (!Number.isFinite(input.amount) || input.amount < 11 || input.amount > 1000000) {
    errors.amount = 'Enter a valid donation amount between ₹11 and ₹10,00,000.';
  }

  const utr = input.utrReference.trim().toUpperCase();
  if (!/^[A-Z0-9]{8,24}$/.test(utr)) {
    errors.utrReference = 'Enter a valid 8–24 character UPI / UTR reference number.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePostInput(input: PostFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (input.authorName.trim().length < 2) {
    errors.authorName = 'Author name is required.';
  }
  if (input.title.trim().length < 3) {
    errors.title = 'Please enter a brief headline (min 3 characters).';
  }
  if (input.content.trim().length < 8) {
    errors.content = 'Please write at least 8 characters for the update.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatMemberId(sequence: number, year = 2026): string {
  const safeSeq = Math.max(1, Math.floor(sequence));
  return `SGBM-${year}-${String(safeSeq).padStart(4, '0')}`;
}

export function formatReceiptNumber(sequence: number, year = 2026): string {
  const safeSeq = Math.max(1, Math.floor(sequence));
  return `SEVA-${year}-${String(safeSeq).padStart(4, '0')}`;
}

export function buildUpiUri(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  note: string;
}): string {
  const safeAmount = Math.max(1, Math.round(params.amount));
  const query = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: String(safeAmount),
    cu: 'INR',
    tn: params.note,
  });
  return `upi://pay?${query.toString()}`;
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(isoDate: string, nowMs = Date.now()): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return 'Recently';
  }
  const diffSeconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface AdminSummary {
  totalMembers: number;
  pendingMembers: number;
  approvedMembers: number;
  totalPosts: number;
  totalDonationsCount: number;
  verifiedDonationAmount: number;
  pendingDonationAmount: number;
}

export function computeAdminSummary(
  members: Member[],
  posts: Post[],
  donations: Donation[],
): AdminSummary {
  const pendingMembers = members.filter((m) => m.status === MemberStatus.Pending).length;
  const approvedMembers = members.filter((m) => m.status === MemberStatus.Approved).length;
  const verifiedDonationAmount = donations
    .filter((d) => d.status === DonationStatus.Verified)
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingDonationAmount = donations
    .filter((d) => d.status === DonationStatus.PendingVerification)
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    totalMembers: members.length,
    pendingMembers,
    approvedMembers,
    totalPosts: posts.length,
    totalDonationsCount: donations.length,
    verifiedDonationAmount,
    pendingDonationAmount,
  };
}

/**
 * Generates a deterministic 25x25 QR-style matrix with genuine 7x7 corner finder
 * patterns, separator borders, timing strips, and deterministic payload modules.
 */
export function generateQrMatrix(payload: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = startRow + r;
        const cc = startCol + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[rr][cc] = false;
        } else if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[rr][cc] = true;
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    matrix[6][i] = i % 2 === 0;
    reserved[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern near bottom-right for 25x25
  if (size >= 25) {
    const ar = size - 9;
    const ac = size - 9;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        reserved[ar + r][ac + c] = true;
        matrix[ar + r][ac + c] =
          r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
      }
    }
  }

  // Deterministic PRNG seeded by payload
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      hash ^= (r * 31 + c * 17 + 7) >>> 0;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = ((hash >>> 3) & 1) === 1;
    }
  }

  return matrix;
}
