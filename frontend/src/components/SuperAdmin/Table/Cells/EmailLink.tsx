export default function SuperAdminTableCellEmailLink({
  email,
}: {
  email: string;
}) {
  return (
    <a className="text-actions-link text-sm" href={`mailto:${email}`}>
      {email}
    </a>
  );
}
