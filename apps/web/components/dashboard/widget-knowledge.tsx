"use client";

import { useState } from "react";
import {
  Check,
  FileText,
  UploadCloud,
  X,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PreviewSource } from "./widget-setup-data";

export function WidgetKnowledge({
  sources,
  setSources,
}: {
  sources: PreviewSource[];
  setSources: React.Dispatch<React.SetStateAction<PreviewSource[]>>;
}) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  function addFiles(files: File[]) {
    const errors: string[] = [];
    const added = files.flatMap((file) => {
      if (
        !/\.(pdf|md|txt)$/i.test(file.name) ||
        file.size > 10 * 1024 * 1024 ||
        !file.size
      ) {
        errors.push(
          `${file.name}: choose a nonempty PDF, Markdown or TXT file up to 10 MB.`,
        );
        return [];
      }
      return [
        {
          id: crypto.randomUUID(),
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          status: "local" as const,
        },
      ];
    });
    setSources((current) => [...current, ...added]);
    setError(errors.join(" "));
  }
  return (
    <section
      id="widget-knowledge"
      className="setup-section"
      aria-labelledby="knowledge-heading"
    >
      <div className="setup-section-heading">
        <h3 id="knowledge-heading">Knowledge base</h3>
        <p>Give your agent the knowledge to answer with confidence.</p>
      </div>
      <div className="setup-panel">
        <label
          className="setup-dropzone"
          data-dragging={dragging}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <UploadCloud aria-hidden="true" />
          <strong>Drop files here or choose files</strong>
          <span>PDF, Markdown or TXT, up to 10 MB each</span>
          <input
            type="file"
            className="setup-file-input"
            aria-label="Add knowledge files"
            multiple
            accept=".pdf,.md,.txt"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ul className="setup-sources" aria-label="Knowledge sources">
          {sources.map((source) => (
            <li key={source.id}>
              <span className="setup-file-icon">
                <FileText aria-hidden="true" />
              </span>
              <div className="setup-source-name">
                <strong>{source.name}</strong>
                <p>{source.error || source.size}</p>
              </div>
              <Badge
                variant="secondary"
                className="setup-source-status"
                data-status={source.status}
              >
                {source.status === "ready" ? (
                  <Check />
                ) : source.status === "failed" ? (
                  <TriangleAlert />
                ) : source.status === "processing" ? (
                  <LoaderCircle />
                ) : null}
                {
                  {
                    ready: "Ready",
                    processing: "Processing",
                    failed: "Failed",
                    local: "Added locally",
                  }[source.status]
                }
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${source.name}`}
                onClick={() =>
                  setSources((current) =>
                    current.filter((s) => s.id !== source.id),
                  )
                }
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
        {!sources.length && (
          <p className="setup-footnote">
            No sources yet. Add a file to try the upload interface.
          </p>
        )}
        <p className="setup-footnote">
          Sample statuses only. Files you select stay in this page; they aren’t
          uploaded or used to generate answers.
        </p>
      </div>
    </section>
  );
}
