export function getPasswordUpdateErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("different from the old") || normalized.includes("same password")) {
    return "A nova senha precisa ser diferente da senha anterior.";
  }
  if (normalized.includes("weak") || normalized.includes("password strength")) {
    return "Essa senha foi considerada fraca. Use letras maiúsculas e minúsculas, números e símbolos.";
  }
  if (normalized.includes("at least") || normalized.includes("characters")) {
    return "A senha não atende aos requisitos mínimos de segurança.";
  }
  if (normalized.includes("session") || normalized.includes("jwt") || normalized.includes("expired")) {
    return "A sessão de recuperação expirou. Solicite um novo código.";
  }
  return "Não foi possível alterar a senha. Tente uma senha diferente ou solicite um novo código.";
}
