  // --- Auth Endpoints ---

  // 1. Purana demo OTP (abhi rakh sakte ho testing ke liye)
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

  // ★★★ NAYA FIREBASE LOGIN ENDPOINT ★★★
  app.post('/api/auth/firebase-login', async (req, res) => {
    const idToken = String(req.body?.idToken || '');
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token required.' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      let phone = (decoded.phone_number || '').replace('+91', '').replace(/\D/g, '');

      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number from Firebase.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const session: SessionRecord = {
        token,
        phone,
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
    } catch (err) {
      console.error('Firebase token verify failed:', err);
      res.status(401).json({ error: 'Invalid or expired Firebase token.' });
    }
  });

  // Admin PIN endpoints
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
