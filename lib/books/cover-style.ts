// Front-cover title band styles. Shared by the picker (client), the live
// preview (client) and the cover PDF (server) so all three agree. Pure module —
// no server-only imports.

export type CoverTitleStyle = "klassisch" | "kopf" | "hell";

export const DEFAULT_COVER_TITLE_STYLE: CoverTitleStyle = "klassisch";

export const COVER_TITLE_STYLES: {
  value: CoverTitleStyle;
  label: string;
  hint: string;
}[] = [
  { value: "klassisch", label: "Klassisch", hint: "Dunkler Balken unten" },
  { value: "kopf", label: "Kopf", hint: "Dunkler Balken oben" },
  { value: "hell", label: "Hell", hint: "Heller Balken unten" },
];

export type CoverBandPlacement = {
  position: "top" | "bottom";
  tone: "dark" | "light";
};

export function coverBandPlacement(
  style: string | null | undefined,
): CoverBandPlacement {
  switch (style) {
    case "kopf":
      return { position: "top", tone: "dark" };
    case "hell":
      return { position: "bottom", tone: "light" };
    default:
      return { position: "bottom", tone: "dark" };
  }
}

export function normalizeCoverTitleStyle(
  value: string | null | undefined,
): CoverTitleStyle {
  return value === "kopf" || value === "hell" || value === "klassisch"
    ? value
    : DEFAULT_COVER_TITLE_STYLE;
}
