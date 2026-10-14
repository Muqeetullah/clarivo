export type PreviewSource = {
  id: string;
  name: string;
  size: string;
  status: "ready" | "processing" | "failed" | "local";
  error?: string;
};
export const initialPreviewSources: PreviewSource[] = [
  {
    id: "returns",
    name: "returns-policy.pdf",
    size: "242 KB",
    status: "ready",
  },
  {
    id: "shipping",
    name: "shipping-and-delivery.md",
    size: "14 KB",
    status: "ready",
  },
  { id: "faq", name: "faq.txt", size: "10 KB", status: "processing" },
  {
    id: "scan",
    name: "price-list-scan.pdf",
    size: "86 KB",
    status: "failed",
    error: "No text could be extracted from this sample file.",
  },
];
export const previewQuestions = [
  {
    question: "Do you ship to Canada?",
    answer:
      "Yes! Our sample shipping guide says delivery to Canada takes 5–7 business days.",
    source: "shipping",
  },
  {
    question: "What’s your refund policy?",
    answer:
      "Our sample returns policy allows returns within 30 days. Refunds take 5–10 business days after approval.",
    source: "returns",
  },
  { question: "How do I reset my password?", answer: "", source: "faq" },
  { question: "Which plan is right for my team?", answer: "", source: "scan" },
];
export const demoSnippet = `<!-- Preview only: this snippet is not connected -->\n<script\n  src="https://widget.example.com/widget.js"\n  data-workspace="demo-workspace"\n  async\n></script>`;
