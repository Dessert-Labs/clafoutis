interface TableRow {
  id: number;
  name: string;
  email: string;
  role: string;
}

const sampleData: TableRow[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer" },
  { id: 4, name: "Dan Brown", email: "dan@example.com", role: "Editor" },
  { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin" },
];

export function TablePreview() {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "rgb(var(--colors-table-border))" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              backgroundColor: "rgb(var(--colors-table-header-bg))",
              color: "rgb(var(--colors-table-header-text))",
            }}
          >
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {sampleData.map((row, i) => (
            <tr
              key={row.id}
              className="border-t transition-colors"
              style={{
                borderColor: "rgb(var(--colors-table-border))",
                backgroundColor:
                  i % 2 === 0
                    ? "rgb(var(--colors-table-row-bg))"
                    : "rgb(var(--colors-table-row-alt))",
                color: "rgb(var(--colors-table-text))",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgb(var(--colors-table-row-hover))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  i % 2 === 0
                    ? "rgb(var(--colors-table-row-bg))"
                    : "rgb(var(--colors-table-row-alt))";
              }}
            >
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3">{row.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
