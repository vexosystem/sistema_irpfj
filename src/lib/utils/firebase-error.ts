import { FirebaseError } from "firebase/app";

type ErrorWithCode = {
  code: string;
  message?: string;
};

const errorMessages: Record<string, string> = {
  "auth/invalid-credential": "Email ou senha invalidos.",
  "auth/invalid-login-credentials": "Email ou senha invalidos.",
  "auth/network-request-failed": "Falha de rede ao comunicar com o Firebase.",
  "permission-denied": "Voce nao tem permissao para executar esta operacao.",
  "storage/unauthorized": "Voce nao tem permissao para acessar este arquivo.",
  "storage/canceled": "O upload foi cancelado.",
  "storage/unknown": "Ocorreu um erro inesperado no armazenamento.",
  "functions/permission-denied": "Voce nao tem permissao para acessar esta funcionalidade.",
  "functions/unauthenticated": "Sua sessao expirou. Entre novamente.",
  "functions/not-found": "O recurso solicitado nao foi encontrado.",
  "functions/invalid-argument": "Os dados enviados para a operacao sao invalidos.",
  "functions/internal": "O servidor encontrou um erro interno.",
  "functions/data-loss": "O backend retornou uma credencial invalida.",
  "functions/failed-precondition": "A configuracao segura da function esta incompleta.",
};

function hasCode(error: unknown): error is ErrorWithCode {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

export function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    return errorMessages[error.code] ?? error.message ?? fallback;
  }

  if (hasCode(error)) {
    return errorMessages[error.code] ?? error.message ?? fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
