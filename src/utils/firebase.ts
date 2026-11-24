import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSy...",                    // ← yahan apna API Key daalo
  authDomain: "shri-garhveer-baba-math.firebaseapp.com",
  projectId: "shri-garhveer-baba-math",
  storageBucket: "shri-garhveer-baba-math.appspot.com",
  messagingSenderId: "123456789",         // ← apna daalo
  appId: "1:123456789:web:abcdef",        // ← apna daalo
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let confirmationResult: ConfirmationResult | null = null;

export async function sendFirebaseOtp(phone: string) {
  const cleanPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

  // invisible reCAPTCHA
  const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });

  confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, verifier);
  return true;
}

export async function verifyFirebaseOtp(otp: string) {
  if (!confirmationResult) {
    throw new Error('OTP session expired. Please request again.');
  }

  const result = await confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    phone: (result.user.phoneNumber || '').replace('+91', ''),
  };
}
