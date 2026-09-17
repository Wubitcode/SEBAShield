/**
 * ============================================================
 * SEBAShield AI Backend
 * Worker Tests
 * ============================================================
 *
 * Purpose:
 * Verifies the public health endpoint and the authentication
 * boundary protecting the AI analysis endpoint.
 *
 * These tests deliberately do not invoke Workers AI.
 * ============================================================
 */

import {
  SELF,
} from "cloudflare:test";

import {
  describe,
  expect,
  it,
} from "vitest";

describe(
  "SEBAShield AI Backend",
  () => {
    /**
     * The health endpoint must be publicly available so the
     * service can be checked without authentication.
     */
    it(
      "returns a healthy service response",
      async () => {
        const response =
          await SELF.fetch(
            "https://example.com/health"
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.headers.get(
            "cache-control"
          )
        ).toBe("no-store");

        const body =
          await response.json();

        expect(body).toEqual({
          status: "ok",
          service:
            "sebashield-ai-backend",
        });
      }
    );

    /**
     * The AI endpoint must reject callers that do not provide a
     * Firebase ID token.
     *
     * This test stops before Workers AI is invoked, so it does not
     * consume AI inference quota.
     */
    it(
      "rejects unauthenticated AI analysis requests",
      async () => {
        const response =
          await SELF.fetch(
            "https://example.com/analyze",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                scanType:
                  "message",

                content:
                  "Test message",
              }),
            }
          );

        expect(
          response.status
        ).toBe(401);

        const body =
          await response.json();

        expect(body).toEqual({
          error: {
            code:
              "AUTH_REQUIRED",

            message:
              "Authentication is required.",
          },
        });
      }
    );

    /**
     * Unknown routes should not expose backend internals.
     */
    it(
      "returns 404 for an unknown endpoint",
      async () => {
        const response =
          await SELF.fetch(
            "https://example.com/not-found"
          );

        expect(
          response.status
        ).toBe(404);

        const body =
          await response.json();

        expect(body).toEqual({
          error: {
            code:
              "NOT_FOUND",

            message:
              "Endpoint not found.",
          },
        });
      }
    );

    /**
     * /analyze accepts POST only.
     */
    it(
      "rejects unsupported methods on the analyze endpoint",
      async () => {
        const response =
          await SELF.fetch(
            "https://example.com/analyze",
            {
              method: "GET",
            }
          );

        expect(
          response.status
        ).toBe(405);

        const body =
          await response.json();

        expect(body).toEqual({
          error: {
            code:
              "METHOD_NOT_ALLOWED",

            message:
              "Only POST requests are allowed.",
          },
        });
      }
    );
  }
);