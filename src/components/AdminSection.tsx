import { FormEvent, useMemo, useState } from 'react';
import {
  Check,
  Pin,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import {
  AdminRecord,
  AdminRole,
  AuthSessionUser,
  Donation,
  DonationStatus,
  Member,
  MemberStatus,
  Post,
} from '../types';
import {
  computeAdminSummary,
  formatCurrencyINR,
  formatRelativeTime,
  validateIndianMobile,
} from '../utils/mathLogic';

interface AdminSectionProps {
  authUser: AuthSessionUser;
  members: Member[];
  posts: Post[];
  donations: Donation[];
  admins: AdminRecord[];
  onUpdateMemberStatus: (memberId: string, status: MemberStatus) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  onTogglePinPost: (postId: string, pinned: boolean) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onUpdateDonationStatus: (donationId: string, status: DonationStatus) => Promise<void>;
  onGrantAdmin: (phone: string, name?: string) => Promise<void>;
  onRevokeAdmin: (phone: string) => Promise<void>;
  onExitAdminView: () => void;
}

type AdminTab = 'members' | 'posts' | 'donations' | 'admins';

export function AdminSection({
  authUser,
  members,
  posts,
  donations,
  admins,
  onUpdateMemberStatus,
  onDeleteMember,
  onTogglePinPost,
  onDeletePost,
  onUpdateDonationStatus,
  onGrantAdmin,
  onRevokeAdmin,
  onExitAdminView,
}: AdminSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('members');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [grantingAdmin, setGrantingAdmin] = useState(false);

  const isSuperAdmin = authUser.adminRole === AdminRole.SuperAdmin;

  const summary = useMemo(
    () => computeAdminSummary(members, posts, donations),
    [members, posts, donations],
  );

  const runAdminAction = async (fn: () => Promise<void>, successText: string) => {
    setActionError(null);
    setActionMessage(null);
    try {
      await fn();
      setActionMessage(successText);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Admin action failed.');
    }
  };

  const handleGrantAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateIndianMobile(newAdminPhone);
    if (err) {
      setActionError(err);
      return;
    }
    setActionError(null);
    setActionMessage(null);
    setGrantingAdmin(true);
    try {
      await onGrantAdmin(newAdminPhone.trim(), newAdminName.trim() || undefined);
      setActionMessage(`Granted Admin access to +91 ${newAdminPhone.trim()}.`);
      setNewAdminPhone('');
      setNewAdminName('');
    } catch (e2) {
      setActionError(e2 instanceof Error ? e2.message : 'Unable to grant Admin access.');
    } finally {
      setGrantingAdmin(false);
    }
  };

  const adminPhoneSet = useMemo(() => new Set(admins.map((a) => a.phone)), [admins]);

  return (
    <div className="space-y-5">
      {/* Top Admin Header */}
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#15803D] shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-[#1E1B18]">Admin Control Dashboard</h2>
            <p className="text-xs text-[#645D55]">
              Signed in as {authUser.adminRole} (+91 {authUser.phone}) · Manage members,
              posts, donations{isSuperAdmin ? ', and admin roles' : ''}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitAdminView}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-sm font-medium text-[#1E1B18] shrink-0 cursor-pointer"
        >
          Back to Feed
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4">
          <p className="text-xs text-[#645D55]">Pending Members</p>
          <p className="text-2xl font-bold text-[#B45309] tabular-nums mt-1">
            {summary.pendingMembers}
          </p>
          <p className="text-xs text-[#645D55] tabular-nums mt-0.5">
            {summary.approvedMembers} approved total
          </p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4">
          <p className="text-xs text-[#645D55]">Verified Seva Funds</p>
          <p className="text-2xl font-bold text-[#15803D] tabular-nums mt-1">
            {formatCurrencyINR(summary.verifiedDonationAmount)}
          </p>
          <p className="text-xs text-[#645D55] tabular-nums mt-0.5">
            {summary.totalDonationsCount} receipts logged
          </p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4">
          <p className="text-xs text-[#645D55]">Pending UTR Review</p>
          <p className="text-2xl font-bold text-[#1E1B18] tabular-nums mt-1">
            {formatCurrencyINR(summary.pendingDonationAmount)}
          </p>
          <p className="text-xs text-[#645D55] mt-0.5">Awaiting bank match</p>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4">
          <p className="text-xs text-[#645D55]">Community Posts</p>
          <p className="text-2xl font-bold text-[#1E1B18] tabular-nums mt-1">
            {summary.totalPosts}
          </p>
          <p className="text-xs text-[#645D55] mt-0.5">Active on Kutumb wall</p>
        </div>
      </div>

      {actionMessage && (
        <p role="status" className="text-sm text-[#15803D] font-medium px-1">
          {actionMessage}
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-[#B91C1C] font-medium px-1">
          {actionError}
        </p>
      )}

      {/* Admin Sub-Navigation Tabs */}
      <div
        className="flex items-center gap-1 p-1 bg-[#EFECE5] rounded-xl overflow-x-auto"
        role="tablist"
        aria-label="Admin sections"
      >
        {(
          [
            { id: 'members', label: `Members (${members.length})` },
            { id: 'posts', label: `Feed Posts (${posts.length})` },
            { id: 'donations', label: `Donations (${donations.length})` },
            ...(isSuperAdmin
              ? ([{ id: 'admins', label: `Manage Admins (${admins.length})` }] as const)
              : []),
          ] as const
        ).map((tab) => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                active ? 'bg-white text-[#1E1B18] shadow-xs' : 'text-[#645D55] hover:text-[#1E1B18]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Membership Requests */}
      {activeSubTab === 'members' && (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#F1EDE4]">
          {members.length === 0 ? (
            <p className="p-6 text-sm text-[#645D55]">No member applications found.</p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1E1B18]">{member.name}</span>
                    <span className="font-mono text-xs text-[#645D55]">
                      {member.memberCode}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        member.status === MemberStatus.Approved
                          ? 'text-[#15803D]'
                          : member.status === MemberStatus.Rejected
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                      }`}
                    >
                      · {member.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#645D55]">
                    {member.gotra} Gotra · +91 {member.phone} · {member.city} · {member.role}
                  </p>
                  <p className="text-xs text-[#645D55]">{member.address}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {member.status !== MemberStatus.Approved && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAdminAction(
                          () => onUpdateMemberStatus(member.id, MemberStatus.Approved),
                          `Approved ${member.name} (${member.memberCode}).`,
                        )
                      }
                      aria-label={`Approve ${member.name}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {member.status !== MemberStatus.Rejected && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAdminAction(
                          () => onUpdateMemberStatus(member.id, MemberStatus.Rejected),
                          `Marked ${member.name} as Rejected.`,
                        )
                      }
                      aria-label={`Reject ${member.name}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF9F6] text-[#B91C1C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      void runAdminAction(
                        () => onDeleteMember(member.id),
                        `Removed member record for ${member.name}.`,
                      )
                    }
                    aria-label={`Delete ${member.name}`}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-[#E6E2DA] hover:bg-red-50 text-[#645D55] hover:text-[#B91C1C] inline-flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Feed Moderation */}
      {activeSubTab === 'posts' && (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#F1EDE4]">
          {posts.length === 0 ? (
            <p className="p-6 text-sm text-[#645D55]">No community posts to moderate.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-[#1E1B18] truncate">{post.title}</p>
                  <p className="text-xs text-[#645D55]">
                    {post.authorName} · {post.category} · {post.likes} Likes ·{' '}
                    {post.comments.length} Comments · {formatRelativeTime(post.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      void runAdminAction(
                        () => onTogglePinPost(post.id, !post.pinned),
                        post.pinned ? `Unpinned "${post.title}".` : `Pinned "${post.title}".`,
                      )
                    }
                    aria-label={`${post.pinned ? 'Unpin' : 'Pin'} ${post.title}`}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      post.pinned
                        ? 'bg-orange-50 border-orange-200 text-[#C2410C]'
                        : 'border-[#E6E2DA] text-[#1E1B18] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{post.pinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void runAdminAction(
                        () => onDeletePost(post.id),
                        `Deleted post "${post.title}".`,
                      )
                    }
                    aria-label={`Delete post ${post.title}`}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E6E2DA] hover:bg-red-50 text-[#B91C1C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Donation Ledger */}
      {activeSubTab === 'donations' && (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#F1EDE4]">
          {donations.length === 0 ? (
            <p className="p-6 text-sm text-[#645D55]">No donation records yet.</p>
          ) : (
            donations.map((don) => (
              <div
                key={don.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1E1B18]">{don.donorName}</span>
                    <span className="font-bold text-[#1E1B18] tabular-nums">
                      · {formatCurrencyINR(don.amount)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        don.status === DonationStatus.Verified
                          ? 'text-[#15803D]'
                          : don.status === DonationStatus.Flagged
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                      }`}
                    >
                      · {don.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#645D55]">
                    {don.purpose} · UTR <span className="font-mono">{don.utrReference}</span> ·{' '}
                    {don.receiptNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {don.status !== DonationStatus.Verified && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAdminAction(
                          () => onUpdateDonationStatus(don.id, DonationStatus.Verified),
                          `Verified receipt ${don.receiptNumber}.`,
                        )
                      }
                      aria-label={`Verify donation ${don.receiptNumber}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify UTR</span>
                    </button>
                  )}

                  {don.status !== DonationStatus.Flagged && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAdminAction(
                          () => onUpdateDonationStatus(don.id, DonationStatus.Flagged),
                          `Flagged receipt ${don.receiptNumber} for review.`,
                        )
                      }
                      aria-label={`Flag donation ${don.receiptNumber}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E6E2DA] hover:bg-red-50 text-[#B91C1C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Flag</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Manage Admins (Super Admin Only) */}
      {activeSubTab === 'admins' && isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Grant Admin Form & Current Admins List */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#1E1B18]">
                  Grant Admin Privileges by Mobile Number
                </h3>
                <p className="text-xs text-[#645D55] mt-0.5">
                  Authorized admins can log in with their mobile OTP + Secret Admin PIN to
                  access this dashboard.
                </p>
              </div>

              <form onSubmit={handleGrantAdminSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new-admin-phone"
                      className="block text-xs font-medium text-[#1E1B18] mb-1"
                    >
                      10-Digit Mobile Number *
                    </label>
                    <input
                      id="new-admin-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="e.g. 9829011223"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-mono focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-admin-name"
                      className="block text-xs font-medium text-[#1E1B18] mb-1"
                    >
                      Admin Label / Name (Optional)
                    </label>
                    <input
                      id="new-admin-name"
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Auto-filled if registered"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={grantingAdmin}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{grantingAdmin ? 'Granting...' : 'Grant Admin Access'}</span>
                </button>
              </form>
            </div>

            <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#F1EDE4]">
              <div className="px-5 py-3.5">
                <h3 className="text-sm font-bold text-[#1E1B18]">Authorized Admins</h3>
              </div>
              {admins.map((admin) => (
                <div
                  key={admin.phone}
                  className="p-4 sm:px-5 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#1E1B18]">
                      {admin.name}{' '}
                      <span className="font-normal text-xs text-[#B45309]">
                        · {admin.role === AdminRole.SuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </p>
                    <p className="font-mono text-xs text-[#645D55]">+91 {admin.phone}</p>
                  </div>

                  {admin.role !== AdminRole.SuperAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAdminAction(
                          () => onRevokeAdmin(admin.phone),
                          `Revoked Admin privileges for +91 ${admin.phone}.`,
                        )
                      }
                      aria-label={`Revoke Admin ${admin.phone}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E6E2DA] hover:bg-red-50 text-[#B91C1C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quick Promote from Registered Members */}
          <div className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="text-base font-bold text-[#1E1B18]">
                Promote Registered Members
              </h3>
              <p className="text-xs text-[#645D55] mt-0.5">
                Select any registered member to grant or revoke Secret PIN admin access.
              </p>
            </div>

            <ul className="divide-y divide-[#F1EDE4]">
              {members.map((member) => {
                const isAdmin = adminPhoneSet.has(member.phone);
                const isSuper =
                  admins.find((a) => a.phone === member.phone)?.role ===
                  AdminRole.SuperAdmin;

                return (
                  <li
                    key={member.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E1B18] truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-[#645D55] font-mono">
                        +91 {member.phone} · {member.city}
                      </p>
                    </div>

                    {isSuper ? (
                      <span className="text-xs font-semibold text-[#B45309] shrink-0">
                        Super Admin
                      </span>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runAdminAction(
                            () => onRevokeAdmin(member.phone),
                            `Revoked Admin privileges for ${member.name}.`,
                          )
                        }
                        aria-label={`Revoke Admin for ${member.name}`}
                        className="min-h-[38px] px-3 py-1 rounded-xl border border-[#E6E2DA] hover:bg-red-50 text-[#B91C1C] text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Revoke Admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void runAdminAction(
                            () => onGrantAdmin(member.phone, member.name),
                            `Promoted ${member.name} to Admin.`,
                          )
                        }
                        aria-label={`Promote ${member.name} to Admin`}
                        className="min-h-[38px] px-3 py-1 rounded-xl bg-[#1E1B18] hover:bg-[#332E29] text-white text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Promote
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
