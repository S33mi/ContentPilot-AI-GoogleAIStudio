export interface BusinessProfile {
  name: string;
  type: string;
  location: string;
  description: string;
  targetAudience: string;
  brandTone: string;
  workingHours: string;
}

export interface SocialPostDay {
  dayNumber: number;
  dayLabel: string; // e.g. "Day 1 - Monday"
  theme: string; // e.g. "Special Offer & Welcome"
  postType: 'Single Photo' | 'Reel / Short Video' | 'Carousel Post' | 'Story & Poll' | 'Behind The Scenes' | 'Customer Review Spotlight';
  caption: string;
  hashtags: string[];
  callToAction: string;
  visualIdea: string;
}

export interface SocialMediaPackResponse {
  weeklyTheme: string;
  posts: SocialPostDay[];
}

export interface ProductDescriptionRequest {
  productName: string;
  categoryOrType?: string;
  keyFeatures: string;
  targetBenefit?: string;
  priceOrPromo?: string;
}

export interface ProductDescriptionResponse {
  title: string;
  tagline: string;
  description: string; // 60-100 words compelling description
  bulletBenefits: string[];
  suggestedCallToAction: string;
}

export interface CustomerReplyRequest {
  customerMessage: string;
  messageType: 'Review' | 'Inquiry' | 'Complaint' | 'Compliment' | 'Custom';
  customerRating?: number; // 1-5 stars if review
}

export interface ReplyOption {
  id: string;
  style: 'Short & Friendly' | 'Professional & Polished' | 'Warm & Personal';
  replyText: string;
  whenToUse: string;
}

export interface CustomerReplyResponse {
  originalMessageSummary: string;
  replies: ReplyOption[];
}

export type GenerationMode = 'social' | 'product' | 'reply';

export type PlanTier = 'guest' | 'free' | 'starter' | 'pro' | 'unlimited';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: PlanTier;
  billingCycle?: 'monthly' | 'yearly';
  bonusGenerations: number;
  dailyGenerationsCount: number;
  lastGenerationDate: string;
  monthlyGenerationsCount: number;
  lastGenerationMonth: string;
  createdAt: string;
  paddleCustomerId?: string | null;
  paddleSubscriptionId?: string | null;
  paddlePriceId?: string | null;
  subscriptionStatus?: string | null;
  updatedAt?: string;
}

export interface UsageStatus {
  canGenerate: boolean;
  reason?: string;
  remainingText: string;
  remainingCount: number | 'unlimited';
  limitType: 'guest' | 'bonus' | 'daily' | 'monthly' | 'unlimited';
}

export interface SavedItem {
  id: string;
  createdAt: string;
  type: GenerationMode;
  businessName: string;
  title: string;
  content: any;
  isCloud?: boolean;
}
