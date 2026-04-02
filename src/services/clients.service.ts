import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { getFirebaseErrorMessage } from "@/lib/utils/firebase-error";
import { toISOString } from "@/lib/utils/firestore";
import { onlyDigits } from "@/lib/utils/format";
import { Client, ClientFormValues } from "@/types/client";

type DeleteClientPayload = {
  clientId: string;
};

type DeleteClientResponse = {
  deleted: boolean;
};

function clientsCollection() {
  return collection(db, "clients");
}

function annualRecordsCollection(clientId: string) {
  return collection(db, "clients", clientId, "annualRecords");
}

function mapClient(snapshot: Awaited<ReturnType<typeof getDoc>>) {
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

async function callDeleteClient(
  payload: DeleteClientPayload,
): Promise<HttpsCallableResult<DeleteClientResponse>> {
  const deleteClientCallable = httpsCallable<DeleteClientPayload, DeleteClientResponse>(
    functions,
    "deleteClient",
  );

  return deleteClientCallable(payload);
}

export async function listClients() {
  try {
    const snapshot = await getDocs(query(clientsCollection(), orderBy("fullName")));
    return snapshot.docs.map<Client>((item) => mapClient(item));
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel listar os clientes."));
  }
}

export async function getClient(clientId: string) {
  try {
    const snapshot = await getDoc(doc(db, "clients", clientId));
    if (!snapshot.exists()) {
      return null;
    }

    return mapClient(snapshot);
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel carregar o cliente."));
  }
}

export async function getDashboardTotals() {
  try {
    const clientsSnapshot = await getDocs(clientsCollection());

    let pending = 0;
    let paid = 0;
    let unpaid = 0;

    for (const clientDoc of clientsSnapshot.docs) {
      const annualRecordsSnapshot = await getDocs(annualRecordsCollection(clientDoc.id));

      annualRecordsSnapshot.forEach((record) => {
        if (record.get("status") !== "finalizado") {
          pending += 1;
        }

        if (record.get("servicePaid") === true) {
          paid += 1;
        } else {
          unpaid += 1;
        }
      });
    }

    return {
      totalClients: clientsSnapshot.size,
      pending,
      paid,
      unpaid,
    };
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel carregar o dashboard."));
  }
}

export async function createClient(values: ClientFormValues, actorUid: string) {
  try {
    const cpfDigits = onlyDigits(values.cpf);
    const duplicateSnapshot = await getDocs(
      query(clientsCollection(), where("cpfDigits", "==", cpfDigits), limit(1)),
    );

    if (!duplicateSnapshot.empty) {
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
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel criar o cliente."));
  }
}

export async function updateClient(clientId: string, values: ClientFormValues, actorUid: string) {
  try {
    const cpfDigits = onlyDigits(values.cpf);
    const duplicateSnapshot = await getDocs(
      query(clientsCollection(), where("cpfDigits", "==", cpfDigits), limit(2)),
    );

    const duplicate = duplicateSnapshot.docs.find((item) => item.id !== clientId);
    if (duplicate) {
      throw new Error("CPF ja cadastrado.");
    }

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
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel atualizar o cliente."));
  }
}

export async function deleteClient(clientId: string) {
  try {
    await callDeleteClient({ clientId });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error, "Nao foi possivel excluir o cliente."));
  }
}
