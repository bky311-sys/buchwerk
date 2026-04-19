"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Inline styles: global-error renders before app CSS is available, so
  // Tailwind cannot be relied on here. Matches the Werkstatt 3b palette
  // (docs/DESIGN.md) as closely as possible with raw styles.
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#F5F1EB",
          color: "#1F1B15",
          minHeight: "100vh",
        }}
      >
        <main
          style={{
            maxWidth: "40rem",
            margin: "0 auto",
            padding: "6rem 1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#6B5E4F",
              margin: 0,
            }}
          >
            Buchwerk.info
          </p>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 500,
              lineHeight: 1.15,
              margin: "1rem 0 1.5rem",
            }}
          >
            Etwas ist schiefgelaufen.
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.55,
              color: "#6B5E4F",
              margin: 0,
            }}
          >
            Ein unerwarteter Fehler ist aufgetreten. Er wurde automatisch
            gemeldet, wir sehen ihn uns an.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#2E6B3D",
              color: "#FFFFFF",
              border: 0,
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Nochmal versuchen
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: "2.5rem",
                fontSize: "0.75rem",
                color: "#6B5E4F",
              }}
            >
              Referenz: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
