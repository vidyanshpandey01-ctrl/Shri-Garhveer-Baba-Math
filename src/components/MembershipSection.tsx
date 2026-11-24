import { FormEvent, useState } from 'react';
import { CheckCircle2, CreditCard, Search, UserPlus } from 'lucide-react';
import { Member, MemberStatus } from '../types';
import { AppStrings } from '../utils/i18n';
import { validateMembershipInput } from '../utils/mathLogic';

interface MembershipSectionProps {
  members: Member[];
  activeMember: Member | null;
  verifiedPhone: string;
  strings: AppStrings;
  onRegister: (payload: {
    name: string;
    gotra: string;
    phone: string;
    address: string;
    city: string;
    role: string;
  }) => Promise<Member>;
  onLookup: (query: string) => Promise<Member>;
  onOpenIdCard: () => void;
}

export function MembershipSection({
  members,
  activeMember,
  verifiedPhone,
  strings,
  onRegister,
  onLookup,
  onOpenIdCard,
}: MembershipSectionProps) {
  const [name, setName] = useState('');
  const [gotra, setGotra] = useState('');
  const [phone, setPhone] = useState(verifiedPhone);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('Devotee Member');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMember, setSuccessMember] = useState<Member | null>(null);

  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const check = validateMembershipInput({
      name,
      gotra,
      phone,
      address,
      city,
      role,
    });
    if (!check.valid) {
      setFieldErrors(check.errors);
      setSubmitError('Please fix the highlighted fields before submitting.');
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await onRegister({
        name: name.trim(),
        gotra: gotra.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        role,
      });
      setSuccessMember(created);
      setName('');
      setGotra('');
      setPhone('');
      setAddress('');
      setCity('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setLookupError('Enter a 10-digit phone number or Member ID.');
      return;
    }
    setLookupError(null);
    setLookupLoading(true);
    try {
      const found = await onLookup(lookupQuery.trim());
      setSuccessMember(found);
      setLookupQuery('');
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Member record not found.');
    } finally {
      setLookupLoading(false);
    }
  };

  const approvedMembers = members.filter((m) => m.status === MemberStatus.Approved);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Online Membership Registration Form */}
      <div className="lg:col-span-7 bg-white border border-[#E6E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E1B18]">
              {strings.membershipTitle}
            </h2>
            <p className="text-sm text-[#645D55] mt-1">
              {strings.membershipSubtitle}
            </p>
          </div>
          <UserPlus className="w-5 h-5 text-[#C2410C] shrink-0 mt-1" />
        </div>

        {successMember && (
          <div
            role="status"
            className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#14532D]">
                  Member Profile Active: {successMember.name}
                </p>
                <p className="text-xs text-[#166534] mt-0.5 font-mono">
                  ID: {successMember.memberCode} · Status: {successMember.status}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenIdCard}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>View ID Card</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="member-name"
                className="block text-sm font-medium text-[#1E1B18] mb-1.5"
              >
                Full Name *
              </label>
              <input
                id="member-name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajeshwar Prasad"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
              />
              {fieldErrors.name && (
                <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="member-gotra"
                className="block text-sm font-medium text-[#1E1B18] mb-1.5"
              >
                Gotra *
              </label>
              <input
                id="member-gotra"
                name="gotra"
                type="text"
                value={gotra}
                onChange={(e) => setGotra(e.target.value)}
                placeholder="e.g. Bharadwaj, Kashyap"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
              />
              {fieldErrors.gotra && (
                <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.gotra}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="member-phone"
                className="block text-sm font-medium text-[#1E1B18] mb-1.5"
              >
                Mobile Number *
              </label>
              <input
                id="member-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-mono focus:outline-none focus:border-[#C2410C]"
              />
              {fieldErrors.phone && (
                <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="member-city"
                className="block text-sm font-medium text-[#1E1B18] mb-1.5"
              >
                City / Village *
              </label>
              <input
                id="member-city"
                name="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Sikar, Jaipur"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
              />
              {fieldErrors.city && (
                <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="member-address"
              className="block text-sm font-medium text-[#1E1B18] mb-1.5"
            >
              Residential Address *
            </label>
            <textarea
              id="member-address"
              name="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Ward No., Street, Tehsil"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
            />
            {fieldErrors.address && (
              <p className="text-xs text-[#B91C1C] mt-1">{fieldErrors.address}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="member-role"
              className="block text-sm font-medium text-[#1E1B18] mb-1.5"
            >
              Seva Affiliation
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
            >
              <option value="Devotee Member">Devotee Member</option>
              <option value="Seva Volunteer">Seva Volunteer</option>
              <option value="Annakshetra Sahayak">Annakshetra Sahayak</option>
              <option value="Gau Seva Samiti">Gau Seva Samiti</option>
            </select>
          </div>

          {submitError && (
            <p role="alert" className="text-sm text-[#B91C1C] font-medium">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white font-semibold text-sm cursor-pointer transition-colors"
          >
            {submitting ? 'Submitting Registration...' : strings.submitMembershipBtn}
          </button>
        </form>
      </div>

      {/* Right Column: Lookup Existing Member + Directory */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1B18]">
              Already Registered? Load Your ID
            </h3>
            <p className="text-xs text-[#645D55] mt-0.5">
              Enter your 10-digit mobile number or Member ID (e.g. SGBM-2026-0001).
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex items-center gap-2">
            <input
              type="text"
              aria-label="Lookup phone number or Member ID"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Phone or SGBM-2026-0001"
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E1B18] hover:bg-[#332E29] text-white text-sm font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Find</span>
            </button>
          </form>

          {lookupError && (
            <p role="alert" className="text-xs text-[#B91C1C]">
              {lookupError}
            </p>
          )}

          {activeMember && (
            <div className="pt-3 border-t border-[#F1EDE4] flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-semibold text-[#1E1B18]">
                  Active: {activeMember.name}
                </p>
                <p className="text-[#645D55] font-mono">{activeMember.memberCode}</p>
              </div>
              <button
                type="button"
                onClick={onOpenIdCard}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#E6E2DA] text-xs font-semibold text-[#C2410C] hover:bg-orange-50 cursor-pointer"
              >
                Open ID Card
              </button>
            </div>
          )}
        </div>

        {/* Verified Community Members Directory */}
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E1B18]">Verified Kutumb Members</h3>
            <span className="text-xs text-[#645D55] tabular-nums">
              {approvedMembers.length} Verified
            </span>
          </div>

          <ul className="divide-y divide-[#F1EDE4]">
            {approvedMembers.slice(0, 6).map((member) => (
              <li key={member.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1E1B18]">{member.name}</p>
                  <span className="font-mono text-xs text-[#645D55]">
                    {member.memberCode}
                  </span>
                </div>
                <p className="text-xs text-[#645D55] mt-0.5">
                  {member.gotra} Gotra · {member.city} · {member.role}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
