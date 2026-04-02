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
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { AnnualRecord, AnnualRecordFormValues } from "@/types/annualRecord";
import { toISOString } from "@/lib/utils/firestore";

function annualRecordsCollection(clientId: string) {
  return collection(db, "clients", clientId, "annualRecords");
}

export async function listAnnualRecords(clientId: string) {
  const snapshot = await getDocs(query(annualRecordsCollection(clientId), orderBy("year", "desc")));
  return snapshot.docs.map<AnnualRecord>((item) => ({
    id: item.id,
    year: item.get("year") as number,
    govLogin: item.get("govLogin") as string,
    govCredentialRef: item.get("govCredentialRef") as string | undefined,
    hasWithholding: item.get("hasWithholding") as boolean,
    withholdingNotes: item.get("withholdingNotes") as string,
    taxResultType: item.get("taxResultType") as AnnualRecord["taxResultType"],
    taxResultAmount: item.get("taxResultAmount") as number,
    status: item.get("status") as AnnualRecord["status"],
    servicePaid: item.get("servicePaid") as boolean,
    servicePaidAmount: item.get("servicePaidAmount") as number,
    servicePaidAt: toISOString(item.get("servicePaidAt")) ?? null,
    observation: item.get("observation") as string,
    createdBy: item.get("createdBy") as string,
    updatedBy: item.get("updatedBy") as string,
    createdAt: toISOString(item.get("createdAt")),
    updatedAt: toISOString(item.get("updatedAt")),
  }));
}

export async function getAnnualRecord(clientId: string, recordId: string) {
  const snapshot = await getDoc(doc(db, "clients", clientId, "annualRecords", recordId));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    year: snapshot.get("year") as number,
    govLogin: snapshot.get("govLogin") as string,
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

export async function createAnnualRecord(
  clientId: string,
  values: AnnualRecordFormValues,
  actorUid: string,
) {
  const ref = doc(annualRecordsCollection(clientId));

  await setDoc(ref, {
    year: values.year,
    govLogin: values.govLogin,
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

  if (values.govPassword) {
    await saveGovCredential(clientId, ref.id, values.govLogin, values.govPassword);
  }

  return ref.id;
}

export async function updateAnnualRecord(
  clientId: string,
  recordId: string,
  values: AnnualRecordFormValues,
  actorUid: string,
) {
  await updateDoc(doc(db, "clients", clientId, "annualRecords", recordId), {
    year: values.year,
    govLogin: values.govLogin,
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

  if (values.govPassword) {
    await saveGovCredential(clientId, recordId, values.govLogin, values.govPassword);
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
  const saveCredential = httpsCallable<
    {
      clientId: string;
      recordId: string;
      govLogin: string;
      govPassword: string;
    },
    { govCredentialRef: string }
  >(functions, "saveGovCredential");

  return saveCredential({ clientId, recordId, govLogin, govPassword });
}

export async function getGovCredential(clientId: string, recordId: string) {
  const readCredential = httpsCallable<
    { clientId: string; recordId: string },
    { govLogin: string; govPassword: string }
  >(functions, "getGovCredential");

  const result = await readCredential({ clientId, recordId });
  return result.data;
}
