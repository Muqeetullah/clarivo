# Clarivo vocabulary

Last updated: October 12, 2026

Initial glossary extracted from the supplied PRD; a separate glossary attachment was not provided.

- Workspace: one business account, with exactly one owner in v1.
- Owner: the business user who manages knowledge and answers conversations.
- Visitor: an anonymous website user, identified by a visitor token in the full product.
- Source: an uploaded PDF, Markdown, TXT file, or pasted text belonging to a workspace.
- Knowledge base: the workspace's ready sources and their indexed chunks.
- Agent: the AI support agent, enabled whenever at least one source is ready.
- Conversation state: ai (agent replies), waiting (awaiting owner), human (owner replies), closed (resolved).
- Handoff reason: low_confidence, no_relevant_knowledge, visitor_requested, or agent_off.
