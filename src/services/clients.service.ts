import {
  collection,
  collectionGroup,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Client, ClientFormValues } from "@/types/client";
import { toISOString } from "@/lib/utils/firestore";
import { onlyDigits } from "@/lib/utils/format";

function clientsCollection() {
  return collection(db, "clients");
}

export async function listClients() {
  const snapshot = await getDocs(query(clientsCollection(), orderBy("fullName")));
  return snapshot.docs.map<Client>((item) => ({
    id: item.id,
    fullName: item.get("fullName") as string,
    cpf: item.get("cpf") as string,
    cpfDigits: item.get("cpfDigits") as string,
    email: item.get("email") as string,
    phone: item.get("phone") as string,
    secondaryPhone: item.get("secondaryPhone") as string,
    isActive: item.get("isActive") as boolean,
    notesGeneral: item.get("notesGeneral") as string,
    createdBy: item.get("createdBy") as string,
    updatedBy: item.get("updatedBy") as string,
    createdAt: toISOString(item.get("createdAt")),
    updatedAt: toISOString(item.get("updatedAt")),
  }));
}

export async function getClient(clientId: string) {
  const snapshot = await getDoc(doc(db, "clients", clientId));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    fullName: snapshot.get("fullName") as string,
    cpf: snapshot.get("cpf") as string,
    cpfDigits: snapshot.get("cpfDigits") as string,
    email: snapshot.get("email") as string,
    phone: snapshot.get("phone") as string,
    secondaryPhone: snapshot.get("secondaryPhone") as string,
    isActive: snapshot.get("isActive") as boolean,
    notesGeneral: snapshot.get("notesGeneral") as string,
    createdBy: snapshot.get("createdBy") as string,
    updatedBy: snapshot.get("updatedBy") as string,
    createdAt: toISOString(snapshot.get("createdAt")),
    updatedAt: toISOString(snapshot.get("updatedAt")),
  } satisfies Client;
}

export async function getDashboardTotals() {
  const totalClients = await getCountFromServer(clientsCollection());
  const annualRecordsSnapshot = await getDocs(query(collectionGroup(db, "annualRecords")));

  const totals = annualRecordsSnapshot.docs.reduce(
    (accumulator, item) => {
      if (item.get("status") !== "finalizado") {
        accumulator.pending += 1;
      }
      if (item.get("servicePaid")) {
        accumulator.paid += 1;
      } else {
        accumulator.unpaid += 1;
      }
      return accumulator;
    },
    { pending: 0, paid: 0, unpaid: 0 },
  );

  return {
    totalClients: totalClients.data().count,
    ...totals,
  };
}

export async function createClient(values: ClientFormValues, actorUid: string) {
  const existingClients = await getDocs(query(clientsCollection()));
  const cpfDigits = onlyDigits(values.cpf);
  const duplicate = existingClients.docs.find((item) => item.get("cpfDigits") === cpfDigits);

  if (duplicate) {
    throw new Error("CPF ja cadastrado.");
  }

  const ref = doc(clientsCollection());

  await setDoc(ref, {
    fullName: values.fullName,
    cpf: cpfDigits,
    cpfDigits,
    email: values.email,
    phone: values.phone,
    secondaryPhone: values.secondaryPhone,
    isActive: values.isActive,
    notesGeneral: values.notesGeneral,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actorUid,
    updatedBy: actorUid,
  });

  return ref.id;
}

export async function updateClient(clientId: string, values: ClientFormValues, actorUid: string) {
  const cpfDigits = onlyDigits(values.cpf);
  await updateDoc(doc(db, "clients", clientId), {
    fullName: values.fullName,
    cpf: cpfDigits,
    cpfDigits,
    email: values.email,
    phone: values.phone,
    secondaryPhone: values.secondaryPhone,
    isActive: values.isActive,
    notesGeneral: values.notesGeneral,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });
}
