import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Share2,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Member, MemberStatus } from '../types';
import { AppStrings } from '../utils/i18n';
import { generateQrMatrix } from '../utils/mathLogic';
import { QrCodeSvg } from './QrCodeSvg';

interface IdCardSectionProps {
  activeMember: Member | null;
  fallbackMember: Member | null;
  strings: AppStrings;
  onSelectSampleMember: (member: Member) => void;
  onGoToMembership: () => void;
}

const MATH_LOGO_URL = '/src/assets/images/math_logo_1795533369511.jpg';

export function IdCardSection({
  activeMember,
  fallbackMember,
  strings,
  onSelectSampleMember,
  onGoToMembership,
}: IdCardSectionProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const member = activeMember;

  const handleDownloadPng = async () => {
    if (!member) return;
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 580;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Alabaster card base
    ctx.fillStyle = '#FAF9F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header band
    ctx.fillStyle = '#C2410C';
    ctx.fillRect(0, 0, canvas.width, 130);

    // Subtle gold border strip
    ctx.fillStyle = '#B45309';
    ctx.fillRect(0, 130, canvas.width, 6);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Shri Garhveer Baba Math', 48, 62);
    ctx.font = '20px serif';
    ctx.fillStyle = '#FED7AA';
    ctx.fillText('Official Digital Community Identity Card', 48, 98);

    // Member ID Badge text on top right
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(member.memberCode, 912, 70);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#FFEDD5';
    ctx.fillText(`Status: ${member.status}`, 912, 102);

    // Body details
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1E1B18';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(member.name, 48, 210);

    ctx.fillStyle = '#B45309';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(member.role, 48, 250);

    const drawField = (label: string, val: string, x: number, y: number) => {
      ctx.fillStyle = '#645D55';
      ctx.font = '600 16px sans-serif';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#1E1B18';
      ctx.font = '500 22px sans-serif';
      ctx.fillText(val.slice(0, 42), x, y + 30);
    };

    drawField('MOBILE NUMBER', `+91 ${member.phone}`, 48, 315);
    drawField('CITY / VILLAGE', member.city, 380, 315);
    drawField('RESIDENTIAL ADDRESS', member.address, 48, 405);
    drawField(
      'ISSUED ON',
      new Date(member.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      48,
      495,
    );

    // Draw deterministic QR matrix on right
    const qrPayload = `SGBM:${member.memberCode}|${member.name}|${member.phone}`;
    const matrix = generateQrMatrix(qrPayload, 25);
    const qrSize = 210;
    const qrX = 700;
    const qrY = 230;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
    ctx.strokeStyle = '#E6E2DA';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);

    const cellSize = qrSize / matrix.length;
    ctx.fillStyle = '#1E1B18';
    matrix.forEach((row, r) => {
      row.forEach((filled, c) => {
        if (filled) {
          ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize);
        }
      });
    });

    ctx.fillStyle = '#645D55';
    ctx.font = '15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize + 36);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${member.memberCode}.png`;
    link.href = dataUrl;
    link.click();
    setFeedback(`Downloaded ${member.memberCode}.png`);
  };

  const handleShare = async () => {
    if (!member) return;
    const summary = `Shri Garhveer Baba Math ID\nName: ${member.name}\nID: ${member.memberCode}\nGotra: ${member.gotra}\nCity: ${member.city}\nStatus: ${member.status}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${member.name} — Shri Garhveer Baba Math ID`,
          text: summary,
        });
        setFeedback('Shared ID card details.');
        return;
      }
    } catch {
      // Fallback to clipboard below
    }
    try {
      await navigator.clipboard.writeText(summary);
      setFeedback('ID card details copied to clipboard.');
    } catch {
      setFeedback('Ready to share: ' + member.memberCode);
    }
  };

  if (!member) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#E6E2DA] mx-auto">
          <img
            src={MATH_LOGO_URL}
            alt="Shri Garhveer Baba Math"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#1E1B18]">
            Digital ID Card Generator
          </h2>
          <p className="text-sm text-[#645D55] max-w-md mx-auto">
            Register your membership or look up your registered mobile number to generate
            your verified Shri Garhveer Baba Math Digital ID card.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoToMembership}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold cursor-pointer"
          >
            Register Membership
          </button>

          {fallbackMember && (
            <button
              type="button"
              onClick={() => onSelectSampleMember(fallbackMember)}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-[#EFECE5] text-sm font-medium text-[#1E1B18] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#B45309]" />
              <span>Preview Sample Card ({fallbackMember.name})</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const qrValue = `SGBM:${member.memberCode}|NAME:${member.name}|GOTRA:${member.gotra}|CITY:${member.city}|STATUS:${member.status}`;

  const statusMeta =
    member.status === MemberStatus.Approved
      ? { icon: CheckCircle2, color: 'text-[#15803D]', label: 'Verified Member' }
      : member.status === MemberStatus.Rejected
        ? { icon: ShieldAlert, color: 'text-[#B91C1C]', label: 'Needs Review' }
        : { icon: Clock, color: 'text-[#B45309]', label: 'Pending Admin Approval' };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Digital ID Card Visual */}
      <div className="lg:col-span-7">
        <div
          data-testid="digital-id-card"
          className="bg-white border border-[#D8D1C5] rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Card Header Band */}
          <div className="bg-[#C2410C] text-white px-5 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-[#B45309]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white border border-orange-200 shrink-0">
                <img
                  src={MATH_LOGO_URL}
                  alt="Shri Garhveer Baba Math Crest"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold leading-snug">
                  {strings.brandName}
                </h2>
                <p className="font-serif text-xs sm:text-sm text-orange-100">
                  {strings.idCardPassSubtitle}
                </p>
              </div>
            </div>

            <div className="flex sm:block items-center justify-between border-t sm:border-t-0 border-white/20 pt-2 sm:pt-0 sm:text-right shrink-0">
              <p className="text-[11px] text-orange-100 font-medium">MEMBER ID</p>
              <p className="font-mono text-sm sm:text-base font-bold tabular-nums">
                {member.memberCode}
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-8 space-y-4">
              <div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.color} mb-1`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{statusMeta.label}</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1E1B18]">{member.name}</h3>
                <p className="text-sm font-medium text-[#B45309] mt-0.5">
                  {member.role}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-[#F1EDE4] text-sm">
                <div>
                  <dt className="text-xs text-[#645D55]">Mobile Number</dt>
                  <dd className="font-mono font-medium text-[#1E1B18] tabular-nums">
                    +91 {member.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#645D55]">City / Village</dt>
                  <dd className="font-medium text-[#1E1B18]">{member.city}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-[#645D55]">Residential Address</dt>
                  <dd className="font-medium text-[#1E1B18]">{member.address}</dd>
                </div>
              </dl>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-3.5">
              <QrCodeSvg
                value={qrValue}
                size={136}
                label={`Verification QR for ${member.memberCode}`}
              />
              <span className="font-mono text-[11px] text-[#645D55] mt-2">
                {member.memberCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions & Card Controls */}
      <div className="lg:col-span-5 bg-white border border-[#E6E2DA] rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[#1E1B18]">Download & Share Pass</h3>
          <p className="text-sm text-[#645D55] mt-1">
            Save a high-resolution copy of your Math ID card or share your verified details
            with the Kutumb committee.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{strings.downloadIdBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-[#EFECE5] text-[#1E1B18] font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Share2 className="w-4 h-4 text-[#B45309]" />
            <span>{strings.shareIdBtn}</span>
          </button>

          <button
            type="button"
            onClick={onGoToMembership}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl border border-transparent hover:bg-[#FAF9F6] text-[#645D55] font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Switch or Register Another Member</span>
          </button>
        </div>

        {feedback && (
          <p role="status" className="text-sm text-[#15803D] font-medium pt-1">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
