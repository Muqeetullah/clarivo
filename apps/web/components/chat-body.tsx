"use client";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import styles from "./chat-body.module.css";

/** Message Markdown is untrusted. Images/HTML are excluded; attachments are deferred. */
export function ChatBody({ children }: { children: string }) {
  return <Streamdown
    mode="static"
    className={styles.body}
    controls={false}
    skipHtml
    allowedElements={["p", "br", "strong", "em", "del", "a", "code", "pre", "blockquote", "ul", "ol", "li", "hr", "h1", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td"]}
    rehypePlugins={[defaultRehypePlugins.sanitize]}
    linkSafety={{ enabled: false }}
    urlTransform={(url) => {
      try { return ["https:", "http:", "mailto:"].includes(new URL(url).protocol) ? url : ""; }
      catch { return ""; }
    }}
    components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}
  >{children}</Streamdown>;
}
