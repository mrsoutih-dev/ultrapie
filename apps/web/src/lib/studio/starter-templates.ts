export interface StarterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  promptKeyword: string;
  badge: string;
  badgeColor: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'saas-landing',
    name: 'AI SaaS Landing & Waitlist',
    category: 'Marketing',
    description: 'High-converting SaaS landing page with animated hero, interactive pricing tier switcher, customer testimonials, and waitlist modal.',
    promptKeyword: 'build a saas landing page with pricing',
    badge: 'Popular',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'database-crud',
    name: 'Fullstack Database & CRUD Hub',
    category: 'Fullstack',
    description: 'Connected to PostgreSQL 16.3 & Redis 7.2 with Prisma schema models, live search & filter, record editor, and interactive SQL console.',
    promptKeyword: 'build an inventory app with database',
    badge: 'Fullstack',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'ecommerce-store',
    name: 'Modern E-Commerce Storefront',
    category: 'Commerce',
    description: 'Product catalog with filter tabs, rating stars, responsive product detail modal, shopping cart drawer, and Stripe checkout preview.',
    promptKeyword: 'build an ecommerce store with cart',
    badge: 'Trending',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'ai-assistant',
    name: 'AI Chatbot & Knowledge Assistant',
    category: 'AI / LLM',
    description: 'Conversational chat interface with markdown code rendering, model parameter sliders, quick prompt library, and exportable transcript.',
    promptKeyword: 'build an ai chat assistant',
    badge: 'AI Core',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    id: 'crypto-fintech',
    name: 'Fintech & Crypto Portfolio',
    category: 'Finance',
    description: 'Live asset valuation sparklines, balance cards, transaction history, crypto buy/sell modal, and profit/loss distribution chart.',
    promptKeyword: 'build a crypto fintech portfolio dashboard',
    badge: 'Finance',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'dev-portfolio',
    name: 'Developer Portfolio & Tech Blog',
    category: 'Portfolio',
    description: 'Personal showcase with animated bio, GitHub activity timeline, tech stack badges, interactive project cards, and working contact form.',
    promptKeyword: 'build a developer portfolio with projects',
    badge: 'Showcase',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
];
