import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  CreditCard,
  HeartHandshake,
  Home,
  KeyRound,
  Languages,
  LogOut,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { AdminSection } from './components/AdminSection';
import { AuthScreen } from './components/AuthScreen';
import { DonationSection } from './components/DonationSection';
import { FeedSection } from './components/FeedSection';
import { IdCardSection } from './components/IdCardSection';
import { MembershipSection } from './components/MembershipSection';
import {
  AdminRecord,
  AuthSessionUser,
  Donation,
  DonationPurpose,
  DonationStatus,
  MathEvent,
  Member,
  MemberStatus,
  Post,
  PostCategory,
  TabId,
} from './types';
import { api, setAuthToken } from './utils/api';
import { AppLanguage, getTranslations } from './utils/i18n';
import { maskPhone, validateAdminPinFormat } from './utils/mathLogic';

const ACTIVE_MEMBER_STORAGE_KEY = 'sgbm_active_member_id';
const LIKED_POSTS_STORAGE_KEY = 'sgbm_liked_posts';
const LANGUAGE_STORAGE_KEY = 'sgbm_language';

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'hi' ? 'hi' : 'en';
  });

  // Session token stays strictly in React/module memory (never localStorage/sessionStorage)
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>(TabId.Feed);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [events, setEvents] = useState<MathEvent[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [modalPinInput, setModalPinInput] = useState('');
  const [modalPinError, setModalPinError] = useState<string | null>(null);
  const [modalPinLoading, setModalPinLoading] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const [activeMemberId, setActiveMemberId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_MEMBER_STORAGE_KEY),
  );
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const t = useMemo(() => getTranslations(language), [language]);

  const publicNavItems = useMemo(
    () => [
      { id: TabId.Feed, label: t.navFeed, icon: Home },
      { id: TabId.Membership, label: t.navMembership, icon: Users },
      { id: TabId.IdCard, label: t.navIdCard, icon: CreditCard },
      { id: TabId.Donation, label: t.navDonation, icon: HeartHandshake },
    ],
    [t],
  );

  const handleChangeLanguage = (nextLang: AppLanguage) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    setLanguage(nextLang);
  };

  const refreshData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      setLoadError(null);
      const data = await api.fetchBootstrap();
      setPosts(data.posts);
      setMembers(data.members);
      setDonations(data.donations);
      setEvents(data.events);
      setAdmins(data.admins ?? []);

      // Auto-select member matching verified mobile number if found
      const matchingMember = data.members.find((m) => m.phone === authUser.phone);
      if (matchingMember) {
        localStorage.setItem(ACTIVE_MEMBER_STORAGE_KEY, matchingMember.id);
        setActiveMemberId(matchingMember.id);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load community data.',
      );
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      void refreshData();
    }
  }, [authUser, refreshData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setProfileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) ?? null,
    [members, activeMemberId],
  );

  const selectActiveMember = (member: Member | null) => {
    if (member) {
      localStorage.setItem(ACTIVE_MEMBER_STORAGE_KEY, member.id);
      setActiveMemberId(member.id);
    } else {
      localStorage.removeItem(ACTIVE_MEMBER_STORAGE_KEY);
      setActiveMemberId(null);
    }
  };

  const handleVerifyOtp = async (phone: string, otp: string) => {
    const res = await api.verifyOtp(phone, otp);
    setAuthToken(res.token);
    return res;
  };

  const handleSetupAdminPin = async (pin: string) => {
    const res = await api.setupAdminPin(pin);
    return res.user;
  };

  const handleVerifyAdminPin = async (pin: string) => {
    const res = await api.verifyAdminPin(pin);
    return res.user;
  };

  const handleCompleteAuth = (user: AuthSessionUser) => {
    setAuthUser(user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    setAuthToken(null);
    setAuthUser(null);
    setAdmins([]);
    setPosts([]);
    setMembers([]);
    setDonations([]);
    setActiveTab(TabId.Feed);
    setProfileMenuOpen(false);
  };

  const handleUnlockAdminFromMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    const pinErr = validateAdminPinFormat(modalPinInput);
    if (pinErr) {
      setModalPinError(pinErr);
      return;
    }
    setModalPinError(null);
    setModalPinLoading(true);
    try {
      const updated = authUser.adminPinConfigured
        ? await handleVerifyAdminPin(modalPinInput.trim())
        : await handleSetupAdminPin(modalPinInput.trim());
      setAuthUser(updated);
      setModalPinInput('');
      setPinModalOpen(false);
      setActiveTab(TabId.Admin);
    } catch (err) {
      setModalPinError(err instanceof Error ? err.message : 'Incorrect Secret Admin PIN.');
    } finally {
      setModalPinLoading(false);
    }
  };

  const handleCreatePost = async (payload: {
    authorName: string;
    authorGotra?: string;
    authorCity?: string;
    category: PostCategory;
    title: string;
    content: string;
    imageUrl?: string;
  }) => {
    const created = await api.createPost(payload);
    setPosts((prev) => {
      const pinned = prev.filter((p) => p.pinned);
      const regular = prev.filter((p) => !p.pinned);
      return [...pinned, created, ...regular];
    });
  };

  const handleToggleLike = async (postId: string) => {
    const alreadyLiked = likedPostIds.includes(postId);
    const delta: 1 | -1 = alreadyLiked ? -1 : 1;
    const nextLiked = alreadyLiked
      ? likedPostIds.filter((id) => id !== postId)
      : [...likedPostIds, postId];

    setLikedPostIds(nextLiked);
    localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(nextLiked));

    const updated = await api.toggleLike(postId, delta);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleAddComment = async (
    postId: string,
    text: string,
    authorName: string,
  ) => {
    const updated = await api.addComment(postId, {
      authorName,
      authorCity: activeMember?.city,
      text,
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleRegisterMember = async (payload: {
    name: string;
    gotra: string;
    phone: string;
    address: string;
    city: string;
    role: string;
  }) => {
    const created = await api.registerMember(payload);
    setMembers((prev) => [created, ...prev]);
    selectActiveMember(created);
    return created;
  };

  const handleLookupMember = async (query: string) => {
    const found = await api.lookupMember(query);
    setMembers((prev) =>
      prev.some((m) => m.id === found.id) ? prev : [found, ...prev],
    );
    selectActiveMember(found);
    return found;
  };

  const handleSubmitDonation = async (payload: {
    donorName: string;
    phone: string;
    amount: number;
    purpose: DonationPurpose;
    utrReference: string;
  }) => {
    const created = await api.submitDonation(payload);
    setDonations((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdateMemberStatus = async (
    memberId: string,
    status: MemberStatus,
  ) => {
    const updated = await api.updateMemberStatus(memberId, status);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
  };

  const handleDeleteMember = async (memberId: string) => {
    await api.deleteMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (activeMemberId === memberId) {
      selectActiveMember(null);
    }
  };

  const handleTogglePinPost = async (postId: string, pinned: boolean) => {
    const updated = await api.togglePinPost(postId, pinned);
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? updated : p));
      return next.sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
    });
  };

  const handleDeletePost = async (postId: string) => {
    await api.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleUpdateDonationStatus = async (
    donationId: string,
    status: DonationStatus,
  ) => {
    const updated = await api.updateDonationStatus(donationId, status);
    setDonations((prev) => prev.map((d) => (d.id === donationId ? updated : d)));
  };

  const handleGrantAdmin = async (phone: string, name?: string) => {
    const updatedAdmins = await api.grantAdminAccess(phone, name);
    setAdmins(updatedAdmins);
  };

  const handleRevokeAdmin = async (phone: string) => {
    const updatedAdmins = await api.revokeAdminAccess(phone);
    setAdmins(updatedAdmins);
  };

  // Welcome screen removed: first screen is always Login / Create Account with Language option
  if (!authUser) {
    return (
      <AuthScreen
        language={language}
        onChangeLanguage={handleChangeLanguage}
        onRequestOtp={(phone) => api.requestOtp(phone)}
        onVerifyOtp={handleVerifyOtp}
        onSetupAdminPin={handleSetupAdminPin}
        onVerifyAdminPin={handleVerifyAdminPin}
        onCompleteAuth={handleCompleteAuth}
      />
    );
  }

  const canAccessAdmin = authUser.isAuthorizedAdmin && authUser.adminVerified;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E1B18] flex flex-col">
      {/* Top Bar: 3-zone contract without any public Admin link */}
      <header className="sticky top-0 z-30 h-[52px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-[#E6E2DA]">
        <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab(TabId.Feed)}
            className="text-base sm:text-lg font-bold tracking-tight text-[#1E1B18] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#C2410C] transition-colors"
          >
            {t.brandName}
          </button>

          {/* Zone 2: Desktop Navigation (Public 4 items only — NO Admin tab) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium"
          >
            {publicNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`py-1.5 border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#C2410C] text-[#C2410C] font-semibold'
                      : 'border-transparent text-[#645D55] hover:text-[#1E1B18]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Account / Profile Menu */}
          <div className="relative flex items-center shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label="Account Menu"
              className="min-h-[38px] lg:min-h-[40px] px-3 lg:px-3.5 py-1.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-[#EFECE5] text-[#1E1B18] text-xs sm:text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <User className="w-4 h-4 text-[#C2410C]" />
              <span className="font-mono">{maskPhone(authUser.phone)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#645D55]" />
            </button>

            {profileMenuOpen && (
              <div
                role="menu"
                aria-label="Account Options"
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E6E2DA] rounded-2xl shadow-lg p-2 space-y-1 z-50"
              >
                <div className="px-3 py-2 border-b border-[#F1EDE4]">
                  <p className="text-xs font-semibold text-[#1E1B18]">
                    {activeMember ? activeMember.name : 'Verified Devotee'}
                  </p>
                  <p className="font-mono text-[11px] text-[#645D55]">
                    +91 {authUser.phone}
                  </p>
                </div>

                {/* Hidden Admin Dashboard button — visible ONLY after OTP + Secret Admin PIN verification */}
                {canAccessAdmin && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab(TabId.Admin);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-semibold text-[#15803D] hover:bg-[#F0FDF4] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.menuAdminDashboard}</span>
                  </button>
                )}

                {authUser.isAuthorizedAdmin && !authUser.adminVerified && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setModalPinInput('');
                      setModalPinError(null);
                      setPinModalOpen(true);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#B45309] hover:bg-orange-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{t.menuUnlockAdmin}</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTab(TabId.IdCard);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#1E1B18] hover:bg-[#FAF9F6] inline-flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-[#645D55]" />
                  <span>{t.menuMyIdCard}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleChangeLanguage(language === 'en' ? 'hi' : 'en');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#1E1B18] hover:bg-[#FAF9F6] inline-flex items-center gap-2 cursor-pointer"
                >
                  <Languages className="w-4 h-4 text-[#645D55]" />
                  <span>{t.menuLanguageSwitch}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#B91C1C] hover:bg-red-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.menuSignOut}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:pb-12">
        {loading ? (
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-[#645D55]">
              Loading {t.brandName}...
            </p>
          </div>
        ) : loadError ? (
          <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 text-center space-y-3">
            <p className="text-base font-semibold text-[#B91C1C]">{loadError}</p>
            <button
              type="button"
              onClick={() => void refreshData()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C2410C] text-white text-sm font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === TabId.Feed && (
              <FeedSection
                posts={posts}
                events={events}
                activeMember={activeMember}
                likedPostIds={likedPostIds}
                strings={t}
                onCreatePost={handleCreatePost}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onGoToMembership={() => setActiveTab(TabId.Membership)}
              />
            )}

            {activeTab === TabId.Membership && (
              <MembershipSection
                members={members}
                activeMember={activeMember}
                verifiedPhone={authUser.phone}
                strings={t}
                onRegister={handleRegisterMember}
                onLookup={handleLookupMember}
                onOpenIdCard={() => setActiveTab(TabId.IdCard)}
              />
            )}

            {activeTab === TabId.IdCard && (
              <IdCardSection
                activeMember={activeMember}
                fallbackMember={members[0] ?? null}
                strings={t}
                onSelectSampleMember={(member) => selectActiveMember(member)}
                onGoToMembership={() => setActiveTab(TabId.Membership)}
              />
            )}

            {activeTab === TabId.Donation && (
              <DonationSection
                donations={donations}
                activeMember={activeMember}
                strings={t}
                onSubmitDonation={handleSubmitDonation}
              />
            )}

            {activeTab === TabId.Admin && canAccessAdmin && (
              <AdminSection
                authUser={authUser}
                members={members}
                posts={posts}
                donations={donations}
                admins={admins}
                onUpdateMemberStatus={handleUpdateMemberStatus}
                onDeleteMember={handleDeleteMember}
                onTogglePinPost={handleTogglePinPost}
                onDeletePost={handleDeletePost}
                onUpdateDonationStatus={handleUpdateDonationStatus}
                onGrantAdmin={handleGrantAdmin}
                onRevokeAdmin={handleRevokeAdmin}
                onExitAdminView={() => setActiveTab(TabId.Feed)}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar — 4 Public Tabs ONLY (NO Admin tab) */}
      <nav
        aria-label="Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E2DA] pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-[60px] max-w-xl mx-auto">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`min-h-[44px] h-full flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                  active ? 'text-[#C2410C]' : 'text-[#645D55] hover:text-[#1E1B18]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
                <span
                  className={`text-[11px] leading-tight whitespace-nowrap ${
                    active ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modal for Authorized Admin to enter Secret PIN if skipped during initial login */}
      {pinModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-admin-modal-title"
        >
          <div className="w-full max-w-sm bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <h2 id="unlock-admin-modal-title" className="text-lg font-bold text-[#1E1B18]">
              {authUser.adminPinConfigured
                ? t.secretPinLabel
                : t.chooseSecretPinLabel}
            </h2>
            <p className="text-xs text-[#645D55]">{t.adminPinNotice}</p>
            <form onSubmit={handleUnlockAdminFromMenu} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                aria-label="Secret Admin PIN"
                value={modalPinInput}
                onChange={(e) =>
                  setModalPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
                placeholder="4–8 digit PIN"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center font-mono tracking-widest focus:outline-none focus:border-[#C2410C]"
              />
              {modalPinError && (
                <p role="alert" className="text-xs text-[#B91C1C]">
                  {modalPinError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl border border-[#E6E2DA] text-xs font-medium text-[#645D55] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalPinLoading}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#1E1B18] text-white text-xs font-semibold cursor-pointer"
                >
                  {modalPinLoading ? t.verifyingBtn : 'Unlock Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
