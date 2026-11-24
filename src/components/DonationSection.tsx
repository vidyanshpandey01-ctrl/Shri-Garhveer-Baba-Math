import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Copy, HeartHandshake, Receipt } from 'lucide-react';
import { Donation, DonationPurpose, Member } from '../types';
import { AppStrings } from '../utils/i18n';
import {
  buildUpiUri,
  formatCurrencyINR,
  formatRelativeTime,
  validateDonationInput,
} from '../utils/mathLogic';
import { QrCodeSvg } from './QrCodeSvg';

interface DonationSectionProps {
  donations: Donation[];
  activeMember: Member | null;
  strings: AppStrings;
  onSubmitDonation: (payload: {
    donorName: string;
    phone: string;
    amount: number;
    purpose: DonationPurpose;
    utrReference: string;
  }) => Promise<Donation>;
}

const PRESET_AMOUNTS = [101, 501, 1101, 2101, 5101];
const MATH_UPI_VPA = 'garhveermath@sbi';
const DIYA_IMAGE_URL = '/src/assets/images/donation_diya_seva_1795533370939.jpg';

export function DonationSection({
  donations,
  activeMember,
  strings,
  onSubmitDonation,
}: DonationSectionProps) {
  const [amount, setAmount] = useState<number>(501);
  const [customAmountInput, setCustomAmountInput] = useState('501');
  const [purpose, setPurpose] = useState<DonationPurpose>(DonationPurpose.Annakshetra);
  const [donorName, setDonorName] = useState(activeMember?.name || '');
  const [phone, setPhone] = useState(activeMember?.phone || '');
  const [utrReference, setUtrReference] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<Donation | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiUri = useMemo(
    () =>
      buildUpiUri({
        vpa: MATH_UPI_VPA,
        payeeName: 'Shri Garhveer Baba Math',
        amount: amount || 101,
        note: purpose,
      }),
    [amount, purpose],
  );

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmountInput(String(val));
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmountInput(val);
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      setAmount(Math.round(parsed));
    }
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(MATH_UPI_VPA);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      setCopiedUpi(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(customAmountInput);
    const check = validateDonationInput({
      donorName,
      phone,
      amount: numericAmount,
      purpose,
      utrReference,
    });

    if (!check.valid) {
      setErrors(check.errors);
      setSubmitError('Please fix the highlighted donation fields.');
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const receipt = await onSubmitDonation({
        donorName: donorName.trim(),
        phone: phone.trim(),
        amount: Math.round(numericAmount),
        purpose,
        utrReference: utrReference.trim().toUpperCase(),
      });
      setLatestReceipt(receipt);
      setUtrReference('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to record donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: QR Scanner & Seva Amount Selection */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="h-36 overflow-hidden border-b border-[#E6E2DA] relative">
            <img
              src={DIYA_IMAGE_URL}
              alt="Brass diya oil lamp for Math Seva"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-5">
              <div className="text-white">
                <p className="font-serif text-xs text-orange-200">{strings.brandName}</p>
                <h2 className="text-lg font-bold">{strings.donationQrTitle}</h2>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Preset amounts */}
            <div>
              <p className="text-xs font-semibold text-[#645D55] mb-2">
                Choose Seva Amount
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((val) => {
                  const selected = amount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectPreset(val)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-semibold tabular-nums border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#C2410C] text-white border-[#C2410C]'
                          : 'bg-[#FAF9F6] text-[#1E1B18] border-[#E6E2DA] hover:border-[#C2410C]/50'
                      }`}
                    >
                      {formatCurrencyINR(val)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic UPI QR */}
            <div className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
              <QrCodeSvg
                value={upiUri}
                size={188}
                label={`UPI QR code for ${formatCurrencyINR(amount)}`}
              />
              <div>
                <p className="text-sm font-bold text-[#1E1B18] tabular-nums">
                  Paying {formatCurrencyINR(amount)} · {purpose}
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <span className="font-mono text-xs text-[#645D55]">{MATH_UPI_VPA}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#E6E2DA] bg-white text-xs font-medium text-[#1E1B18] inline-flex items-center gap-1 cursor-pointer hover:bg-[#EFECE5]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Payment Reference Form & Recent Donations */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#1E1B18]">
                {strings.donationFormTitle}
              </h3>
              <p className="text-sm text-[#645D55] mt-1">
                After scanning the QR code in any UPI app, enter your 12-digit UTR /
                Reference ID below to generate an instant Seva receipt.
              </p>
            </div>
            <HeartHandshake className="w-5 h-5 text-[#C2410C] shrink-0 mt-1" />
          </div>

          {latestReceipt && (
            <div
              role="status"
              data-testid="donation-receipt"
              className="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-[#15803D] font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Seva Receipt Recorded: {latestReceipt.receiptNumber}</span>
              </div>
              <p className="text-xs text-[#166534] tabular-nums">
                {latestReceipt.donorName} · {formatCurrencyINR(latestReceipt.amount)} · UTR{' '}
                <span className="font-mono">{latestReceipt.utrReference}</span> ·{' '}
                {latestReceipt.status}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="donor-name"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Donor Name *
                </label>
                <input
                  id="donor-name"
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Full name for receipt"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                />
                {errors.donorName && (
                  <p className="text-xs text-[#B91C1C] mt-1">{errors.donorName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="donor-phone"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Mobile Number *
                </label>
                <input
                  id="donor-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-mono focus:outline-none focus:border-[#C2410C]"
                />
                {errors.phone && (
                  <p className="text-xs text-[#B91C1C] mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="donation-amount"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Amount (INR) *
                </label>
                <input
                  id="donation-amount"
                  type="number"
                  min={11}
                  value={customAmountInput}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-mono tabular-nums focus:outline-none focus:border-[#C2410C]"
                />
                {errors.amount && (
                  <p className="text-xs text-[#B91C1C] mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="donation-purpose"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  Seva Purpose
                </label>
                <select
                  id="donation-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as DonationPurpose)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#C2410C]"
                >
                  {Object.values(DonationPurpose).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="donation-utr"
                className="block text-sm font-medium text-[#1E1B18] mb-1.5"
              >
                UPI Transaction / UTR Reference Number *
              </label>
              <input
                id="donation-utr"
                type="text"
                value={utrReference}
                onChange={(e) => setUtrReference(e.target.value)}
                placeholder="e.g. 432910448812"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-mono uppercase focus:outline-none focus:border-[#C2410C]"
              />
              {errors.utrReference && (
                <p className="text-xs text-[#B91C1C] mt-1">{errors.utrReference}</p>
              )}
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-[#B91C1C] font-medium">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>{submitting ? 'Recording Seva...' : strings.submitDonationBtn}</span>
            </button>
          </form>
        </div>

        {/* Transparent Seva Ledger */}
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E1B18]">Recent Seva Contributions</h3>
            <span className="text-xs text-[#645D55] tabular-nums">
              {donations.length} Records
            </span>
          </div>

          <ul className="divide-y divide-[#F1EDE4]">
            {donations.slice(0, 6).map((don) => (
              <li key={don.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E1B18] truncate">
                    {don.donorName}
                  </p>
                  <p className="text-xs text-[#645D55] truncate">
                    {don.purpose} · {don.status} · {formatRelativeTime(don.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#1E1B18] tabular-nums">
                    {formatCurrencyINR(don.amount)}
                  </p>
                  <p className="font-mono text-[11px] text-[#645D55]">
                    {don.receiptNumber}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
