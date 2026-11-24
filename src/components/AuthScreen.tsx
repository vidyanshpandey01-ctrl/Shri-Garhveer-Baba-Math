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
import { sendFirebaseOtp, verifyFirebaseOtp } from '../utils/firebase';
import { api, setAuthToken } from '../utils/api';

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
  onSetupAdminPin,
  onVerifyAdminPin,
  onCompleteAuth,
}: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');

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
      await sendFirebaseOtp(clean);
      setVerifiedPhone(clean);
      setOtpInput('');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP bhejne mein problem aayi.');
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
      const { idToken } = await verifyFirebaseOtp(otpInput.trim());
      const res = await api.firebaseLogin(idToken);

      setAuthToken(res.token);

      if (res.user.isAuthorizedAdmin) {
        setPendingAdminUser(res.user);
        setPinInput('');
        setConfirmPinInput('');
        setStep('admin-pin');
      } else {
        onCompleteAuth(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP.');
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

          {/* Language */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#645D55]">
              <Languages className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{t.chooseLanguage}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#EFECE5] rounded-xl">
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  language === 'en'
                    ? 'bg-white text-[#1E1B18] shadow-xs'
                    : 'text-[#645D55]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('hi')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  language === 'hi'
                    ? 'bg-white text-[#1E1B18] shadow-xs'
                    : 'text-[#645D55]'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-4">
              <p className="text-sm text-[#645D55]">{t.authSubtitlePhone}</p>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t.mobileNumberLabel}
                </label>
                <div className="flex items-center rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] overflow-hidden">
                  <span className="px-3.5 py-2.5 text-sm font-mono text-[#645D55] border-r border-[#E6E2DA] bg-[#F3EFE8]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 min-h-[46px] px-3.5 py-2 bg-transparent text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[#B91C1C] font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {loading ? 'Sending...' : t.sendOtpBtn}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
              <p className="text-sm text-[#645D55]">
                OTP bheja gaya hai +91 {verifiedPhone} pe
              </p>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t.otpLabel}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-[0.4em] focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-[#B91C1C] font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Verifying...' : t.verifyContinueBtn}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('phone');
                }}
                className="w-full text-xs text-[#645D55] mt-2"
              >
                Number change karo
              </button>
            </form>
          )}

          {/* Step 3: Admin PIN */}
          {step === 'admin-pin' && pendingAdminUser && (
            <form onSubmit={handlePinSubmit} noValidate className="space-y-4">
              <p className="text-sm text-[#645D55]">
                {pendingAdminUser.adminPinConfigured
                  ? 'Secret Admin PIN enter karo'
                  : 'Naya Secret Admin PIN set karo (4-8 digits)'}
              </p>

              <div>
                <label className="block text-sm font-medium mb-1.5">Secret PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-widest focus:outline-none"
                />
              </div>

              {!pendingAdminUser.adminPinConfigured && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-center text-lg font-mono tracking-widest focus:outline-none"
                  />
                </div>
              )}

              {error && <p className="text-sm text-[#B91C1C] font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {loading ? 'Please wait...' : 'Continue'}
              </button>
            </form>
          )}
        </div>

        {/* Firebase reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
