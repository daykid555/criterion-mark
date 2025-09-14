import React from 'react';

const Table = ({ headers, children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-white/90 min-w-[900px]">
        <thead className="bg-white/10 text-xs uppercase">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="p-4 font-semibold opacity-80">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
