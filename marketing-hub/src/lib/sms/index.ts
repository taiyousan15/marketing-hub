// src/lib/sms/index.ts
// SMS ライブラリエクスポート

export {
  sendSMS,
  sendBulkSMS,
  formatToE164,
  validatePhoneNumber,
  optimizeForJapan,
  isWithinSendingHours,
  calculateSegments,
  isOptoutMessage,
  getSMSSettings,
  processOptout,
  updateSMSStatus,
  type SMSSendOptions,
  type SMSSendResult,
  type SMSSettings,
} from './twilio-client';
