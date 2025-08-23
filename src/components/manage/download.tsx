import { useState } from "react";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function validateDates({ from, to }: { from: string; to: string }):
  | {
      error: true;
      message: string;
    }
  | {
      error: false;
      from: Date;
      to: Date;
    } {
  const f = new Date(from);
  if (isNaN(f.getTime())) {
    return {
      error: true,
      message: `${from} is not a valid date`,
    };
  }
  const t = new Date(to);
  if (isNaN(t.getTime())) {
    return {
      error: true,
      message: `${to} is not a valid date`,
    };
  }
  if (f > t) {
    return {
      error: true,
      message: `From date ${from} can't be after To date ${to}`,
    };
  }
  return {
    error: false,
    from: f,
    to: t,
  };
}

export default function Component() {
  const [downloadFrom, setDownloadFrom] = useState("2010-01-01");
  const [downloadTo, setDownloadTo] = useState(formatDate(new Date()));
  const downloadDates = validateDates({
    from: downloadFrom,
    to: downloadTo,
  });

  return (
    <div className="card w-96 md:w-240 bg-base-100 card-md shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Download</h2>
        <p>Download transactions as JSON.</p>
        <div className="justify-end card-actions">
          <label className="input">
            <span className="label">From</span>
            <input
              type="date"
              className="input"
              value={downloadFrom}
              onChange={(e) => setDownloadFrom(e.target.value)}
            />
          </label>
          <label className="input">
            <span className="label">To</span>
            <input
              type="date"
              className="input"
              value={downloadTo}
              onChange={(e) => setDownloadTo(e.target.value)}
            />
          </label>
          <button
            className="btn btn-primary"
            disabled={downloadDates.error}
            onClick={async () => {
              if (downloadDates.error) {
                return;
              }
              const params = new URLSearchParams({
                from: downloadDates.from.toISOString(),
                to: downloadDates.to.toISOString(),
              });
              const a = document.createElement("a");
              a.href = `/api/transactions?${params}`;
              a.download = "transactions.json";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            Download
          </button>
          <a></a>
          {downloadDates.error && (
            <div className="text-red-500 p-4">{downloadDates.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
