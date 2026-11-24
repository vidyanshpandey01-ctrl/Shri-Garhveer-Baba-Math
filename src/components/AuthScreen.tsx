import { FormEvent, useState } from 'react';
import {
  KeyRound,
  Languages,
  Lock,
  MessageSquare,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { AuthSessionUser } from '../types';
import { AppLanguage, getTranslations } from '../utils/i18n';
import {
  normalizePhone,
  validateAdminPinFormat,
  validateIndianMobile,
  validateOtpCode,
} from '../utils/mathLogic';

interface AuthScreenProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onRequestOtp: (phone: string) => Promise<{
    phone: string;
    demoOtp: string;
    expiresInSeconds: number;
  }>;
  onVerifyOtp: (
    phone: string,
    otp: string,
  ) => Promise<{ token: string; user: AuthSessionUser }>;
  onSetupAdminPin: (pin: string) => Promise<AuthSessionUser>;
  onVerifyAdminPin: (pin: string) => Promise<AuthSessionUser>;
  onCompleteAuth: (user: AuthSessionUser) => void;
}

type AuthStep = 'phone' | 'otp' | 'admin-pin';

const MATH_LOGO_URL = '/src/assets/images/math_logo_1795533369511.jpg';

export function AuthScreen({
  language,
  onChangeLanguage,
  onRequestOtp,
  onVerifyOtp,
  onSetupAdminPin,
  onVerifyAdminPin,
  onCompleteAuth,
}: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);

  const [pendingAdminUser, setPendingAdminUser] = useState<AuthSessionUser | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = getTranslations(language);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    const phoneErr = validateIndianMobile(phoneInput);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const clean = normalizePhone(phoneInput);
      const res = await onRequestOtp(clean);
      setVerifiedPhone(res.phone);
      setDemoOtpNotice(res.demoOtp);
      setOtpInput('');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const otpErr = validateOtpCode(otpInput);
    if (otpErr) {
      setError(otpErr);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { user } = await onVerifyOtp(verifiedPhone, otpInput.trim());
      if (user.isAuthorizedAdmin) {
        setPendingAdminUser(user);
        setPinInput('');
        setConfirmPinInput('');
        setStep('admin-pin');
      } else {
        onCompleteAuth(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingAdminUser) return;

    const pinErr = validateAdminPinFormat(pinInput);
    if (pinErr) {
      setError(pinErr);
      return;
    }

    if (!pendingAdminUser.adminPinConfigured && pinInput.trim() !== confirmPinInput.trim()) {
      setError('Both Secret Admin PIN entries must match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const updatedUser = pendingAdminUser.adminPinConfigured
        ? await onVerifyAdminPin(pinInput.trim())
        : await onSetupAdminPin(pinInput.trim());
      onCompleteAuth(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect Secret Admin PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E1B18] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Simulated SMS Notification Toast during OTP step */}
        {step === 'otp' && demoOtpNotice && (
          <div
            role="status"
            data-testid="demo-otp-toast"
            className="bg-[#1E1B18] text-white rounded-2xl p-4 shadow-md flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-orange-300 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-orange-200">
                  {t.simulatedSmsLabel} +91 {verifiedPhone}
                </p>
                <p className="mt-0.5">
                  {t.simulatedSmsBody}{' '}
                  <span className="font-mono text-sm font-bold text-white tracking-wider">
                    {demoOtpNotice}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOtpInput(demoOtpNotice)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.autofillBtn}
            </button>
          </div>
        )}

        <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6E2DA] shrink-0">
              <img
                src={MATH_LOGO_URL}
                alt="Shri Garhveer Baba Math"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-serif text-xs text-[#B45309] font-medium">
                {t.brandName}
              </p>
              <h1 className="text-xl font-bold text-[#1E1B18]">
                {step === 'phone'
                  ? t.authTitlePhone
                  : step === 'otp'
                    ? t.authTitleOtp
                    : pendingAdminUser?.adminPinConfigured
                      ? t.authTitlePin
                      : t.authTitlePinSetup}
              </h1>
            </div>
          </div>

          {/* Language Selection Option on Login / Create Account */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#645D55]">
              <Languages className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{t.chooseLanguage}</span>
            </div>
            <div
              className="grid grid-cols-2 gap-1 p-1 bg-[#EFECE5] rounded-xl"
              role="group"
              aria-label="Language Selection"
            >
              <button
                type="button"
                aria-pressed={language === 'en'}
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-[#1E1B18] shadow-xs'
                    : 'text-[#645D55] hover:text-[#1E1B18]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                aria-pressed={language === 'hi'}
                onClick={() => onChangeLanguage('hi')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  language === 'hi'
                    ? 'bg-white text-[#1E1B18] shadow-xs'
                    : 'text-[#645D55] hover:text-[#1E1B18]'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Step 1: Mobile Number */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-4">
              <p className="text-sm text-[#645D55] leading-relaxed">
                {t.authSubtitlePhone}
              </p>

              <div>
                <label
                  htmlFor="auth-mobile-input"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  {t.mobileNumberLabel}
                </label>
                <div className="flex items-center rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] focus-within:border-[#C2410C] overflow-hidden">
                  <span className="px-3.5 py-2.5 text-sm font-mono text-[#645D55] border-r border-[#E6E2DA] bg-[#F3EFE8]">
                    +91
                  </span>
                  <input
                    id="auth-mobile-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={t.mobilePlaceholder}
                    className="flex-1 min-h-[46px] px-3.5 py-2 bg-transparent text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-[#B91C1C] font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{loading ? t.sendingOtpBtn : t.sendOtpBtn}</span>
              </button>
            </form>
          )}

          {/* Step 2: 6-digit OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
              <p className="text-sm text-[#645D55]">
                {t.otpPromptPrefix}{' '}
                <span className="font-mono font-semibold text-[#1E1B18]">
                  +91 {verifiedPhone}
                </span>
                .
              </p>

              <div>
                <label
                  htmlFor="auth-otp-input"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  {t.otpLabel}
                </label>
                <input
                  id="auth-otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-[#B91C1C] font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? t.verifyingBtn : t.verifyContinueBtn}</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('phone');
                  }}
                  className="min-h-[40px] text-xs font-medium text-[#645D55] hover:text-[#1E1B18] cursor-pointer"
                >
                  {t.changeNumberBtn}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setError(null);
                    const res = await onRequestOtp(verifiedPhone);
                    setDemoOtpNotice(res.demoOtp);
                  }}
                  className="min-h-[40px] text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
                >
                  {t.resendOtpBtn}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Hidden Secret Admin PIN Prompt */}
          {step === 'admin-pin' && pendingAdminUser && (
            <form onSubmit={handlePinSubmit} noValidate className="space-y-4">
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                <p className="text-xs text-[#7C2D12] leading-relaxed">
                  {pendingAdminUser.adminPinConfigured
                    ? t.adminPinNotice
                    : t.adminPinSetupNotice}
                </p>
              </div>

              <div>
                <label
                  htmlFor="auth-admin-pin-input"
                  className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                >
                  {pendingAdminUser.adminPinConfigured
                    ? t.secretPinLabel
                    : t.chooseSecretPinLabel}
                </label>
                <input
                  id="auth-admin-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="4–8 digit PIN"
                  className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-[0.35em] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {!pendingAdminUser.adminPinConfigured && (
                <div>
                  <label
                    htmlFor="auth-admin-pin-confirm"
                    className="block text-sm font-medium text-[#1E1B18] mb-1.5"
                  >
                    {t.confirmSecretPinLabel}
                  </label>
                  <input
                    id="auth-admin-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmPinInput}
                    onChange={(e) =>
                      setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))
                    }
                    placeholder="Re-enter PIN"
                    className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-[0.35em] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-[#B91C1C] font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1E1B18] hover:bg-[#332E29] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {loading
                    ? t.verifyingBtn
                    : pendingAdminUser.adminPinConfigured
                      ? t.unlockAdminEnterBtn
                      : t.savePinEnterBtn}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onCompleteAuth(pendingAdminUser)}
                className="w-full min-h-[40px] text-xs font-medium text-[#645D55] hover:text-[#1E1B18] cursor-pointer"
              >
                {t.continueRegularBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
