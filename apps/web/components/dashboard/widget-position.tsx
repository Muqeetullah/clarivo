"use client";
import { useState, type CSSProperties } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export function WidgetPosition({
  value,
  onChange,
  accent,
  foreground,
}: {
  value: string;
  onChange: (value: string) => void;
  accent: string;
  foreground: string;
}) {
  const [opened, setOpened] = useState<Record<string, boolean>>({
    left: true,
    right: true,
  });
  return (
    <div>
      <div
        className="widget-position-options"
        style={
          {
            "--position-accent": accent,
            "--position-foreground": foreground,
          } as CSSProperties
        }
      >
        {["left", "right"].map((side) => (
          <div
            key={side}
            className="widget-position-option"
            data-selected={value === side}
          >
            <label>
              <input
                type="radio"
                name="widget-position"
                value={side}
                checked={value === side}
                onChange={() => onChange(side)}
              />
              <span>Bottom {side}</span>
            </label>
            <div className="widget-position-scene" data-side={side}>
              <div className="position-browser-dots" aria-hidden="true">
                •••
              </div>
              <div className="position-page-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              {opened[side] && (
                <div className="position-mini-chat" aria-hidden="true">
                  <div>
                    <span>C</span> Your agent
                  </div>
                  <p>Hi! How can we help?</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="position-mini-launcher"
                aria-label={`${opened[side] ? "Close" : "Open"} ${side} widget example`}
                onClick={() =>
                  setOpened((current) => ({
                    ...current,
                    [side]: !current[side],
                  }))
                }
              >
                {opened[side] ? <ChevronDown /> : <MessageCircle />}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="position-help">
        Choose a corner. Try each launcher to open or close the example.
      </p>
    </div>
  );
}
