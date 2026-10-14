"use client";

import { useState, type PointerEvent } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDashboardThemeClass } from "@/components/dashboard-theme";
import { cn } from "@/lib/utils";

const basicColors = [
  { name: "Red", hex: "#f87171" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#4ade80" },
  { name: "Blue", hex: "#60a5fa" },
  { name: "Purple", hex: "#a78bfa" },
  { name: "Pink", hex: "#f472b6" },
  { name: "White", hex: "#ffffff" },
];
function toShade(hex: string) {
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  const h =
    delta === 0
      ? 0
      : max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}
function fromShade(h: number, s: number, v: number) {
  const c = v * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = v - c;
  const channels =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return `#${channels
    .map((n) =>
      Math.round((n + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function WidgetColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ selected: value, text: value });
  const [selection, setSelection] = useState({
    hex: value,
    hue: toShade(value).h,
  });
  if (draft.selected !== value) {
    setDraft({ selected: value, text: value });
    setError("");
  }
  if (selection.hex !== value) {
    setSelection({ hex: value, hue: toShade(value).h });
  }
  const theme = useDashboardThemeClass();
  const shade = toShade(value);
  // Preserve the chosen hue even when 8-bit RGB rounding leaves the hex unchanged.
  const hue = selection.hue;
  function update(h: number, s: number, v: number) {
    const hex = fromShade(h, clamp(s), clamp(v));
    setSelection({ hex, hue: h });
    setError("");
    onChange(hex);
  }
  function pickShade(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    update(
      hue,
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height,
    );
  }
  function commit(text: string) {
    const hex = text.trim().replace(/^#/, "");
    if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
      setError("Enter a valid hex color, such as #93c5fd.");
      return;
    }
    const next = `#${
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex
    }`.toLowerCase();
    setSelection({ hex: next, hue: toShade(next).h });
    setDraft({ selected: next, text: next });
    setError("");
    onChange(next);
  }
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" />}
        className="setup-custom-picker"
        aria-label="Choose custom accent color"
      >
        <Palette data-icon="inline-start" />
        Custom
      </PopoverTrigger>
      <PopoverContent
        className={cn(theme, "widget-color-popover")}
        align="start"
      >
        <PopoverHeader>
          <PopoverTitle>Choose a color</PopoverTitle>
          <PopoverDescription>
            Start with a basic color, then choose your shade.
          </PopoverDescription>
        </PopoverHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Basic colors</FieldLabel>
            <div
              className="picker-basic-colors"
              role="group"
              aria-label="Basic colors"
            >
              {basicColors.map((color) => (
                <Button
                  key={color.name}
                  variant="outline"
                  size="icon"
                  title={color.name}
                  aria-label={`Use ${color.name.toLowerCase()}`}
                  aria-pressed={value.toLowerCase() === color.hex}
                  style={{
                    background: color.hex,
                    color:
                      color.name === "White" || color.name === "Yellow"
                        ? "#171717"
                        : "#ffffff",
                  }}
                  onClick={() => commit(color.hex)}
                >
                  {value.toLowerCase() === color.hex && <Check />}
                </Button>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="picker-shade">Shade</FieldLabel>
            <div
              id="picker-shade"
              className="picker-shade-area"
              role="slider"
              tabIndex={0}
              aria-label="Color shade"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(shade.v * 100)}
              aria-valuetext={`${Math.round(shade.s * 100)} percent saturation, ${Math.round(shade.v * 100)} percent brightness`}
              aria-describedby="picker-shade-help"
              style={{ backgroundColor: `hsl(${hue} 100% 50%)` }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                pickShade(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  pickShade(e);
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 0.1 : 0.01;
                if (
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  update(
                    hue,
                    shade.s +
                      (e.key === "ArrowRight"
                        ? step
                        : e.key === "ArrowLeft"
                          ? -step
                          : 0),
                    shade.v +
                      (e.key === "ArrowUp"
                        ? step
                        : e.key === "ArrowDown"
                          ? -step
                          : 0),
                  );
                }
              }}
            >
              <span
                className="picker-shade-thumb"
                style={{
                  left: `${shade.s * 100}%`,
                  top: `${(1 - shade.v) * 100}%`,
                  background: value,
                }}
              />
            </div>
            <p id="picker-shade-help" className="picker-help">
              Drag to choose a shade. Arrow keys work too.
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="picker-hue">Color spectrum</FieldLabel>
            <Slider
              id="picker-hue"
              className="picker-hue-slider"
              aria-label="Color spectrum"
              min={0}
              max={359}
              step={1}
              value={[Math.round(hue)]}
              onValueChange={(next) =>
                update(
                  typeof next === "number" ? next : next[0],
                  shade.s || 0.65,
                  shade.v || 0.95,
                )
              }
            />
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="picker-hex">
              Hex color <span className="picker-optional">(optional)</span>
            </FieldLabel>
            <div className="picker-hex-row">
              <span style={{ background: value }} aria-hidden="true" />
              <Input
                id="picker-hex"
                value={draft.text}
                onChange={(e) => {
                  setDraft({ selected: value, text: e.target.value });
                  setError("");
                }}
                aria-invalid={!!error}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit(e.currentTarget.value);
                  }
                }}
              />
            </div>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
