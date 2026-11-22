/** Caso inválido: payload + campo que deve aparecer em `fields` (com código opcional). */
export interface InvalidCase {
  nome: string;
  payload: unknown;
  /** Caminho esperado em `fields[].field` ("user_ids", "event.type", "(body)"). */
  field: string;
  /** Código zod esperado (invalid_type, too_small, invalid_string, invalid_enum_value, ...). */
  code?: string;
}

export interface ValidCase {
  nome: string;
  payload: unknown;
  /** Resultado esperado após defaults/trim (comparado com toEqual quando informado). */
  esperado?: unknown;
}

/** Fixtures de contrato de UMA função: válidos + inválidos por categoria. */
export interface ContractFixtures {
  valid: ValidCase[];
  /** Campo obrigatório ausente. */
  missing: InvalidCase[];
  /** Tipo incorreto (string onde é número, objeto onde é array...). */
  wrongType: InvalidCase[];
  /** Valor vazio ("" / [] / só espaços). */
  empty: InvalidCase[];
  /** Corpo que não é objeto (string/array/número) — para funções sem corpo, o que elas rejeitam. */
  notObject: InvalidCase[];
}

export const UUID_A = "8d6f2b1e-3c4a-4e5f-9a7b-1c2d3e4f5a6b";
export const UUID_B = "0f1e2d3c-4b5a-4968-8777-66554433aabb";
