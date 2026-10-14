import { demoVisitorProfiles, type Conversation } from "@/lib/demo-data";
import { InboxAvatar, visitorLabel } from "./inbox-avatar";
import { StateBadge } from "./conversation-ui";
export function InboxVisitorDetails({
  conversation,
}: {
  conversation: Conversation;
}) {
  const profile = demoVisitorProfiles[conversation.id];
  const [browser, system] = conversation.browser.split(" · ");
  const rows = [
    ["Location", conversation.location],
    ["Local time", profile?.localTime || "Unavailable"],
    ["Timezone", conversation.timezone],
    ["Language", profile?.language || "Unavailable"],
    ["Device", /iOS|Android/.test(system || "") ? "Phone" : "Desktop"],
    ["Browser", browser],
    ["System", system || "Unavailable"],
    ["Current page", conversation.page],
    ["Came from", profile?.referrer || "Unavailable"],
    ["First seen", profile?.firstSeen || "Unavailable"],
    ["Last seen", profile?.lastSeen || "Unavailable"],
    ["Visits", String(conversation.visits)],
  ];
  return (
    <div className="inbox-visitor-content">
      <div className="inbox-visitor-identity">
        <InboxAvatar
          seed={conversation.id}
          label={visitorLabel(conversation)}
          size="lg"
        />
        <strong>{visitorLabel(conversation)}</strong>
        <span>Anonymous visitor</span>
      </div>
      <h3>Visitor</h3>
      <dl className="inbox-metadata">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3>Conversation</h3>
      <dl className="inbox-metadata">
        <div>
          <dt>ID</dt>
          <dd>#{conversation.id}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StateBadge state={conversation.state} compact />
          </dd>
        </div>
        {conversation.reason && (
          <div>
            <dt>Handoff</dt>
            <dd>{conversation.reason}</dd>
          </div>
        )}
      </dl>
      <p className="inbox-details-note">
        Sample visitor details. No live tracking is connected.
      </p>
    </div>
  );
}
