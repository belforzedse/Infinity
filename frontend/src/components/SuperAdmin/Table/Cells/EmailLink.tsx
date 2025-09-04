export default function SuperAdminTableCellEmailLink({
  email,
}: {
  email: string;
}) {
  return (
    <a className="text-sm text-actions-link" href={`mailto:${email}`}>
      {email}
    </a>
  );
}
