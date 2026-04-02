import crypto from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

initializeApp();

const db = getFirestore();
const encryptionSecret = defineSecret("GOV_CREDENTIAL_ENCRYPTION_KEY");
const allowedOrigins = ["http://localhost:3000", "https://sistema-irpfj.vercel.app"];

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

type DeleteGovCredentialInput = {
  credentialId: string;
};

type DeleteAnnualRecordInput = {
  clientId: string;
  recordId: string;
};

type DeleteClientInput = {
  clientId: string;
};

type CipherPayload = {
  iv: string;
  tag: string;
  ciphertext: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getKey(): Buffer {
  const secret = encryptionSecret.value();

  if (!isNonEmptyString(secret)) {
    throw new HttpsError("failed-precondition", "Encryption secret not configured.");
  }

  return crypto.createHash("sha256").update(secret, "utf8").digest();
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

function parseSaveGovCredentialInput(data: unknown): SaveGovCredentialInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Invalid request payload.");
  }

  const { clientId, recordId, govLogin, govPassword } = data as Record<string, unknown>;

  if (
    !isNonEmptyString(clientId) ||
    !isNonEmptyString(recordId) ||
    !isNonEmptyString(govLogin) ||
    !isNonEmptyString(govPassword)
  ) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  return {
    clientId: clientId.trim(),
    recordId: recordId.trim(),
    govLogin: govLogin.trim(),
    govPassword,
  };
}

function parseGetGovCredentialInput(data: unknown): GetGovCredentialInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Invalid request payload.");
  }

  const { clientId, recordId } = data as Record<string, unknown>;

  if (!isNonEmptyString(clientId) || !isNonEmptyString(recordId)) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  return {
    clientId: clientId.trim(),
    recordId: recordId.trim(),
  };
}

function parseDeleteGovCredentialInput(data: unknown): DeleteGovCredentialInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Invalid request payload.");
  }

  const { credentialId } = data as Record<string, unknown>;

  if (!isNonEmptyString(credentialId)) {
    throw new HttpsError("invalid-argument", "Missing credential id.");
  }

  return { credentialId: credentialId.trim() };
}

function parseDeleteAnnualRecordInput(data: unknown): DeleteAnnualRecordInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Invalid request payload.");
  }

  const { clientId, recordId } = data as Record<string, unknown>;

  if (!isNonEmptyString(clientId) || !isNonEmptyString(recordId)) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  return {
    clientId: clientId.trim(),
    recordId: recordId.trim(),
  };
}

function parseDeleteClientInput(data: unknown): DeleteClientInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Invalid request payload.");
  }

  const { clientId } = data as Record<string, unknown>;

  if (!isNonEmptyString(clientId)) {
    throw new HttpsError("invalid-argument", "Missing client id.");
  }

  return { clientId: clientId.trim() };
}

async function deleteCredentialIfExists(credentialId: string | undefined): Promise<void> {
  if (!isNonEmptyString(credentialId)) {
    return;
  }

  await db.collection("govCredentials").doc(credentialId).delete();
}

async function deleteAnnualRecordCascade(clientId: string, recordId: string, actorUid: string): Promise<void> {
  const recordRef = db.collection("clients").doc(clientId).collection("annualRecords").doc(recordId);
  const recordSnapshot = await recordRef.get();

  if (!recordSnapshot.exists) {
    throw new HttpsError("not-found", "Annual record not found.");
  }

  const govCredentialRef = recordSnapshot.get("govCredentialRef");

  await deleteCredentialIfExists(isNonEmptyString(govCredentialRef) ? govCredentialRef : undefined);
  await recordRef.delete();

  await db.collection("auditLogs").add({
    action: "delete_annual_record",
    entity: "annualRecord",
    entityId: recordId,
    before: {
      clientId,
      recordId,
      govCredentialRef: isNonEmptyString(govCredentialRef) ? govCredentialRef : null,
    },
    after: null,
    actorUid,
    timestamp: FieldValue.serverTimestamp(),
  });
}

const callableOptions = {
  region: "southamerica-east1" as const,
  secrets: [encryptionSecret],
  cors: allowedOrigins,
};

export const saveGovCredential = onCall(callableOptions, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  await ensureOwner(request.auth.uid);
  const { clientId, recordId, govLogin, govPassword } = parseSaveGovCredentialInput(request.data);

  const recordRef = db
    .collection("clients")
    .doc(clientId)
    .collection("annualRecords")
    .doc(recordId);

  const recordSnapshot = await recordRef.get();
  if (!recordSnapshot.exists) {
    throw new HttpsError("not-found", "Annual record not found.");
  }

  const previousCredentialRef = recordSnapshot.get("govCredentialRef");
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

  if (isNonEmptyString(previousCredentialRef) && previousCredentialRef !== credentialRef.id) {
    await deleteCredentialIfExists(previousCredentialRef);
  }

  await db.collection("auditLogs").add({
    action: "save_gov_credential",
    entity: "annualRecord",
    entityId: recordId,
    before: isNonEmptyString(previousCredentialRef)
      ? { clientId, recordId, govCredentialRef: previousCredentialRef, govLogin }
      : null,
    after: { clientId, recordId, govCredentialRef: credentialRef.id, govLogin },
    actorUid: request.auth.uid,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { govCredentialRef: credentialRef.id };
});

export const getGovCredential = onCall(callableOptions, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  await ensureOwner(request.auth.uid);
  const { clientId, recordId } = parseGetGovCredentialInput(request.data);

  const recordSnapshot = await db
    .collection("clients")
    .doc(clientId)
    .collection("annualRecords")
    .doc(recordId)
    .get();

  if (!recordSnapshot.exists) {
    throw new HttpsError("not-found", "Annual record not found.");
  }

  const govCredentialRef = recordSnapshot.get("govCredentialRef");
  const govLogin = recordSnapshot.get("govLogin");

  if (!isNonEmptyString(govCredentialRef) || !isNonEmptyString(govLogin)) {
    throw new HttpsError("not-found", "Credential not found.");
  }

  const credentialSnapshot = await db.collection("govCredentials").doc(govCredentialRef).get();

  if (!credentialSnapshot.exists) {
    throw new HttpsError("not-found", "Encrypted credential not found.");
  }

  const iv = credentialSnapshot.get("iv");
  const tag = credentialSnapshot.get("tag");
  const ciphertext = credentialSnapshot.get("ciphertext");

  if (!isNonEmptyString(iv) || !isNonEmptyString(tag) || !isNonEmptyString(ciphertext)) {
    throw new HttpsError("data-loss", "Encrypted credential payload is invalid.");
  }

  const govPassword = decrypt({ iv, tag, ciphertext });

  await db.collection("credentialAccessLogs").add({
    recordId,
    clientId,
    accessedAt: FieldValue.serverTimestamp(),
    actorUid: request.auth.uid,
  });

  return { govLogin, govPassword };
});

export const deleteGovCredential = onCall(callableOptions, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  await ensureOwner(request.auth.uid);
  const { credentialId } = parseDeleteGovCredentialInput(request.data);

  await deleteCredentialIfExists(credentialId);

  await db.collection("auditLogs").add({
    action: "delete_gov_credential",
    entity: "govCredential",
    entityId: credentialId,
    before: { govCredentialRef: credentialId },
    after: null,
    actorUid: request.auth.uid,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { deleted: true };
});

export const deleteAnnualRecord = onCall(callableOptions, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  await ensureOwner(request.auth.uid);
  const { clientId, recordId } = parseDeleteAnnualRecordInput(request.data);

  await deleteAnnualRecordCascade(clientId, recordId, request.auth.uid);

  return { deleted: true };
});

export const deleteClient = onCall(callableOptions, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  await ensureOwner(request.auth.uid);
  const { clientId } = parseDeleteClientInput(request.data);

  const clientRef = db.collection("clients").doc(clientId);
  const clientSnapshot = await clientRef.get();

  if (!clientSnapshot.exists) {
    throw new HttpsError("not-found", "Client not found.");
  }

  const annualRecordsSnapshot = await clientRef.collection("annualRecords").get();

  for (const recordDoc of annualRecordsSnapshot.docs) {
    await deleteAnnualRecordCascade(clientId, recordDoc.id, request.auth.uid);
  }

  await clientRef.delete();

  await db.collection("auditLogs").add({
    action: "delete_client",
    entity: "client",
    entityId: clientId,
    before: { clientId, annualRecordsDeleted: annualRecordsSnapshot.size },
    after: null,
    actorUid: request.auth.uid,
    timestamp: FieldValue.serverTimestamp(),
  });

  return { deleted: true };
});
