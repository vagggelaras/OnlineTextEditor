import { Hocuspocus } from "@hocuspocus/server";
import jwt from "jsonwebtoken";
import * as Y from "yjs";
import { env } from "../config/env";
import { prisma } from "../config/database";
import type { AuthPayload } from "../middleware/auth";

export const hocuspocus = new Hocuspocus({
  debounce: 3000,
  maxDebounce: 10000,

  async onAuthenticate({ token: providerToken, requestHeaders }) {
    // Try provider token first (sent by frontend), then fall back to cookie
    let token = providerToken;

    if (!token) {
      const cookieHeader = (requestHeaders as Record<string, string>).cookie || "";
      const cookies = parseCookies(cookieHeader);
      token = cookies.token;
    }

    if (!token) {
      throw new Error("No token provided");
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
      // Accept both regular user tokens and shared-edit tokens
      if (payload.role === "shared-editor") {
        return { user: { userId: "shared", email: "shared-user" } };
      }
      return { user: payload as unknown as AuthPayload };
    } catch {
      throw new Error("Invalid or expired token");
    }
  },

  async onLoadDocument({ document, documentName }) {
    const doc = await prisma.document.findUnique({
      where: { id: documentName },
    });

    if (!doc) {
      throw new Error("Document not found");
    }

    // If we have saved Yjs state, apply it to the document
    if (doc.yjsState) {
      const update = new Uint8Array(doc.yjsState);
      Y.applyUpdate(document, update);
    } else if (doc.content) {
      // If no Yjs state but we have JSON content, initialize default content
      // The TipTap editor will handle rendering the JSON content on first load
      // We store it as a default XML fragment so new collaborators get the content
      const xmlFragment = document.getXmlFragment("default");
      // If the fragment is empty, the editor will load content from the prop
      if (xmlFragment.length === 0) {
        // Leave empty - the first client will sync their content
      }
    }
  },

  async onStoreDocument({ document, documentName }) {
    // Encode the full Yjs document state
    const state = Y.encodeStateAsUpdate(document);

    await prisma.document.updateMany({
      where: { id: documentName },
      data: {
        yjsState: Buffer.from(state),
        updatedAt: new Date(),
      },
    });
  },

  async onDisconnect({ documentName, context }) {
    const user = (context as any).user as AuthPayload;
    console.log(`User ${user?.email} disconnected from document ${documentName}`);
  },
});

// Simple cookie parser (no need for the full middleware)
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((pair) => {
    const [key, ...rest] = pair.split("=");
    const value = rest.join("=");
    if (key && value) {
      cookies[key.trim()] = decodeURIComponent(value.trim());
    }
  });

  return cookies;
}
