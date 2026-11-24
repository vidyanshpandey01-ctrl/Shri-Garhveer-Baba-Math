export type AppLanguage = 'en' | 'hi';

export interface AppStrings {
  brandName: string;
  chooseLanguage: string;
  authTitlePhone: string;
  authTitleOtp: string;
  authTitlePin: string;
  authTitlePinSetup: string;
  authSubtitlePhone: string;
  mobileNumberLabel: string;
  mobilePlaceholder: string;
  sendOtpBtn: string;
  sendingOtpBtn: string;
  otpPromptPrefix: string;
  otpLabel: string;
  verifyContinueBtn: string;
  verifyingBtn: string;
  changeNumberBtn: string;
  resendOtpBtn: string;
  autofillBtn: string;
  simulatedSmsLabel: string;
  simulatedSmsBody: string;
  adminPinNotice: string;
  adminPinSetupNotice: string;
  secretPinLabel: string;
  chooseSecretPinLabel: string;
  confirmSecretPinLabel: string;
  unlockAdminEnterBtn: string;
  savePinEnterBtn: string;
  continueRegularBtn: string;
  navFeed: string;
  navMembership: string;
  navIdCard: string;
  navDonation: string;
  menuMyIdCard: string;
  menuAdminDashboard: string;
  menuUnlockAdmin: string;
  menuLanguageSwitch: string;
  menuSignOut: string;
  feedTitle: string;
  feedSubtitle: string;
  writePostBtn: string;
  closeComposerBtn: string;
  allUpdatesTab: string;
  upcomingGatherings: string;
  membershipTitle: string;
  membershipSubtitle: string;
  submitMembershipBtn: string;
  idCardPassSubtitle: string;
  downloadIdBtn: string;
  shareIdBtn: string;
  donationQrTitle: string;
  donationFormTitle: string;
  submitDonationBtn: string;
}

const EN_STRINGS: AppStrings = {
  brandName: 'Shri Garhveer Baba Math',
  chooseLanguage: 'Select Language / भाषा चुनें',
  authTitlePhone: 'Login or Create Account',
  authTitleOtp: 'Enter 6-Digit OTP',
  authTitlePin: 'Secret Admin PIN',
  authTitlePinSetup: 'Create Secret Admin PIN',
  authSubtitlePhone:
    'Verify your 10-digit mobile number via OTP to log in or create your Shri Garhveer Baba Math community profile.',
  mobileNumberLabel: 'Mobile Number',
  mobilePlaceholder: '10-digit mobile number',
  sendOtpBtn: 'Send Verification OTP',
  sendingOtpBtn: 'Sending OTP...',
  otpPromptPrefix: 'Enter the 6-digit OTP sent to',
  otpLabel: '6-Digit OTP',
  verifyContinueBtn: 'Verify & Continue',
  verifyingBtn: 'Verifying...',
  changeNumberBtn: 'Change Number',
  resendOtpBtn: 'Resend OTP',
  autofillBtn: 'Autofill',
  simulatedSmsLabel: 'Simulated SMS to',
  simulatedSmsBody: 'Your Shri Garhveer Baba Math verification OTP is',
  adminPinNotice:
    'Authorized Admin number verified. Enter your Secret Admin PIN to reveal the Admin Dashboard in your account menu.',
  adminPinSetupNotice:
    'Welcome, Super Admin. Set a 4–8 digit Secret Admin PIN (for example 1952) to protect your hidden Admin Dashboard.',
  secretPinLabel: 'Secret Admin PIN',
  chooseSecretPinLabel: 'Choose Secret Admin PIN',
  confirmSecretPinLabel: 'Confirm Secret Admin PIN',
  unlockAdminEnterBtn: 'Unlock Admin & Enter',
  savePinEnterBtn: 'Save PIN & Enter',
  continueRegularBtn: 'Continue as Regular Member',
  navFeed: 'Feed',
  navMembership: 'Membership',
  navIdCard: 'ID Card',
  navDonation: 'Donation',
  menuMyIdCard: 'My Digital ID Card',
  menuAdminDashboard: 'Admin Dashboard',
  menuUnlockAdmin: 'Unlock Admin Access',
  menuLanguageSwitch: 'भाषा: हिंदी में देखें',
  menuSignOut: 'Sign Out',
  feedTitle: 'Kutumb Community Wall',
  feedSubtitle: 'Share satsang updates, seva invitations, and Math announcements.',
  writePostBtn: 'Write Post',
  closeComposerBtn: 'Close Composer',
  allUpdatesTab: 'All Updates',
  upcomingGatherings: 'Upcoming Math Gatherings',
  membershipTitle: 'Online Membership Registration',
  membershipSubtitle:
    'Register your family profile with Shri Garhveer Baba Math to receive an official Digital ID Card.',
  submitMembershipBtn: 'Submit Membership Registration',
  idCardPassSubtitle: 'Official Community Identity Pass',
  downloadIdBtn: 'Download ID Card (PNG)',
  shareIdBtn: 'Share / Copy ID Details',
  donationQrTitle: 'Scan & Offer Seva via UPI',
  donationFormTitle: 'Record UPI Payment Reference',
  submitDonationBtn: 'Submit Payment Reference',
};

const HI_STRINGS: AppStrings = {
  brandName: 'श्री गढ़वीर बाबा मठ',
  chooseLanguage: 'भाषा चुनें / Select Language',
  authTitlePhone: 'लॉगिन या नया खाता बनाएं',
  authTitleOtp: '6 अंकों का OTP दर्ज करें',
  authTitlePin: 'गुप्त एडमिन PIN',
  authTitlePinSetup: 'गुप्त एडमिन PIN सेट करें',
  authSubtitlePhone:
    'श्री गढ़वीर बाबा मठ समुदाय में लॉगिन करने या नया खाता बनाने के लिए अपना 10 अंकों का मोबाइल नंबर OTP से सत्यापित करें।',
  mobileNumberLabel: 'मोबाइल नंबर',
  mobilePlaceholder: '10 अंकों का मोबाइल नंबर',
  sendOtpBtn: 'OTP भेजें',
  sendingOtpBtn: 'OTP भेजा जा रहा है...',
  otpPromptPrefix: 'इस नंबर पर भेजा गया 6 अंकों का OTP दर्ज करें:',
  otpLabel: '6 अंकों का OTP',
  verifyContinueBtn: 'सत्यापित करें और आगे बढ़ें',
  verifyingBtn: 'सत्यापन हो रहा है...',
  changeNumberBtn: 'नंबर बदलें',
  resendOtpBtn: 'पुनः OTP भेजें',
  autofillBtn: 'ऑटोफिल',
  simulatedSmsLabel: 'डेमो SMS संदेश:',
  simulatedSmsBody: 'श्री गढ़वीर बाबा मठ सत्यापन OTP है:',
  adminPinNotice:
    'अधिकृत एडमिन नंबर सत्यापित हो गया है। अपने अकाउंट मेनू में एडमिन डैशबोर्ड खोलने के लिए गुप्त एडमिन PIN दर्ज करें।',
  adminPinSetupNotice:
    'सुपर एडमिन का स्वागत है। अपने गुप्त एडमिन डैशबोर्ड की सुरक्षा के लिए 4–8 अंकों का गुप्त एडमिन PIN (उदा. 1952) सेट करें।',
  secretPinLabel: 'गुप्त एडमिन PIN',
  chooseSecretPinLabel: 'गुप्त एडमिन PIN चुनें',
  confirmSecretPinLabel: 'गुप्त एडमिन PIN की पुष्टि करें',
  unlockAdminEnterBtn: 'एडमिन खोलें और प्रवेश करें',
  savePinEnterBtn: 'PIN सहेजें और प्रवेश करें',
  continueRegularBtn: 'सामान्य सदस्य के रूप में आगे बढ़ें',
  navFeed: 'समुदाय',
  navMembership: 'सदस्यता',
  navIdCard: 'पहचान पत्र',
  navDonation: 'सेवा दान',
  menuMyIdCard: 'मेरा डिजिटल पहचान पत्र',
  menuAdminDashboard: 'एडमिन डैशबोर्ड',
  menuUnlockAdmin: 'एडमिन एक्सेस खोलें',
  menuLanguageSwitch: 'Language: Switch to English',
  menuSignOut: 'लॉग आउट',
  feedTitle: 'कुटुंब समुदाय मंच',
  feedSubtitle: 'सत्संग समाचार, सेवा निमंत्रण और मठ की घोषणाएं साझा करें।',
  writePostBtn: 'नई पोस्ट लिखें',
  closeComposerBtn: 'बंद करें',
  allUpdatesTab: 'सभी अपडेट',
  upcomingGatherings: 'आगामी मठ कार्यक्रम',
  membershipTitle: 'ऑनलाइन सदस्यता पंजीकरण',
  membershipSubtitle:
    'आधिकारिक डिजिटल पहचान पत्र प्राप्त करने के लिए श्री गढ़वीर बाबा मठ में अपना विवरण पंजीकृत करें।',
  submitMembershipBtn: 'सदस्यता पंजीकरण सबमिट करें',
  idCardPassSubtitle: 'आधिकारिक सामुदायिक पहचान पत्र',
  downloadIdBtn: 'पहचान पत्र डाउनलोड करें (PNG)',
  shareIdBtn: 'पहचान पत्र साझा / कॉपी करें',
  donationQrTitle: 'UPI स्कैन करें और सेवा दान दें',
  donationFormTitle: 'UPI भुगतान संदर्भ दर्ज करें',
  submitDonationBtn: 'भुगतान संदर्भ सबमिट करें',
};

export function getTranslations(lang: AppLanguage): AppStrings {
  return lang === 'hi' ? HI_STRINGS : EN_STRINGS;
}
