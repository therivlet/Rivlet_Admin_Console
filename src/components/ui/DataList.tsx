import React from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}

export default function DataList<T>({
  rows,
  columns,
  rowKey,
  renderCard,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-2xl border border-line bg-card p-4 shadow-card">
            {renderCard(row)}
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-medium ${column.className || ''}`}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-line">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-ink ${column.className || ''}`}>{column.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
