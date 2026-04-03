import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { getFirebaseErrorMessage } from "@/lib/utils/firebase-error";
import { toISOString } from "@/lib/utils/firestore";
import { AnnualRecord, AnnualRecordFormValues } from "@/types/annualRecord";

type SaveGovCredentialPayload = {
  clientId: string;
  recordId: string;
  govLogin: string;
  govPassword: string;
};

type SaveGovCredentialResponse = {
  govCredentialRef: string;
};

type GetGovCredentialPayload = {
  clientId: string;
  recordId: string;
};

type GetGovCredentialResponse = {
  govLogin: string;
  govPassword: string;
};

type DeleteGovCredentialPayload = {
  credentialId: string;
};

type DeleteGovCredentialResponse = {
  deleted: boolean;
};

type DeleteAnnualRecordPayload = {
  clientId: string;
  recordId: string;
};

type DeleteAnnualRecordResponse = {
  deleted: boolean;
  deletedCredentialId: string | null;
  year: number | null;
};

function annualRecordsCollection(clientId: string) {
  return collection(db, "clients", clientId, "annualRecords");
}

function annualRecordDocument(clientId: string, recordId: string) {
  return doc(db, "clients", clientId, "annualRecords", recordId);
}

function normalizeDriveLink(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function mapAnnualRecord(snapshot: Awaited<ReturnType<typeof getDoc>>) {
  return {
    id: snapshot.id,
    year: snapshot.get("year") as number,
    govLogin: snapshot.get("govLogin") as string,
    driveLink: normalizeDriveLink(snapshot.get("driveLink")),
    govCredentialRef: snapshot.get("govCredentialRef") as string | undefined,
    hasWithholding: snapshot.get("hasWithholding") as boolean,
    withholdingNotes: snapshot.get("withholdingNotes") as string,
    taxResultType: snapshot.get("taxResultType") as AnnualRecord["taxResultType"],
    taxResultAmount: snapshot.get("taxResultAmount") as number,
    status: snapshot.get("status") as AnnualRecord["status"],
    servicePaid: snapshot.get("servicePaid") as boolean,
    servicePaidAmount: snapshot.get("servicePaidAmount") as number,
    servicePaidAt: toISOString(snapshot.get("servicePaidAt")) ?? null,
    observation: snapshot.get("observation") as string,
    createdBy: snapshot.get("createdBy") as string,
    updatedBy: snapshot.get("updatedBy") as string,
    createdAt: toISOString(snapshot.get("createdAt")),
    updatedAt: toISOString(snapshot.get("updatedAt")),
  } satisfies AnnualRecord;
}

async function callSaveGovCredential(
  payload: SaveGovCredentialPayload,
): Promise<HttpsCallableResult<SaveGovCredentialResponse>> {
  const saveCredential = httpsCallable<SaveGovCredentialPayload, SaveGovCredentialResponse>(
    functions,
    "saveGovCredential",
  );

  return saveCredential(payload);
}

async function callGetGovCredential(
  payload: GetGovCredentialPayload,
): Promise<HttpsCallableResult<GetGovCredentialResponse>> {
  const readCredential = httpsCallable<GetGovCredentialPayload, GetGovCredentialResponse>(
    functions,
    "getGovCredential",
  );

  return readCredential(payload);
}

async function callDeleteGovCredential(
  payload: DeleteGovCredentialPayload,
): Promise<HttpsCallableResult<DeleteGovCredentialResponse>> {
  const deleteCredential = httpsCallable<DeleteGovCredentialPayload, DeleteGovCredentialResponse>(
    functions,
    "deleteGovCredential",
  );

  return deleteCredential(payload);
}

async function callDeleteAnnualRecord(
  payload: DeleteAnnualRecordPayload,
): Promise<HttpsCallableResult<DeleteAnnualRecordResponse>> {
  const deleteRecord = httpsCallable<DeleteAnnualRecordPayload, DeleteAnnualRecordResponse>(
    functions,
    "deleteAnnualRecord",
  );

  return deleteRecord(payload);
}

export async function listAnnualRecords(clientId: string) {
  try {
    const snapshot = await getDocs(query(annualRecordsCollection(clientId), orderBy("year", "desc")));
    return snapshot.docs.map<AnnualRecord>((item) => mapAnnualRecord(item));
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel listar os exercicios."));
  }
}

export async function getAnnualRecord(clientId: string, recordId: string) {
  try {
    const snapshot = await getDoc(annualRecordDocument(clientId, recordId));
    if (!snapshot.exists()) {
      return null;
    }

    return mapAnnualRecord(snapshot);
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel carregar o exercicio."));
  }
}

export async function createAnnualRecord(
  clientId: string,
  values: AnnualRecordFormValues,
  actorUid: string,
) {
  try {
    const ref = doc(annualRecordsCollection(clientId));

    await setDoc(ref, {
      year: values.year,
      govLogin: values.govLogin,
      driveLink: values.driveLink?.trim() ?? "",
      hasWithholding: values.hasWithholding,
      withholdingNotes: values.withholdingNotes,
      taxResultType: values.taxResultType,
      taxResultAmount: values.taxResultAmount,
      status: values.status,
      servicePaid: values.servicePaid,
      servicePaidAmount: values.servicePaidAmount,
      servicePaidAt: values.servicePaid ? serverTimestamp() : null,
      observation: values.observation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actorUid,
      updatedBy: actorUid,
    });

    if (values.updateGovPassword) {
      await saveGovCredential(clientId, ref.id, values.govLogin, values.govPassword);
    }

    return ref.id;
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel criar o exercicio."));
  }
}

export async function updateAnnualRecord(
  clientId: string,
  recordId: string,
  values: AnnualRecordFormValues,
  actorUid: string,
) {
  try {
    await updateDoc(annualRecordDocument(clientId, recordId), {
      year: values.year,
      govLogin: values.govLogin,
      driveLink: values.driveLink?.trim() ?? "",
      hasWithholding: values.hasWithholding,
      withholdingNotes: values.withholdingNotes,
      taxResultType: values.taxResultType,
      taxResultAmount: values.taxResultAmount,
      status: values.status,
      servicePaid: values.servicePaid,
      servicePaidAmount: values.servicePaidAmount,
      servicePaidAt: values.servicePaid ? serverTimestamp() : null,
      observation: values.observation,
      updatedAt: serverTimestamp(),
      updatedBy: actorUid,
    });

    if (values.updateGovPassword) {
      await saveGovCredential(clientId, recordId, values.govLogin, values.govPassword);
    }
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel atualizar o exercicio."));
  }
}

export async function duplicateAnnualRecord(
  clientId: string,
  sourceRecordId: string,
  newYear: number,
  actorUid: string,
) {
  const source = await getAnnualRecord(clientId, sourceRecordId);
  if (!source) {
    throw new Error("Registro de origem nao encontrado.");
  }

  return createAnnualRecord(
    clientId,
    {
      year: newYear,
      govLogin: source.govLogin,
      govPassword: "",
      updateGovPassword: false,
      driveLink: source.driveLink ?? "",
      hasWithholding: source.hasWithholding,
      withholdingNotes: source.withholdingNotes,
      taxResultType: source.taxResultType,
      taxResultAmount: source.taxResultAmount,
      status: "pendente",
      servicePaid: false,
      servicePaidAmount: 0,
      observation: source.observation,
    },
    actorUid,
  );
}

export async function saveGovCredential(
  clientId: string,
  recordId: string,
  govLogin: string,
  govPassword: string,
) {
  try {
    return await callSaveGovCredential({ clientId, recordId, govLogin, govPassword });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel salvar a credencial gov."));
  }
}

export async function getGovCredential(clientId: string, recordId: string) {
  try {
    const result = await callGetGovCredential({ clientId, recordId });
    return result.data;
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel ler a credencial gov."));
  }
}

export async function deleteGovCredential(credentialId: string) {
  try {
    await callDeleteGovCredential({ credentialId });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel excluir a credencial gov."));
  }
}

export async function deleteAnnualRecord(clientId: string, recordId: string) {
  try {
    await callDeleteAnnualRecord({ clientId, recordId });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel excluir o exercicio."));
  }
}
