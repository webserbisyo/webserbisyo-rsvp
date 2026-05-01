export function formatUserRoleLabel(value: string | null | undefined) {
  switch (value) {
    case "platform_admin":
      return "Platform Admin";
    case "client_owner":
      return "Client Admin";
    case "client_staff":
      return "Client Staff";
    default:
      return humanizeWords(value);
  }
}

function humanizeWords(value: string | null | undefined) {
  if (!value) {
    return "Team Member";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
