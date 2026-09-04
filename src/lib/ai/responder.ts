// Local, rule-based response engine for the RJ AI Assistant.
//
// This is a placeholder "brain" so the chat UI can be fully built and tested
// before a real AI API is connected. To integrate a real provider later,
// replace the body of getAssistantReply with a call to a server-side API
// route (e.g. POST /api/assistant) that holds the provider key server-side —
// never call an AI provider directly from the browser, and never hardcode
// an API key in this file or anywhere else in frontend code.

export interface ResponderResult {
  text: string;
  awaitingEmail?: boolean;
}

interface Topic {
  keywords: string[];
  text: string;
}

const TOPICS: Topic[] = [
  { keywords: ["bank account", "banking", "lloyds", "halifax", "monzo", "tide", "wise", "zempler"], text: "We help with UK personal and business bank account applications. Final approval always depends on the provider's own eligibility and verification checks. See our Banking Services page for details." },
  { keywords: ["company", "formation", "register", "incorporate", "companies house"], text: "We help you prepare and submit your UK company formation with Companies House. Registration is reviewed and approved independently by Companies House." },
  { keywords: ["virtual address", "registered address", "company address"], text: "We offer support setting up a UK registered office or virtual business address." },
  { keywords: ["kyc", "verification", "verify"], text: "We help you prepare documentation for KYC checks. Verification outcomes are always decided by the relevant provider or authority, and can't be guaranteed." },
  { keywords: ["ebay"], text: "We offer eBay store setup, listing setup, optimization, and management assistance — our primary e-commerce service. Account approval and any seller eligibility checks are entirely eBay's own decision, so we can't guarantee approval." },
  { keywords: ["shopify"], text: "We support Shopify store setup, design, product setup, and basic configuration." },
  { keywords: ["adsense", "monetiz"], text: "We help with Google AdSense readiness, application guidance, and monetization setup. We never guarantee AdSense approval — Google reviews every application independently." },
  { keywords: ["marketing", "seo", "social media", "advertising", "lead generation"], text: "Our digital marketing services cover SEO, social media marketing, content strategy, paid advertising, lead generation, website optimization, and e-commerce marketing." },
  { keywords: ["loan", "finance", "tide loan", "lending"], text: "We assist with eligible Tide business finance/loan applications. Final lending decisions are always made by Tide, based on their own assessment." },
  { keywords: ["location", "where are you", "office", "pakistan", "united kingdom"], text: "RJ Services supports clients across the United Kingdom and Pakistan. See our Locations page for details." },
  { keywords: ["faq", "question"], text: "You can find answers to common questions on our FAQ page." },
  { keywords: ["price", "cost", "fee", "how much"], text: "Pricing depends on your specific needs. The best way to get accurate details is to send us an enquiry." },
];

const GREETING = /^\s*(hi|hello|hey|salaam|assalam)\b[\s!.,]*$/i;
const ENQUIRY = /\b(contact|enquire|enquiry|speak|talk to|call me|get in touch)\b/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAssistantReply(userText: string, awaitingEmail: boolean): Promise<ResponderResult> {
  // Simulated latency so the typing indicator has something to show.
  // Remove once a real API call provides its own natural delay.
  await delay(500 + Math.random() * 500);

  const text = userText.toLowerCase();

  if (awaitingEmail) {
    const match = userText.match(EMAIL);
    if (match) {
      return {
        text: `Thanks, I've noted ${match[0]} along with your message. Our team will follow up soon. For a guaranteed response, you're also welcome to submit our contact form.`,
      };
    }
    return {
      text: "That doesn't look like a valid email address. Could you try again, or use our Contact page instead?",
      awaitingEmail: true,
    };
  }

  if (GREETING.test(text)) {
    return { text: "Hello! How can I help with your business needs today?" };
  }

  for (const topic of TOPICS) {
    if (topic.keywords.some((k) => text.includes(k))) {
      return { text: topic.text };
    }
  }

  if (ENQUIRY.test(text)) {
    return {
      text: "I'd be happy to help you get in touch. Could you share your email so our team can follow up? You're also welcome to use our Contact page directly.",
      awaitingEmail: true,
    };
  }

  return {
    text: "I'm not able to fully answer that yet, but our team can help. Feel free to ask me about banking, company formation, virtual addresses, KYC, eBay, Shopify, AdSense, digital marketing, or locations — or visit our Contact page.",
  };
}
