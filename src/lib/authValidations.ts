import { z } from "zod";

// Password strength validation
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .max(255, "Email muito longo");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(50, "Nome deve ter no máximo 50 caracteres")
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras")
  .optional();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Password strength checker
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    hasMinLength12: boolean;
  };
} {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    hasMinLength12: password.length >= 12,
  };
  
  let score = 0;
  if (checks.minLength) score++;
  if (checks.hasMinLength12) score++;
  if (checks.hasUppercase) score++;
  if (checks.hasLowercase) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;
  
  if (score <= 2) return { score, label: "Fraca", color: "bg-destructive", checks };
  if (score <= 4) return { score, label: "Média", color: "bg-yellow-500", checks };
  return { score, label: "Forte", color: "bg-green-500", checks };
}

// Check if password has been leaked using Have I Been Pwned API (k-anonymity)
export async function checkPasswordLeaked(password: string): Promise<{
  isLeaked: boolean;
  occurrences: number;
}> {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Use k-anonymity: only send first 5 characters of hash
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Extra security
      },
    });
    
    if (!response.ok) {
      // HIBP API error - silently fail
      return { isLeaked: false, occurrences: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { isLeaked: true, occurrences: parseInt(count.trim(), 10) };
      }
    }
    
    return { isLeaked: false, occurrences: 0 };
  } catch (err: unknown) {
    // Silently fail - leaked password check should not block auth
    return { isLeaked: false, occurrences: 0 };
  }
}
