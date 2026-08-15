import { BusinessProfile } from '../types';

export interface PresetBusiness {
  id: string;
  label: string;
  category: string;
  iconName: string;
  profile: BusinessProfile;
  sampleProduct?: {
    productName: string;
    keyFeatures: string;
    priceOrPromo: string;
  };
  sampleReply?: {
    customerMessage: string;
    messageType: 'Review' | 'Inquiry' | 'Complaint' | 'Compliment' | 'Custom';
  };
}

export const PRESET_BUSINESSES: PresetBusiness[] = [
  {
    id: 'coffee-shop',
    label: 'The Daily Grind Cafe',
    category: 'Coffee Shop & Bakery',
    iconName: 'Coffee',
    profile: {
      name: 'The Daily Grind Cafe',
      type: 'Artisanal Coffee Shop & Bakery',
      location: 'Downtown Austin, TX',
      description: 'Cozy neighborhood coffee shop specializing in locally roasted single-origin espresso, handcrafted matcha lattes, and fresh organic sourdough pastries made daily.',
      targetAudience: 'Local remote workers, college students, morning commuters, and coffee enthusiasts looking for a friendly vibe.',
      brandTone: 'Friendly, Warm, Energetic & Welcoming',
      workingHours: 'Mon-Fri: 6:30 AM - 6:00 PM, Sat-Sun: 7:30 AM - 5:00 PM',
    },
    sampleProduct: {
      productName: 'Iced Vanilla Oat Milk Draft Latte & Honey Almond Croissant Combo',
      keyFeatures: 'Smooth 18-hour cold brew infused with nitrogen, Madagascar vanilla bean syrup, creamy oat milk, paired with a flaky warm honey almond croissant.',
      priceOrPromo: '$9.50 Morning Combo Special (Save 15%)',
    },
    sampleReply: {
      customerMessage: 'I loved the cold brew, but it was really hard to find seating on Tuesday morning around 9 AM! Will you guys be adding more tables?',
      messageType: 'Review',
    },
  },
  {
    id: 'salon-spa',
    label: 'Glow & Grace Salon',
    category: 'Beauty & Hair Salon',
    iconName: 'Sparkles',
    profile: {
      name: 'Glow & Grace Studio',
      type: 'Hair Salon & Day Spa',
      location: 'Seattle, WA',
      description: 'Boutique eco-friendly hair studio offering custom balayage color, precision haircuts, scalp massages, and vegan hair treatments using non-toxic products.',
      targetAudience: 'Busy professionals, brides-to-be, and women seeking self-care and modern hair styling.',
      brandTone: 'Luxury, Pampering, Elegant & Refreshing',
      workingHours: 'Tue-Sat: 9:00 AM - 7:00 PM, Closed Sun & Mon',
    },
    sampleProduct: {
      productName: 'Signature Silk Gloss & Botanical Scalp Spa Treatment',
      keyFeatures: 'Includes deep detox clarifying scrub, 15-minute relaxing scalp massage, custom gloss glaze for brilliant shine, and blowout styling.',
      priceOrPromo: '$120 First-Time Guest Package',
    },
    sampleReply: {
      customerMessage: 'Hi! Do you take walk-ins for a hair trim on Saturday afternoons or do I need to book online in advance?',
      messageType: 'Inquiry',
    },
  },
  {
    id: 'clothing-boutique',
    label: 'Urban Aura Boutique',
    category: 'Apparel & Lifestyle',
    iconName: 'ShoppingBag',
    profile: {
      name: 'Urban Aura Boutique',
      type: 'Independent Women\'s Clothing & Accessories',
      location: 'Denver, CO',
      description: 'Curated apparel store featuring sustainable streetwear, cozy knitwear, handcrafted jewelry from local artisans, and capsule wardrobe staples.',
      targetAudience: 'Fashion-forward women aged 22-45 who appreciate ethical fashion and unique, high-quality outfit pieces.',
      brandTone: 'Trendy, Chic, Playful & Confident',
      workingHours: 'Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 6:00 PM',
    },
    sampleProduct: {
      productName: 'The Highland Oversized Cashmere Blend Sweater',
      keyFeatures: 'Ultra-soft recycled cashmere blend, relaxed slouchy fit, available in Oatmeal, Olive, and Terracotta. Machine-washable cold.',
      priceOrPromo: '$88 (15% off with code FALLVIBES)',
    },
    sampleReply: {
      customerMessage: 'I bought a dress yesterday and the zipper got stuck when I tried it at home. Can I exchange it for another size tomorrow?',
      messageType: 'Complaint',
    },
  },
  {
    id: 'freelance-designer',
    label: 'Studio Creative Co.',
    category: 'Freelance & Digital Services',
    iconName: 'Palette',
    profile: {
      name: 'Studio Creative Co.',
      type: 'Freelance Brand & Web Designer',
      location: 'Remote / Chicago, IL',
      description: 'Independent design studio helping small business owners build stand-out brand identities, custom Shopify websites, and conversion-focused marketing assets.',
      targetAudience: 'E-commerce founders, boutique owners, wellness practitioners, and creative service providers.',
      brandTone: 'Professional, Modern, Creative & Authoritative',
      workingHours: 'Mon-Fri: 9:00 AM - 5:00 PM CST',
    },
    sampleProduct: {
      productName: 'The 2-Week VIP Brand Identity Sprint',
      keyFeatures: 'Complete brand strategy, custom primary & secondary logos, typography system, brand color palette, and 10 ready-to-use Canva social templates.',
      priceOrPromo: 'Packages starting at $1,800',
    },
    sampleReply: {
      customerMessage: 'Your portfolio is stunning! How far in advance do I need to book if I want a website launch in November?',
      messageType: 'Inquiry',
    },
  },
  {
    id: 'fitness-studio',
    label: 'Pulse Pilates Studio',
    category: 'Fitness & Health',
    iconName: 'Dumbbell',
    profile: {
      name: 'Pulse Reformer Pilates',
      type: 'Boutique Reformer Pilates Studio',
      location: 'Miami, FL',
      description: 'High-energy reformer Pilates studio combining athletic resistance movements with rhythmic beats for a full-body sculpt experience.',
      targetAudience: 'Fitness enthusiasts, athletes recovering from injury, and individuals seeking strength, core stability, and posture alignment.',
      brandTone: 'Motivating, High-Energy, Empowering & Upbeat',
      workingHours: 'Mon-Sun: 6:00 AM - 8:00 PM (Class schedule varies)',
    },
    sampleProduct: {
      productName: 'New Member 3-Class Trial Pass',
      keyFeatures: 'Access to any Reformer Sculpt, Jumpboard, or Restorative class within 14 days. Complimentary grip socks included on first visit.',
      priceOrPromo: '$49 Introductory Offer (Reg. $105)',
    },
    sampleReply: {
      customerMessage: 'I have never tried Reformer Pilates before and I am nervous! Are the classes beginner friendly or will I feel out of place?',
      messageType: 'Inquiry',
    },
  },
];
