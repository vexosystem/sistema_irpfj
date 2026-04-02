import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { ClientDocument } from "@/types/document";
import { toISOString } from "@/lib/utils/firestore";

function documentsCollection(clientId: string, recordId: string) {
  return collection(db, "clients", clientId, "annualRecords", recordId, "documents");
}

export async function listDocuments(clientId: string, recordId: string) {
  const snapshot = await getDocs(query(documentsCollection(clientId, recordId), orderBy("uploadedAt", "desc")));
  return snapshot.docs.map<ClientDocument>((item) => ({
    id: item.id,
    name: item.get("name") as string,
    storagePath: item.get("storagePath") as string,
    contentType: item.get("contentType") as string,
    size: item.get("size") as number,
    uploadedBy: item.get("uploadedBy") as string,
    uploadedAt: toISOString(item.get("uploadedAt")),
    category: item.get("category") as string,
  }));
}

export async function uploadDocument(
  clientId: string,
  recordId: string,
  file: File,
  category: string,
  actorUid: string,
) {
  const storagePath = `clients/${clientId}/annualRecords/${recordId}/documents/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: file.type });

  await addDoc(documentsCollection(clientId, recordId), {
    name: file.name,
    storagePath,
    contentType: file.type,
    size: file.size,
    uploadedAt: serverTimestamp(),
    uploadedBy: actorUid,
    category,
  });
}

export async function getDocumentDownloadUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}

export async function deleteDocument(clientId: string, recordId: string, documentId: string, storagePath: string) {
  await deleteObject(ref(storage, storagePath));
  await deleteDoc(doc(db, "clients", clientId, "annualRecords", recordId, "documents", documentId));
}
