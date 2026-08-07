/**
 * @fileoverview Centralized error message handling for consistent user feedback
 * @module lib/errorMessages
 */

import { toast } from "sonner";

/**
 * Common error types mapped to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  "Failed to fetch": "Erro de conexão. Verifique sua internet e tente novamente.",
  "Network Error": "Sem conexão com o servidor. Tente novamente em alguns segundos.",
  "timeout": "A operação demorou muito. Tente novamente.",
  
  // Auth errors
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Por favor, confirme seu email antes de fazer login.",
  "User already registered": "Este email já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  
  // Permission errors
  "permission denied": "Você não tem permissão para esta ação.",
  "not authorized": "Sessão expirada. Faça login novamente.",
  "JWT expired": "Sua sessão expirou. Faça login novamente.",
  
  // Data errors
  "duplicate key": "Este registro já existe.",
  "violates foreign key": "Este item está vinculado a outros registros.",
  "null value in column": "Preencha todos os campos obrigatórios.",
  
  // Rate limiting
  "too many requests": "Muitas tentativas. Aguarde um momento.",
  "rate limit": "Limite de requisições atingido. Tente em alguns minutos.",
};

/**
 * Get a user-friendly error message from an error object or string
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "Ocorreu um erro inesperado.";
  
  const errorString = error instanceof Error 
    ? error.message 
    : typeof error === "string" 
      ? error 
      : JSON.stringify(error);
  
  // Check for known error patterns
  for (const [pattern, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }
  
  // Return original message if it's user-friendly (short and no technical terms)
  if (errorString.length < 100 && !errorString.includes("Error:") && !errorString.includes("undefined")) {
    return errorString;
  }
  
  return "Ocorreu um erro. Tente novamente.";
}

/**
 * Show an error toast with a user-friendly message
 */
export function showErrorToast(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const title = context ? `Erro ao ${context}` : "Erro";
  
  toast.error(title, {
    description: message,
    duration: 5000,
  });
}

/**
 * Show a success toast with consistent styling
 */
export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Error handlers for common mutation patterns
 */
export const errorHandlers = {
  create: (entity: string) => (error: Error) => {
    showErrorToast(error, `criar ${entity}`);
  },
  update: (entity: string) => (error: Error) => {
    showErrorToast(error, `atualizar ${entity}`);
  },
  delete: (entity: string) => (error: Error) => {
    showErrorToast(error, `excluir ${entity}`);
  },
  load: (entity: string) => (error: Error) => {
    showErrorToast(error, `carregar ${entity}`);
  },
};
