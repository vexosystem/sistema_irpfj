import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();
const encryptionSecret = defineSecret("GOV_CREDENTIAL_ENCRYPTION_KEY");

type SaveGovCredentialInput = {
  clientId: string;
  recordId: string;
  govLogin: string;
  govPassword: string;
};

type GetGovCredentialInput = {
  clientId: string;
  recordId: string;
};

type CipherPayload = {
  iv: string;
  tag: string;
  ciphertext: string;
};

function getKey(): Buffer {
  const secret = encryptionSecret.value();
  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  return key;
}

function encrypt(plainText: string): CipherPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

function decrypt(payload: CipherPayload): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

async function ensureOwner(uid: string): Promise<void> {
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists || userDoc.get("role") !== "owner" || userDoc.get("isActive") !== true) {
    throw new HttpsError("permission-denied", "Access denied.");
  }
}

export const saveGovCredential = onCall(
  { region: "southamerica-east1", secrets: [encryptionSecret] },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { clientId, recordId, govLogin, govPassword } = request.data as SaveGovCredentialInput;

    if (!clientId || !recordId || !govLogin || !govPassword) {
      throw new HttpsError("invalid-argument", "Missing required fields.");
    }

    await ensureOwner(request.auth.uid);

    const recordRef = db
      .collection("clients")
      .doc(clientId)
      .collection("annualRecords")
      .doc(recordId);

    const recordSnapshot = await recordRef.get();
    if (!recordSnapshot.exists) {
      throw new HttpsError("not-found", "Annual record not found.");
    }

    const credentialRef = db.collection("govCredentials").doc();
    const encrypted = encrypt(govPassword);
    const now = Timestamp.now();

    await credentialRef.set({
      clientId,
      recordId,
      govLogin,
      ...encrypted,
      createdAt: now,
      updatedAt: now,
      createdBy: request.auth.uid,
    });

    await recordRef.update({
      govLogin,
      govCredentialRef: credentialRef.id,
      updatedAt: now,
      updatedBy: request.auth.uid,
    });

    await db.collection("auditLogs").add({
      action: "save_gov_credential",
      entity: "annualRecord",
      entityId: recordId,
      before: null,
      after: { clientId, recordId, govCredentialRef: credentialRef.id, govLogin },
      actorUid: request.auth.uid,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { govCredentialRef: credentialRef.id };
  },
);

export const getGovCredential = onCall(
  { region: "southamerica-east1", secrets: [encryptionSecret] },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { clientId, recordId } = request.data as GetGovCredentialInput;

    if (!clientId || !recordId) {
      throw new HttpsError("invalid-argument", "Missing required fields.");
    }

    await ensureOwner(request.auth.uid);

    const recordSnapshot = await db
      .collection("clients")
      .doc(clientId)
      .collection("annualRecords")
      .doc(recordId)
      .get();

    if (!recordSnapshot.exists) {
      throw new HttpsError("not-found", "Annual record not found.");
    }

    const govCredentialRef = recordSnapshot.get("govCredentialRef") as string | undefined;
    const govLogin = recordSnapshot.get("govLogin") as string | undefined;

    if (!govCredentialRef || !govLogin) {
      throw new HttpsError("not-found", "Credential not found.");
    }

    const credentialSnapshot = await db.collection("govCredentials").doc(govCredentialRef).get();

    if (!credentialSnapshot.exists) {
      throw new HttpsError("not-found", "Encrypted credential not found.");
    }

    const govPassword = decrypt({
      iv: credentialSnapshot.get("iv") as string,
      tag: credentialSnapshot.get("tag") as string,
      ciphertext: credentialSnapshot.get("ciphertext") as string,
    });

    await db.collection("credentialAccessLogs").add({
      recordId,
      clientId,
      accessedAt: FieldValue.serverTimestamp(),
      actorUid: request.auth.uid,
    });

    return { govLogin, govPassword };
  },
);
