import admin from 'firebase-admin';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  AdminRecord,
  AdminRole,
  AuthSessionUser,
  Donation,
  DonationPurpose,
  DonationStatus,
  MathBootstrapData,
  MathEvent,
  Member,
  MemberStatus,
  Post,
  PostCategory,
} from './src/types';
import {
  formatMemberId,
  formatReceiptNumber,
  normalizePhone,
  validateAdminPinFormat,
  validateDonationInput,
  validateIndianMobile,
  validateMembershipInput,
  validateOtpCode,
  validatePostInput,
} from './src/utils/mathLogic';

const PORT = 3000;
const ENV_ADMIN_PIN = (process.env.ADMIN_PIN || '').trim();
const SUPER_ADMIN_PHONE = normalizePhone(
  process.env.SUPER_ADMIN_PHONE || '8127854042',
);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'math-store.json');

interface PinHashRecord {
  salt: string;
  hash: string;
}

interface StoreState {
  posts: Post[];
  members: Member[];
  donations: Donation[];
  events: MathEvent[];
  admins: AdminRecord[];
  adminPinHash?: PinHashRecord;
  memberSeq: number;
  receiptSeq: number;
}

interface OtpChallenge {
  salt: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
}

interface SessionRecord {
  token: string;
  phone: string;
  adminVerified: boolean;
  pinAttempts: number;
  createdAt: number;
}

const otpChallenges = new Map<string, OtpChallenge>();
const sessions = new Map<string, SessionRecord>();

function hashOtp(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
}

function hashAdminPin(pin: string, salt?: string): PinHashRecord {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAdminPinConfigured(store: StoreState): boolean {
  return ENV_ADMIN_PIN.length > 0 || Boolean(store.adminPinHash?.hash);
}

function verifySecretPin(pin: string, store: StoreState): boolean {
  if (ENV_ADMIN_PIN.length > 0) {
    return timingSafeStringEqual(pin, ENV_ADMIN_PIN);
  }
  if (!store.adminPinHash?.salt || !store.adminPinHash?.hash) {
    return false;
  }
  const candidate = hashAdminPin(pin, store.adminPinHash.salt);
  return timingSafeStringEqual(candidate.hash, store.adminPinHash.hash);
}

function createSeedStore(): StoreState {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

  return {
    memberSeq: 4,
    receiptSeq: 4,
    admins: [
      {
        phone: SUPER_ADMIN_PHONE,
        name: 'Math Super Admin',
        role: AdminRole.SuperAdmin,
        addedAt: hoursAgo(240),
      },
    ],
    events: [
      {
        id: 'evt-1',
        title: 'Shri Garhveer Baba Monthly Satsang & Maha Aarti',
        dateLabel: 'Sunday, 29 Nov',
        timeLabel: '6:30 AM – 10:30 AM',
        location: 'Main Sanctum Courtyard',
      },
      {
        id: 'evt-2',
        title: 'Annakshetra Samuhik Prasad Bhandara',
        dateLabel: 'Wednesday, 2 Dec',
        timeLabel: '12:00 PM – 3:00 PM',
        location: 'Math Bhojanshala Hall',
      },
      {
        id: 'evt-3',
        title: 'Gau Seva & Winter Shelter Maintenance Drive',
        dateLabel: 'Saturday, 5 Dec',
        timeLabel: '8:00 AM – 1:00 PM',
        location: 'Shri Garhveer Gaushala',
      },
    ],
    members: [
      {
        id: 'mem-1',
        memberCode: 'SGBM-2026-0001',
        name: 'Rameshwar Sharma',
        gotra: 'Bharadwaj',
        phone: '9829011223',
        address: '14 Mandir Marg, Civil Lines',
        city: 'Jaipur',
        role: 'Prabandhak Committee',
        status: MemberStatus.Approved,
        createdAt: hoursAgo(240),
      },
      {
        id: 'mem-2',
        memberCode: 'SGBM-2026-0002',
        name: 'Savitri Devi Choudhary',
        gotra: 'Kashyap',
        phone: '9414055667',
        address: '28 Station Road, Ward 9',
        city: 'Sikar',
        role: 'Seva Volunteer',
        status: MemberStatus.Approved,
        createdAt: hoursAgo(120),
      },
      {
        id: 'mem-3',
        memberCode: 'SGBM-2026-0003',
        name: 'Mahendra Singh Rathore',
        gotra: 'Vashistha',
        phone: '9784122334',
        address: '72 Fort Colony, Near Bus Stand',
        city: 'Jhunjhunu',
        role: 'Devotee Member',
        status: MemberStatus.Pending,
        createdAt: hoursAgo(6),
      },
    ],
    posts: [
      {
        id: 'post-1',
        authorName: 'Rameshwar Sharma',
        authorGotra: 'Bharadwaj',
        authorCity: 'Jaipur',
        category: PostCategory.Announcement,
        title: 'Preparation Schedule for Monthly Maha Satsang & Annakshetra',
        content:
          'Jai Shri Garhveer Baba. All devotees and seva volunteers are requested to gather at the main sanctum courtyard by 6:00 AM this Sunday for morning Abhishek, Bhajan Sandhya, and Annakshetra Prasad Seva. Families traveling from Sikar and Jhunjhunu may register their arrival at the Yatri Niwas desk.',
        imageUrl: '/src/assets/images/math_sanctum_banner_1795533370707.jpg',
        likes: 28,
        pinned: true,
        comments: [
          {
            id: 'c-1',
            authorName: 'Savitri Devi Choudhary',
            authorCity: 'Sikar',
            text: 'Jai Baba ki. Our Sikar seva group will arrive Saturday evening to help with flower garlands and prasad preparation.',
            createdAt: hoursAgo(3),
          },
        ],
        createdAt: hoursAgo(5),
      },
      {
        id: 'post-2',
        authorName: 'Savitri Devi Choudhary',
        authorGotra: 'Kashyap',
        authorCity: 'Sikar',
        category: PostCategory.Seva,
        title: 'Successful Samuhik Prasad Seva — Over 450 Devotees Served',
        content:
          'With the blessings of Shri Garhveer Baba and tireless dedication from our youth volunteers, yesterday’s Annakshetra Bhandara concluded peacefully with warm sattvic prasad served to over 450 devotees and travelers.',
        imageUrl: '/src/assets/images/community_satsang_event_1795533370501.jpg',
        likes: 42,
        pinned: false,
        comments: [
          {
            id: 'c-2',
            authorName: 'Devendra Joshi',
            authorCity: 'Alwar',
            text: 'Heartfelt gratitude to all volunteers who arranged everything so respectfully.',
            createdAt: hoursAgo(14),
          },
        ],
        createdAt: hoursAgo(18),
      },
      {
        id: 'post-3',
        authorName: 'Pt. Govind Narayan',
        authorGotra: 'Gautam',
        authorCity: 'Garhveer Dham',
        category: PostCategory.Satsang,
        title: 'Morning Aarti & Veda Path Timings for Winter Months',
        content:
          'Please note the revised winter schedule at Shri Garhveer Baba Math: Mangala Aarti at 5:30 AM, Shringar Darshan at 8:00 AM, and Sandhya Deep Aarti at 6:15 PM daily. Devotees may offer Deepdan Seva before sunset.',
        likes: 19,
        pinned: false,
        comments: [],
        createdAt: hoursAgo(32),
      },
    ],
    donations: [
      {
        id: 'don-1',
        receiptNumber: 'SEVA-2026-0001',
        donorName: 'Rameshwar Sharma',
        phone: '9829011223',
        amount: 2101,
        purpose: DonationPurpose.Annakshetra,
        utrReference: '432819402218',
        status: DonationStatus.Verified,
        createdAt: hoursAgo(48),
      },
      {
        id: 'don-2',
        receiptNumber: 'SEVA-2026-0002',
        donorName: 'Kailash Chandra Agarwal',
        phone: '9828033445',
        amount: 5101,
        purpose: DonationPurpose.Renovation,
        utrReference: '432910448812',
        status: DonationStatus.Verified,
        createdAt: hoursAgo(20),
      },
      {
        id: 'don-3',
        receiptNumber: 'SEVA-2026-0003',
        donorName: 'Anita Devi Verma',
        phone: '9929144556',
        amount: 1101,
        purpose: DonationPurpose.GauSeva,
        utrReference: '433011902234',
        status: DonationStatus.PendingVerification,
        createdAt: hoursAgo(4),
      },
    ],
  };
}

function ensureAdminListConsistency(store: StoreState): StoreState {
  if (!Array.isArray(store.admins)) {
    store.admins = [];
  }
  const hasSuper = store.admins.some((a) => a.phone === SUPER_ADMIN_PHONE);
  if (!hasSuper) {
    store.admins.unshift({
      phone: SUPER_ADMIN_PHONE,
      name: 'Math Super Admin',
      role: AdminRole.SuperAdmin,
      addedAt: new Date().toISOString(),
    });
  } else {
    store.admins = store.admins.map((a) =>
      a.phone === SUPER_ADMIN_PHONE ? { ...a, role: AdminRole.SuperAdmin } : a,
    );
  }
  return store;
}

function loadStore(): StoreState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const seeded = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreState;
    return ensureAdminListConsistency(parsed);
  } catch {
    const seeded = createSeedStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function saveStore(store: StoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmpPath, STORE_PATH);
}

function buildSessionUser(
  session: SessionRecord,
  store: StoreState,
): AuthSessionUser {
  const adminEntry = store.admins.find((a) => a.phone === session.phone);
  return {
    phone: session.phone,
    isAuthorizedAdmin: Boolean(adminEntry),
    adminRole: adminEntry ? adminEntry.role : null,
    adminPinConfigured: isAdminPinConfigured(store),
    adminVerified: Boolean(adminEntry) && session.adminVerified,
  };
}

interface AuthenticatedRequest extends express.Request {
  authSession?: SessionRecord;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const requireAuth: express.RequestHandler = (req: AuthenticatedRequest, res, next) => {
    const header = String(req.header('authorization') || '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const session = token ? sessions.get(token) : undefined;
    if (!session) {
      res.status(401).json({ error: 'Authentication required. Please verify your mobile OTP.' });
      return;
    }
    req.authSession = session;
    next();
  };

  const requireAdmin: express.RequestHandler = (req: AuthenticatedRequest, res, next) => {
    requireAuth(req, res, () => {
      const session = req.authSession!;
      const store = loadStore();
      const adminEntry = store.admins.find((a) => a.phone === session.phone);
      if (!adminEntry || !session.adminVerified) {
        res.status(403).json({ error: 'Secret Admin PIN verification required.' });
        return;
      }
      next();
    });
  };

  const requireSuperAdmin: express.RequestHandler = (
    req: AuthenticatedRequest,
    res,
    next,
  ) => {
    requireAdmin(req, res, () => {
      const session = req.authSession!;
      const store = loadStore();
      const adminEntry = store.admins.find((a) => a.phone === session.phone);
      if (!adminEntry || adminEntry.role !== AdminRole.SuperAdmin) {
        res.status(403).json({ error: 'Only the Super Admin can manage Admin privileges.' });
        return;
      }
      next();
    });
  };

  // --- Auth Endpoints ---

  app.post('/api/auth/request-otp', (req, res) => {
    const rawPhone = String(req.body?.phone || '');
    const phoneErr = validateIndianMobile(rawPhone);
    if (phoneErr) {
      res.status(400).json({ error: phoneErr });
      return;
    }

    const cleanPhone = normalizePhone(rawPhone);
    const otp = String(crypto.randomInt(100000, 1000000));
    const salt = crypto.randomBytes(16).toString('hex');

    otpChallenges.set(cleanPhone, {
      salt,
      otpHash: hashOtp(otp, salt),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    res.json({
      ok: true,
      phone: cleanPhone,
      demoOtp: otp,
      expiresInSeconds: 300,
    });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const rawPhone = String(req.body?.phone || '');
    const rawOtp = String(req.body?.otp || '').trim();

    const phoneErr = validateIndianMobile(rawPhone);
    if (phoneErr) {
      res.status(400).json({ error: phoneErr });
      return;
    }
    const otpErr = validateOtpCode(rawOtp);
    if (otpErr) {
      res.status(400).json({ error: otpErr });
      return;
    }

    const cleanPhone = normalizePhone(rawPhone);
    const challenge = otpChallenges.get(cleanPhone);
    if (!challenge) {
      res.status(400).json({ error: 'No active OTP found. Please request a new OTP.' });
      return;
    }

    if (Date.now() > challenge.expiresAt) {
      otpChallenges.delete(cleanPhone);
      res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
      return;
    }

    challenge.attempts += 1;
    if (challenge.attempts > 5) {
      otpChallenges.delete(cleanPhone);
      res.status(429).json({ error: 'Too many invalid OTP attempts. Request a new OTP.' });
      return;
    }

    const candidateHash = hashOtp(rawOtp, challenge.salt);
    if (!timingSafeStringEqual(candidateHash, challenge.otpHash)) {
      res.status(401).json({ error: 'Incorrect 6-digit OTP. Please check and retry.' });
      return;
    }

    otpChallenges.delete(cleanPhone);
    const token = crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      phone: cleanPhone,
      adminVerified: false,
      pinAttempts: 0,
      createdAt: Date.now(),
    };
    sessions.set(token, session);

    const store = loadStore();
    res.json({
      token,
      user: buildSessionUser(session, store),
    });
  });

  app.post('/api/auth/setup-admin-pin', requireAuth, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    const store = loadStore();
    const adminEntry = store.admins.find((a) => a.phone === session.phone);
    if (!adminEntry) {
      res.status(403).json({ error: 'Unauthorized mobile number.' });
      return;
    }

    if (isAdminPinConfigured(store)) {
      res.status(409).json({ error: 'Secret Admin PIN is already configured.' });
      return;
    }

    const pin = String(req.body?.pin || '').trim();
    const pinErr = validateAdminPinFormat(pin);
    if (pinErr) {
      res.status(400).json({ error: pinErr });
      return;
    }

    store.adminPinHash = hashAdminPin(pin);
    saveStore(store);
    session.adminVerified = true;
    session.pinAttempts = 0;

    res.json({ user: buildSessionUser(session, store) });
  });

  app.post('/api/auth/verify-admin-pin', requireAuth, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    const store = loadStore();
    const adminEntry = store.admins.find((a) => a.phone === session.phone);
    if (!adminEntry) {
      res.status(403).json({ error: 'Unauthorized mobile number.' });
      return;
    }

    if (!isAdminPinConfigured(store)) {
      res.status(400).json({ error: 'Secret Admin PIN has not been set up yet.' });
      return;
    }

    const pin = String(req.body?.pin || '').trim();
    const pinErr = validateAdminPinFormat(pin);
    if (pinErr) {
      res.status(400).json({ error: pinErr });
      return;
    }

    if (session.pinAttempts >= 5) {
      res.status(429).json({
        error: 'Too many incorrect PIN attempts. Sign out and verify OTP again.',
      });
      return;
    }

    if (!verifySecretPin(pin, store)) {
      session.pinAttempts += 1;
      res.status(401).json({ error: 'Incorrect Secret Admin PIN.' });
      return;
    }

    session.adminVerified = true;
    session.pinAttempts = 0;
    res.json({ user: buildSessionUser(session, store) });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    sessions.delete(session.token);
    res.json({ ok: true });
  });

  // --- Community Portal Endpoints (Authenticated) ---

  app.get('/api/bootstrap', requireAuth, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    const store = loadStore();
    const adminEntry = store.admins.find((a) => a.phone === session.phone);
    const isVerifiedAdmin = Boolean(adminEntry) && session.adminVerified;

    const sortedPosts = [...store.posts].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

    const payload: MathBootstrapData = {
      posts: sortedPosts,
      members: store.members,
      donations: store.donations,
      events: store.events,
      admins: isVerifiedAdmin ? store.admins : undefined,
    };
    res.json(payload);
  });

  app.post('/api/posts', requireAuth, (req: AuthenticatedRequest, res) => {
    const {
      authorName = '',
      authorGotra = '',
      authorCity = '',
      category = PostCategory.Community,
      title = '',
      content = '',
      imageUrl = '',
    } = req.body ?? {};

    const validation = validatePostInput({
      authorName: String(authorName),
      title: String(title),
      content: String(content),
      category,
    });
    if (!validation.valid) {
      const firstErr = Object.values(validation.errors)[0] || 'Invalid post fields.';
      res.status(400).json({ error: firstErr, errors: validation.errors });
      return;
    }

    const safeImageUrl = String(imageUrl).trim();
    if (safeImageUrl && !safeImageUrl.startsWith('/src/assets/images/')) {
      res.status(400).json({ error: 'Invalid photo selection.' });
      return;
    }

    const store = loadStore();
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: String(authorName).trim(),
      authorGotra: String(authorGotra).trim() || undefined,
      authorCity: String(authorCity).trim() || undefined,
      category: Object.values(PostCategory).includes(category)
        ? category
        : PostCategory.Community,
      title: String(title).trim(),
      content: String(content).trim(),
      imageUrl: safeImageUrl || undefined,
      likes: 0,
      pinned: false,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    store.posts.unshift(newPost);
    saveStore(store);
    res.status(201).json(newPost);
  });

  app.post('/api/posts/:id/like', requireAuth, (req, res) => {
    const { id } = req.params;
    const delta = req.body?.delta === -1 ? -1 : 1;
    const store = loadStore();
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    post.likes = Math.max(0, post.likes + delta);
    saveStore(store);
    res.json(post);
  });

  app.post('/api/posts/:id/comments', requireAuth, (req, res) => {
    const { id } = req.params;
    const authorName = String(req.body?.authorName || '').trim();
    const authorCity = String(req.body?.authorCity || '').trim();
    const text = String(req.body?.text || '').trim();

    if (authorName.length < 2 || text.length < 2) {
      res.status(400).json({ error: 'Name and comment text are required.' });
      return;
    }

    const store = loadStore();
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    post.comments.push({
      id: `c-${Date.now()}`,
      authorName,
      authorCity: authorCity || undefined,
      text,
      createdAt: new Date().toISOString(),
    });
    saveStore(store);
    res.status(201).json(post);
  });

  app.post('/api/members', requireAuth, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    const {
      name = '',
      gotra = '',
      phone = session.phone,
      address = '',
      city = '',
      role = 'Devotee Member',
    } = req.body ?? {};

    const validation = validateMembershipInput({
      name: String(name),
      gotra: String(gotra),
      phone: String(phone),
      address: String(address),
      city: String(city),
      role: String(role),
    });

    if (!validation.valid) {
      const firstErr =
        Object.values(validation.errors)[0] || 'Invalid membership details.';
      res.status(400).json({ error: firstErr, errors: validation.errors });
      return;
    }

    const store = loadStore();
    const cleanPhone = normalizePhone(String(phone));
    const existing = store.members.find((m) => m.phone === cleanPhone);
    if (existing) {
      res.status(409).json({
        error: `A membership with mobile ${cleanPhone} already exists (${existing.memberCode}). Use Lookup to open your ID card.`,
      });
      return;
    }

    const seq = store.memberSeq++;
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      memberCode: formatMemberId(seq, 2026),
      name: String(name).trim(),
      gotra: String(gotra).trim(),
      phone: cleanPhone,
      address: String(address).trim(),
      city: String(city).trim(),
      role: String(role).trim() || 'Devotee Member',
      status: MemberStatus.Pending,
      createdAt: new Date().toISOString(),
    };

    store.members.unshift(newMember);
    saveStore(store);
    res.status(201).json(newMember);
  });

  app.get('/api/members/lookup', requireAuth, (req, res) => {
    const raw = String(req.query.q || '').trim();
    if (!raw) {
      res.status(400).json({ error: 'Enter a phone number or Member ID.' });
      return;
    }
    const store = loadStore();
    const normalizedPhone = normalizePhone(raw);
    const upperCode = raw.toUpperCase();

    const found = store.members.find(
      (m) => m.phone === normalizedPhone || m.memberCode.toUpperCase() === upperCode,
    );
    if (!found) {
      res.status(404).json({ error: 'No member record found for that phone or ID.' });
      return;
    }
    res.json(found);
  });

  app.post('/api/donations', requireAuth, (req, res) => {
    const {
      donorName = '',
      phone = '',
      amount = 0,
      purpose = DonationPurpose.General,
      utrReference = '',
    } = req.body ?? {};

    const numericAmount = Number(amount);
    const validation = validateDonationInput({
      donorName: String(donorName),
      phone: String(phone),
      amount: numericAmount,
      purpose,
      utrReference: String(utrReference),
    });

    if (!validation.valid) {
      const firstErr = Object.values(validation.errors)[0] || 'Invalid donation data.';
      res.status(400).json({ error: firstErr, errors: validation.errors });
      return;
    }

    const store = loadStore();
    const seq = store.receiptSeq++;
    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      receiptNumber: formatReceiptNumber(seq, 2026),
      donorName: String(donorName).trim(),
      phone: normalizePhone(String(phone)),
      amount: Math.round(numericAmount),
      purpose: Object.values(DonationPurpose).includes(purpose)
        ? purpose
        : DonationPurpose.General,
      utrReference: String(utrReference).trim().toUpperCase(),
      status: DonationStatus.PendingVerification,
      createdAt: new Date().toISOString(),
    };

    store.donations.unshift(newDonation);
    saveStore(store);
    res.status(201).json(newDonation);
  });

  // --- Admin Protected Endpoints ---

  app.patch('/api/admin/members/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const status = req.body?.status as MemberStatus;
    if (!Object.values(MemberStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid membership status.' });
      return;
    }
    const store = loadStore();
    const member = store.members.find((m) => m.id === id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    member.status = status;
    saveStore(store);
    res.json(member);
  });

  app.delete('/api/admin/members/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const store = loadStore();
    const idx = store.members.findIndex((m) => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    store.members.splice(idx, 1);
    saveStore(store);
    res.json({ deletedId: id });
  });

  app.patch('/api/admin/posts/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const store = loadStore();
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    post.pinned = Boolean(req.body?.pinned);
    saveStore(store);
    res.json(post);
  });

  app.delete('/api/admin/posts/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const store = loadStore();
    const idx = store.posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    store.posts.splice(idx, 1);
    saveStore(store);
    res.json({ deletedId: id });
  });

  app.patch('/api/admin/donations/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const status = req.body?.status as DonationStatus;
    if (!Object.values(DonationStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid donation status.' });
      return;
    }
    const store = loadStore();
    const donation = store.donations.find((d) => d.id === id);
    if (!donation) {
      res.status(404).json({ error: 'Donation record not found.' });
      return;
    }
    donation.status = status;
    saveStore(store);
    res.json(donation);
  });

  // --- Super Admin Role Management Endpoints ---

  app.post('/api/admin/admins', requireSuperAdmin, (req: AuthenticatedRequest, res) => {
    const session = req.authSession!;
    const rawPhone = String(req.body?.phone || '');
    const customName = String(req.body?.name || '').trim();

    const phoneErr = validateIndianMobile(rawPhone);
    if (phoneErr) {
      res.status(400).json({ error: phoneErr });
      return;
    }

    const cleanPhone = normalizePhone(rawPhone);
    const store = loadStore();

    const existing = store.admins.find((a) => a.phone === cleanPhone);
    if (existing) {
      res.status(409).json({ error: `Mobile ${cleanPhone} already has Admin access.` });
      return;
    }

    const matchedMember = store.members.find((m) => m.phone === cleanPhone);
    const newAdmin: AdminRecord = {
      phone: cleanPhone,
      name: customName || matchedMember?.name || 'Designated Admin',
      role: AdminRole.Admin,
      addedAt: new Date().toISOString(),
      addedBy: session.phone,
    };

    store.admins.push(newAdmin);
    saveStore(store);
    res.status(201).json(store.admins);
  });

  app.delete('/api/admin/admins/:phone', requireSuperAdmin, (req, res) => {
    const cleanPhone = normalizePhone(String(req.params.phone || ''));
    if (cleanPhone === SUPER_ADMIN_PHONE) {
      res.status(400).json({ error: 'Super Admin privileges cannot be revoked.' });
      return;
    }

    const store = loadStore();
    const idx = store.admins.findIndex((a) => a.phone === cleanPhone);
    if (idx === -1) {
      res.status(404).json({ error: 'Admin record not found.' });
      return;
    }

    store.admins.splice(idx, 1);
    saveStore(store);

    // Clear adminVerified on any active session for that phone
    for (const s of sessions.values()) {
      if (s.phone === cleanPhone) {
        s.adminVerified = false;
      }
    }

    res.json(store.admins);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shri Garhveer Baba Math server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
