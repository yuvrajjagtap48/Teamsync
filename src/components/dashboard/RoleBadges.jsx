export function RoleBadges({ roles }) {
  if (!roles.length) {
    return null;
  }

  return (
    <div className="mt-2 flex gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {role.replace("_", " ")}
        </span>
      ))}
    </div>
  );
}
