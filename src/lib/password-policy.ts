const PASSWORD_MIN_LENGTH = 8;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export const PASSWORD_POLICY_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, pelo menos 1 letra maiúscula, 1 número e 1 caractere especial.';

export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push('no mínimo 8 caracteres');
  }

  if (!UPPERCASE_REGEX.test(password)) {
    errors.push('pelo menos 1 letra maiúscula');
  }

  if (!NUMBER_REGEX.test(password)) {
    errors.push('pelo menos 1 número');
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    errors.push('pelo menos 1 caractere especial');
  }

  return errors;
}

export function isPasswordPolicyValid(password: string): boolean {
  return validatePasswordPolicy(password).length === 0;
}
