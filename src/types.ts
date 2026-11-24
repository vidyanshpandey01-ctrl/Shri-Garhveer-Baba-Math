export enum TabId {
  Feed = 'feed',
  Membership = 'membership',
  IdCard = 'id-card',
  Donation = 'donation',
  Admin = 'admin',
}

export enum MemberStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum PostCategory {
  Announcement = 'Announcement',
  Satsang = 'Satsang',
  Seva = 'Seva',
  Community = 'Community',
}

export enum DonationPurpose {
  Annakshetra = 'Annakshetra & Prasad Seva',
  Renovation = 'Mandir Renovation & Upkeep',
  GauSeva = 'Gau Seva',
  General = 'General Math Seva',
}

export enum DonationStatus {
  PendingVerification = 'Pending Verification',
  Verified = 'Verified',
  Flagged = 'Flagged',
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  gotra: string;
  phone: string;
  address: string;
  city: string;
  role: string;
  status: MemberStatus;
  createdAt: string;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorCity?: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorGotra?: string;
  authorCity?: string;
  category: PostCategory;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  pinned?: boolean;
  comments: PostComment[];
  createdAt: string;
}

export interface Donation {
  id: string;
  receiptNumber: string;
  donorName: string;
  phone: string;
  amount: number;
  purpose: DonationPurpose;
  utrReference: string;
  status: DonationStatus;
  createdAt: string;
}

export interface MathEvent {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
}

export enum AdminRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
}

export interface AdminRecord {
  phone: string;
  name: string;
  role: AdminRole;
  addedAt: string;
  addedBy?: string;
}

export interface AuthSessionUser {
  phone: string;
  isAuthorizedAdmin: boolean;
  adminRole: AdminRole | null;
  adminPinConfigured: boolean;
  adminVerified: boolean;
}

export interface MathBootstrapData {
  posts: Post[];
  members: Member[];
  donations: Donation[];
  events: MathEvent[];
  admins?: AdminRecord[];
}
