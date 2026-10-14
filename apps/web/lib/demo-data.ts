export type ConversationState = "ai" | "waiting" | "human" | "closed";
export type Message = {
  id: string;
  author: "visitor" | "agent" | "member" | "system";
  body: string;
  time: string;
  declined?: boolean;
};
export type Conversation = {
  id: string;
  visitor: string;
  initials: string;
  color: string;
  subject: string;
  state: ConversationState;
  time: string;
  location: string;
  timezone: string;
  browser: string;
  page: string;
  visits: number;
  reason?: string;
  messages: Message[];
};
export const stateLabels: Record<ConversationState, string> = {
  ai: "Agent handling",
  waiting: "Needs you",
  human: "Assigned to you",
  closed: "Closed",
};
export const demoConversations: Conversation[] = [
  {
    id: "1042",
    visitor: "Visitor 1042",
    initials: "42",
    color: "peach",
    subject: "A question about my refund",
    state: "waiting",
    time: "2m",
    location: "London, United Kingdom",
    timezone: "Europe/London",
    browser: "Chrome · macOS",
    page: "/account/orders",
    visits: 3,
    reason: "Visitor requested a human",
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "Hi! I requested a refund last week, but I haven’t received it yet. Could you check on it?",
        time: "10:42",
      },
      {
        id: "2",
        author: "agent",
        body: "Refunds usually take 5–10 business days after approval. If you’d like an update on your specific refund, I can bring in a person to help.",
        time: "10:42",
      },
      {
        id: "3",
        author: "visitor",
        body: "Yes please, I’d like to speak to someone.",
        time: "10:43",
      },
      {
        id: "4",
        author: "system",
        body: "Visitor requested a human. Waiting for you to join.",
        time: "10:43",
      },
    ],
  },
  {
    id: "1041",
    visitor: "Visitor 1041",
    initials: "41",
    color: "lilac",
    subject: "Can I connect my CRM?",
    state: "waiting",
    time: "8m",
    location: "Austin, United States",
    timezone: "America/Chicago",
    browser: "Safari · iOS",
    page: "/integrations",
    visits: 1,
    reason: "No relevant knowledge",
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "Do you integrate with Salesforce?",
        time: "10:37",
      },
      {
        id: "2",
        author: "agent",
        body: "I couldn’t find that in our knowledge base. I’m bringing in a person who can help you with this.",
        time: "10:37",
      },
    ],
  },
  {
    id: "1040",
    visitor: "Visitor 1040",
    initials: "40",
    color: "mint",
    subject: "Getting started with my account",
    state: "ai",
    time: "12m",
    location: "Berlin, Germany",
    timezone: "Europe/Berlin",
    browser: "Firefox · Windows",
    page: "/getting-started",
    visits: 2,
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "How do I reset my password?",
        time: "10:33",
      },
      {
        id: "2",
        author: "agent",
        body: "On the sign-in page, choose ‘Forgot password’, enter your account email, and follow the reset link in your inbox.",
        time: "10:33",
      },
    ],
  },
  {
    id: "1039",
    visitor: "Visitor 1039",
    initials: "39",
    color: "blue",
    subject: "Help updating an order",
    state: "human",
    time: "24m",
    location: "Toronto, Canada",
    timezone: "America/Toronto",
    browser: "Chrome · Android",
    page: "/account",
    visits: 4,
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "I need to update the address on my order.",
        time: "10:20",
      },
      {
        id: "2",
        author: "member",
        body: "Of course, I can help. Could you share your order number?",
        time: "10:21",
      },
    ],
  },
  {
    id: "1038",
    visitor: "Visitor 1038",
    initials: "38",
    color: "rose",
    subject: "Shipping to Canada",
    state: "ai",
    time: "32m",
    location: "Vancouver, Canada",
    timezone: "America/Vancouver",
    browser: "Safari · macOS",
    page: "/shipping",
    visits: 1,
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "Do you ship to Canada?",
        time: "10:13",
      },
      {
        id: "2",
        author: "agent",
        body: "Yes! We ship to Canada. Standard delivery takes 5–7 business days, according to our shipping guide.",
        time: "10:13",
      },
    ],
  },
  {
    id: "1037",
    visitor: "Visitor 1037",
    initials: "37",
    color: "sand",
    subject: "Found everything I needed",
    state: "closed",
    time: "1h",
    location: "Sydney, Australia",
    timezone: "Australia/Sydney",
    browser: "Chrome · Windows",
    page: "/help",
    visits: 2,
    messages: [
      {
        id: "1",
        author: "visitor",
        body: "Where can I download my receipt?",
        time: "09:40",
      },
      {
        id: "2",
        author: "agent",
        body: "Open Account → Orders, select your order, then choose Download receipt.",
        time: "09:40",
      },
      { id: "3", author: "visitor", body: "Got it, thank you!", time: "09:41" },
      {
        id: "4",
        author: "system",
        body: "Conversation closed.",
        time: "09:42",
      },
    ],
  },
];
export const demoSources = [
  {
    name: "Getting started.md",
    type: "Markdown",
    size: "24 KB",
    status: "ready",
  },
  {
    name: "Shipping & returns.pdf",
    type: "PDF",
    size: "1.2 MB",
    status: "ready",
  },
  {
    name: "Frequently asked questions",
    type: "Text",
    size: "18 KB",
    status: "ready",
  },
  {
    name: "Product guide.pdf",
    type: "PDF",
    size: "2.4 MB",
    status: "processing",
  },
] as const;

export const demoVisitorProfiles: Record<
  string,
  {
    localTime: string;
    language: string;
    firstSeen: string;
    lastSeen: string;
    referrer: string;
  }
> = {
  "1042": {
    localTime: "10:45",
    language: "English",
    firstSeen: "Last week",
    lastSeen: "2 minutes ago",
    referrer: "Direct visit",
  },
  "1041": {
    localTime: "04:37",
    language: "English",
    firstSeen: "Today",
    lastSeen: "8 minutes ago",
    referrer: "Search engine",
  },
  "1040": {
    localTime: "11:33",
    language: "German",
    firstSeen: "Yesterday",
    lastSeen: "12 minutes ago",
    referrer: "Direct visit",
  },
  "1039": {
    localTime: "05:21",
    language: "English",
    firstSeen: "Last month",
    lastSeen: "24 minutes ago",
    referrer: "Direct visit",
  },
  "1038": {
    localTime: "02:13",
    language: "English",
    firstSeen: "Today",
    lastSeen: "32 minutes ago",
    referrer: "Search engine",
  },
  "1037": {
    localTime: "20:45",
    language: "English",
    firstSeen: "Last month",
    lastSeen: "1 hour ago",
    referrer: "Direct visit",
  },
};
