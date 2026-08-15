import React from 'react';
import { ShieldCheck, Sparkles, Mail, Lock, Heart, FileText, Shield, RotateCcw } from 'lucide-react';
import { LegalSection } from './LegalModal';

interface FooterProps {
  onOpenLegal: (section: LegalSection) => void;
  onOpenPricing: () => void;
  onOpenPresets: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onOpenPricing,
  onOpenPresets,
}) => {
  const supportEmail = 'sammia.rauf@gmail.com';

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800/80 mt-auto">
      {/* Top Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                ContentPilot<span className="text-indigo-400"> AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              The AI content co-pilot tailored for local small businesses, freelancers, and growing brands. Generate high-converting social posts, e-commerce listings, and review replies in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Firebase Secured
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Paddle Merchant of Record
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenPricing}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Pricing & Plans
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPresets}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Industry Preset Templates
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policy Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('terms');
                  }}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('privacy');
                  }}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/refund"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal('refund');
                  }}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Refund Policy
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}?subject=ContentPilot%20AI%20Inquiry`}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 text-indigo-400 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ContentPilot AI. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal('terms');
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <span>•</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal('privacy');
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href="/refund"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal('refund');
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Refund Policy
            </a>
            <span>•</span>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal('contact');
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
