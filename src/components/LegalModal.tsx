import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, FileText, Shield, RotateCcw, Mail, Copy, Check, ExternalLink, 
  Sparkles, Clock, Lock, CheckCircle2, ChevronRight, MessageSquare 
} from 'lucide-react';

export type LegalSection = 'terms' | 'privacy' | 'refund' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  initialSection?: LegalSection;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialSection = 'terms',
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<LegalSection>(initialSection);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');

  const supportEmail = 'sammia.rauf@gmail.com';

  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  const handleTabClick = (section: LegalSection) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/${section}`);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(
      `[ContentPilot AI] ${contactSubject}`
    )}&body=${encodeURIComponent(contactMessage || 'Hello ContentPilot AI Team,\n\n')}`;
    window.location.href = mailtoUrl;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />

          {/* Modal Container - Mobile Fullscreen Bottom-Sheet / Desktop Card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="relative w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                    Legal & Policy Center
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    ContentPilot AI • Last updated: August 2026
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs - Fully Mobile Scrollable */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => handleTabClick('terms')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                  activeSection === 'terms'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Service
              </button>

              <button
                onClick={() => handleTabClick('privacy')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                  activeSection === 'privacy'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Privacy Policy
              </button>

              <button
                onClick={() => handleTabClick('refund')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                  activeSection === 'refund'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refund Policy
              </button>

              <button
                onClick={() => handleTabClick('contact')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                  activeSection === 'contact'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Contact & Support
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-6">
              {/* ===================== TERMS OF SERVICE ===================== */}
              {activeSection === 'terms' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Terms of Service</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Effective Date: August 14, 2026</p>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">1. Acceptance of Terms</h4>
                    <p>
                      By accessing or using <strong>ContentPilot AI</strong> ("we", "our", or "the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">2. Description of the Service</h4>
                    <p>
                      ContentPilot AI provides AI-assisted content creation tools, including marketing copy, social media captions, product descriptions, customer review replies, and business profile management for small businesses and creators.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">3. User Accounts and Authentication</h4>
                    <p>
                      You may access basic features as a guest or sign in using Google Authentication powered by Firebase. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">4. Subscriptions, Payments & Billing</h4>
                    <p>
                      Paid subscriptions (Starter, Pro, Unlimited) are processed securely through <strong>Paddle.com</strong>, which acts as our Merchant of Record. By subscribing, you authorize recurring payments according to your selected billing interval (monthly or yearly). You can cancel your subscription at any time.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">5. Content Ownership & Acceptable Use</h4>
                    <p>
                      You retain full ownership and intellectual property rights to the business content and output generated via ContentPilot AI. You agree not to use the Service to generate illegal, defamatory, harmful, deceptive, or infringing content.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">6. AI Output Disclaimer</h4>
                    <p>
                      AI-generated outputs are produced using advanced machine learning models (Google Gemini). While we strive for high quality, generated content is provided "as is" and should be reviewed and verified by you prior to public distribution or commercial use.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">7. Contact Information</h4>
                    <p>
                      If you have questions regarding these Terms of Service, please reach out to us at{' '}
                      <a href={`mailto:${supportEmail}`} className="text-indigo-600 font-semibold hover:underline">
                        {supportEmail}
                      </a>.
                    </p>
                  </section>
                </div>
              )}

              {/* ===================== PRIVACY POLICY ===================== */}
              {activeSection === 'privacy' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Privacy Policy</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Effective Date: August 14, 2026</p>
                  </div>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">1. Information We Collect</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Account Information:</strong> When signing in with Google, we receive your name, email address, and profile photo.</li>
                      <li><strong>Business Profiles & Inputs:</strong> Business names, industry tags, descriptions, tones, and target audience data you enter.</li>
                      <li><strong>Generated Content & Saved Items:</strong> Content snippets, drafts, and review replies saved to your account.</li>
                      <li><strong>Payment Information:</strong> Handled securely by Paddle. We do not store your credit card or sensitive billing credentials.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">2. How We Use Your Information</h4>
                    <p>
                      We use your information exclusively to provide, personalize, and improve ContentPilot AI services, manage subscriptions, calculate generation limits, and provide customer support.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">3. Third-Party Services & Processors</h4>
                    <p>
                      We rely on trusted third-party partners to operate the application:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Firebase (Google LLC):</strong> User authentication and cloud Firestore database.</li>
                      <li><strong>Google Gemini AI:</strong> Processing prompts and generating marketing copy.</li>
                      <li><strong>Paddle.com:</strong> Merchant of Record for payment processing and subscription billing.</li>
                    </ul>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">4. Data Security & Retention</h4>
                    <p>
                      Your data is transmitted using modern SSL/TLS encryption. We retain your account data as long as your account remains active. You may request account deletion at any time by contacting support.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">5. Privacy Inquiries</h4>
                    <p>
                      To request data deletion or inquire about your personal data, email us at{' '}
                      <a href={`mailto:${supportEmail}`} className="text-indigo-600 font-semibold hover:underline">
                        {supportEmail}
                      </a>.
                    </p>
                  </section>
                </div>
              )}

              {/* ===================== REFUND POLICY ===================== */}
              {activeSection === 'refund' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Refund Policy</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Effective Date: August 14, 2026</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 text-slate-800">
                    <p className="font-medium text-slate-800">
                      You can cancel your subscription at any time. Access continues until the end of the current billing period.
                    </p>

                    <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                      <li>
                        <strong>Monthly plans</strong> are generally non-refundable.
                      </li>
                      <li>
                        <strong>Yearly plans</strong> may be refunded within 7 days of the initial purchase if usage is minimal.
                      </li>
                    </ul>

                    <p className="text-slate-600 text-xs">
                      All payments and refunds are processed securely through <strong>Paddle</strong>, our Merchant of Record.
                    </p>
                  </div>

                  <section className="space-y-2 pt-1">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">How to Request a Refund</h4>
                    <p>
                      To request a refund, contact us at{' '}
                      <a href={`mailto:${supportEmail}`} className="text-indigo-600 font-semibold hover:underline">
                        {supportEmail}
                      </a>{' '}
                      and include:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Your account email address</li>
                      <li>Paddle Order / Transaction ID (found in your receipt email)</li>
                    </ul>
                  </section>
                </div>
              )}

              {/* ===================== CONTACT & SUPPORT ===================== */}
              {activeSection === 'contact' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">Contact & Support</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">We are here to help you get the most out of ContentPilot AI.</p>
                  </div>

                  {/* Direct Contact Card */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Mail className="w-4 h-4 text-amber-400" />
                        Direct Support Email
                      </div>
                      <p className="text-base sm:text-xl font-mono font-bold text-white break-all">
                        {supportEmail}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-300">
                        Typical response time: within 24 hours
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleCopyEmail}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/20 min-h-[44px]"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Email
                          </>
                        )}
                      </button>

                      <a
                        href={`mailto:${supportEmail}?subject=ContentPilot%20AI%20Inquiry`}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md min-h-[44px]"
                      >
                        <Mail className="w-3.5 h-3.5" /> Open Mail Client
                      </a>
                    </div>
                  </div>

                  {/* Quick Contact Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" /> Send a Message
                    </h4>

                    <form onSubmit={handleSendEmail} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Inquiry Subject
                        </label>
                        <select
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                        >
                          <option value="General Inquiry">General Inquiry / Feedback</option>
                          <option value="Billing & Subscription Question">Billing & Subscription Question</option>
                          <option value="Refund Request">Refund Request</option>
                          <option value="Bug Report or Feature Request">Bug Report or Feature Request</option>
                          <option value="Custom Business Plan">Custom Business / Agency Plan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Your Message
                        </label>
                        <textarea
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Type your question or message here..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-300" />
                        Compose Email to {supportEmail}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Paddle Merchant of Record</span>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer min-h-[38px]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
