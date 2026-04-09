export const PASSWORD_POLICY_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, pelo menos 1 letra maiúscula, 1 número e 1 caractere especial';

const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export function isValidPasswordPolicy(password: string): boolean {
  return (
    password.length >= 8 &&
    UPPERCASE_REGEX.test(password) &&
    NUMBER_REGEX.test(password) &&
    SPECIAL_CHAR_REGEX.test(password)
  );
}
