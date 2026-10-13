"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { demoSources } from "@/lib/demo-data";

export function KnowledgeSources({ readySources }: { readySources: number }) {
  return (
    <div className="knowledge-page">
      <Card>
        <CardHeader>
          <div className="section-heading">
            <div>
              <CardTitle>Knowledge sources</CardTitle>
              <CardDescription>
                Example documents your agent can learn from.
              </CardDescription>
            </div>
            <Badge variant="secondary">{readySources} ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="source-table">
            {demoSources.map((source) => (
              <div className="source-row" key={source.name}>
                <span className="file-icon">
                  <FileText />
                </span>
                <div>
                  <strong>{source.name}</strong>
                  <span>
                    {source.type} · {source.size}
                  </span>
                </div>
                <Badge variant="outline">
                  {source.status === "ready" ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <MoreHorizontal data-icon="inline-start" />
                  )}
                  {source.status === "ready" ? "Ready" : "Processing"}
                </Badge>
              </div>
            ))}
          </div>
          <div className="upload-placeholder">
            <BookOpen />
            <h3>A little knowledge goes a long way</h3>
            <p>
              PDF, Markdown, TXT, and pasted text will be supported.
              <br />
              Document upload and AI ingestion are part of the next build.
            </p>
            <Badge variant="secondary">Demo sources · no files uploaded</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Answers with boundaries</CardTitle>
          <CardDescription>A helpful agent knows its limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="principles">
            <p>
              <ShieldCheck />
              Answers from your knowledge only
            </p>
            <p>
              <Check />
              Politely declines off-topic requests
            </p>
            <p>
              <ArrowRight />
              Hands off when it can’t answer confidently
            </p>
          </div>
          <p className="muted-note">
            These are the planned agent behaviors. This dashboard does not call
            an AI model yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
