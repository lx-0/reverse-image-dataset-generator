export async function ask_secrets(keys) {
  console.log("Warning: Secrets management is not available in this environment");
  console.log("Required secrets:", keys.join(", "));
  return {};
}
