import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_school_portal_jwt_token_2026',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_portal',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'EduPulse Academy <alerts@edupulse.edu>',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  MAIL_FROM: process.env.MAIL_FROM || 'WeGrow B School <noreply@wegrowbschool.in>',
  MYDREAMS_WA_URL: process.env.MYDREAMS_WA_URL || 'https://wa.mydreamstechnology.in/',
  MYDREAMS_WA_LICENSE: process.env.MYDREAMS_WA_LICENSE || process.env.WHATSAPP_LICENSE_NUMBER || '',
  MYDREAMS_WA_API_KEY: process.env.MYDREAMS_WA_API_KEY || process.env.WHATSAPP_API_KEY || '',
  WHATSAPP_PROVIDER_URL: process.env.WHATSAPP_PROVIDER_URL || 'https://wa.mydreamstechnology.in/api/sendtemplate.php',
  WHATSAPP_LICENSE_NUMBER: process.env.WHATSAPP_LICENSE_NUMBER || '',
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY || '',
};
