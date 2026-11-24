import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUpiUri,
  computeAdminSummary,
  formatCurrencyINR,
  formatMemberId,
  formatReceiptNumber,
  formatRelativeTime,
  generateQrMatrix,
  maskPhone,
  normalizePhone,
  validateAdminPinFormat,
  validateDonationInput,
  validateIndianMobile,
  validateMembershipInput,
  validateOtpCode,
  validatePostInput,
} from './mathLogic';
import {
  DonationPurpose,
  DonationStatus,
  MemberStatus,
  PostCategory,
} from '../types';

test('validateMembershipInput accepts valid member details', () => {
  const res = validateMembershipInput({
    name: 'Rameshwar Sharma',
    gotra: 'Bharadwaj',
    phone: '+91 98765 43210',
    address: '14 Mandir Marg, Civil Lines',
    city: 'Jaipur',
  });
  assert.equal(res.valid, true);
  assert.deepEqual(res.errors, {});
});

test('validateMembershipInput rejects invalid phone and missing fields', () => {
  const res = validateMembershipInput({
    name: 'A',
    gotra: '',
    phone: '12345',
    address: '12',
    city: '',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.name);
  assert.ok(res.errors.gotra);
  assert.ok(res.errors.phone);
  assert.ok(res.errors.address);
  assert.ok(res.errors.city);
});

test('validateDonationInput enforces minimum amount and UTR format', () => {
  const invalid = validateDonationInput({
    donorName: 'Suresh Tiwari',
    phone: '9876543210',
    amount: 5,
    purpose: DonationPurpose.Annakshetra,
    utrReference: '123',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.amount);
  assert.ok(invalid.errors.utrReference);

  const valid = validateDonationInput({
    donorName: 'Suresh Tiwari',
    phone: '9876543210',
    amount: 501,
    purpose: DonationPurpose.Annakshetra,
    utrReference: '431298765432',
  });
  assert.equal(valid.valid, true);
});

test('validatePostInput validates title and content length', () => {
  const invalid = validatePostInput({
    authorName: 'M',
    title: 'Hi',
    content: 'Short',
    category: PostCategory.Satsang,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.authorName);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.content);
});

test('formatMemberId and formatReceiptNumber pad sequences properly', () => {
  assert.equal(formatMemberId(7, 2026), 'SGBM-2026-0007');
  assert.equal(formatReceiptNumber(142, 2026), 'SEVA-2026-0142');
  assert.equal(normalizePhone('+91-98111-22333'), '9811122333');
});

test('buildUpiUri encodes payee, amount, and INR currency', () => {
  const uri = buildUpiUri({
    vpa: 'garhveermath@sbi',
    payeeName: 'Shri Garhveer Baba Math',
    amount: 1101,
    note: 'Annakshetra Seva',
  });
  assert.ok(uri.startsWith('upi://pay?'));
  assert.ok(uri.includes('pa=garhveermath%40sbi'));
  assert.ok(uri.includes('am=1101'));
  assert.ok(uri.includes('cu=INR'));
});

test('formatCurrencyINR and formatRelativeTime format expected strings', () => {
  assert.equal(formatCurrencyINR(1101), '₹1,101');
  const now = Date.UTC(2026, 10, 24, 12, 0, 0);
  const twoHoursAgo = new Date(now - 2 * 3600 * 1000).toISOString();
  assert.equal(formatRelativeTime(twoHoursAgo, now), '2h ago');
});

test('generateQrMatrix produces deterministic 25x25 matrix with corner finder rings', () => {
  const m1 = generateQrMatrix('SGBM-2026-0001');
  const m2 = generateQrMatrix('SGBM-2026-0001');
  const m3 = generateQrMatrix('SGBM-2026-0002');
  assert.equal(m1.length, 25);
  assert.equal(m1[0].length, 25);
  assert.deepEqual(m1, m2);
  assert.notDeepEqual(m1, m3);
  // Top-left finder corners and center
  assert.equal(m1[0][0], true);
  assert.equal(m1[1][1], false);
  assert.equal(m1[3][3], true);
  assert.equal(m1[0][7], false);
});

test('computeAdminSummary aggregates counts and verified vs pending totals', () => {
  const summary = computeAdminSummary(
    [
      {
        id: '1',
        memberCode: 'SGBM-2026-0001',
        name: 'A',
        gotra: 'G',
        phone: '9876543210',
        address: 'Addr',
        city: 'Jaipur',
        role: 'Devotee',
        status: MemberStatus.Approved,
        createdAt: '2026-11-20T00:00:00Z',
      },
      {
        id: '2',
        memberCode: 'SGBM-2026-0002',
        name: 'B',
        gotra: 'G',
        phone: '9876543211',
        address: 'Addr',
        city: 'Sikar',
        role: 'Devotee',
        status: MemberStatus.Pending,
        createdAt: '2026-11-21T00:00:00Z',
      },
    ],
    [
      {
        id: 'p1',
        authorName: 'A',
        category: PostCategory.Announcement,
        title: 'Title',
        content: 'Body text here',
        likes: 3,
        comments: [],
        createdAt: '2026-11-20T00:00:00Z',
      },
    ],
    [
      {
        id: 'd1',
        receiptNumber: 'SEVA-2026-0001',
        donorName: 'A',
        phone: '9876543210',
        amount: 1101,
        purpose: DonationPurpose.Annakshetra,
        utrReference: '431200001111',
        status: DonationStatus.Verified,
        createdAt: '2026-11-20T00:00:00Z',
      },
      {
        id: 'd2',
        receiptNumber: 'SEVA-2026-0002',
        donorName: 'B',
        phone: '9876543211',
        amount: 501,
        purpose: DonationPurpose.GauSeva,
        utrReference: '431200002222',
        status: DonationStatus.PendingVerification,
        createdAt: '2026-11-21T00:00:00Z',
      },
    ],
  );
  assert.equal(summary.totalMembers, 2);
  assert.equal(summary.pendingMembers, 1);
  assert.equal(summary.approvedMembers, 1);
  assert.equal(summary.totalPosts, 1);
  assert.equal(summary.verifiedDonationAmount, 1101);
  assert.equal(summary.pendingDonationAmount, 501);
});

test('validateIndianMobile, validateOtpCode, validateAdminPinFormat, and maskPhone work accurately', () => {
  assert.equal(validateIndianMobile('8127854042'), null);
  assert.equal(validateIndianMobile('+91 8127854042'), null);
  assert.ok(validateIndianMobile('12345'));

  assert.equal(validateOtpCode('123456'), null);
  assert.ok(validateOtpCode('1234'));
  assert.ok(validateOtpCode('12ab56'));

  assert.equal(validateAdminPinFormat('1952'), null);
  assert.equal(validateAdminPinFormat('195200'), null);
  assert.ok(validateAdminPinFormat('12'));

  assert.equal(maskPhone('8127854042'), '••••••4042');
});

import { getTranslations } from './i18n';

test('getTranslations provides complete non-empty English and Hindi strings', () => {
  const en = getTranslations('en');
  const hi = getTranslations('hi');
  assert.equal(Object.keys(en).length, Object.keys(hi).length);
  for (const key of Object.keys(en) as Array<keyof typeof en>) {
    assert.ok(en[key].trim().length > 0, `Missing EN key: ${key}`);
    assert.ok(hi[key].trim().length > 0, `Missing HI key: ${key}`);
  }
});
