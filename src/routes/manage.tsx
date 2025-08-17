import {
  DeleteTxns,
  GetTxns,
  TxnSchema,
  UploadTxns,
} from "@/lib/server/db/transactions";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import {
  fromError as fromZodError,
  createErrorMap,
} from "zod-validation-error";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

z.config({
  customError: createErrorMap({
    displayInvalidFormatDetails: true,
  }),
});

const txnsSchema = z.array(TxnSchema);

const uploadTxns = createServerFn({
  method: "POST",
  response: "data",
})
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Invalid form data");
    }
    const file = data.get("json-file");
    if (!(file instanceof File)) {
      throw new Error("Did not receive a valid file in uploaded form");
    }
    return {
      file: file,
    };
  })
  .handler(async ({ data: { file } }) => {
    const contents = await file.text();
    var json: any;
    try {
      json = JSON.parse(contents, (key, value) => {
        if (key === "date" && typeof value === "string") {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      throw new Error(`Received invalid JSON file: ${error}`);
    }
    const result = txnsSchema.safeParse(json);
    if (!result.success) {
      const err = fromZodError(result.error);
      throw new Error(
        `Transactions JSON did not have the expected schema: ${err.toString()}`
      );
    }
    var uploaded = 0;
    try {
      uploaded = await UploadTxns(result.data);
    } catch (error) {
      console.log(`Error uploading transactions: ${error}`);
      throw new Error("Error saving uploaded transactions to the database");
    }
    return uploaded;
  });

const downloadTxnsReqSchema = z.object({
  from: z.date(),
  to: z.date(),
});

const downloadTxns = createServerFn({
  method: "GET",
})
  .validator((req: unknown) => {
    return downloadTxnsReqSchema.parse(req);
  })
  .handler(async (ctx) => {
    const result = await GetTxns({ from: ctx.data.from, to: ctx.data.to });
    return JSON.stringify(
      result.txns,
      (key, value) => {
        if (key === "date" && typeof value === "string") {
          const date = new Date(value);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return value;
      },
      2
    );
  });

const deleteTxns = createServerFn({
  method: "POST",
}).handler(async () => {
  return DeleteTxns();
});

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  const uploader = useMutation({
    mutationFn: useServerFn(uploadTxns),
  });
  const deleter = useMutation({ mutationFn: useServerFn(deleteTxns) });
  const [downloadFrom, setDownloadFrom] = useState("2010-01-01");
  const [downloadTo, setDownloadTo] = useState(formatDate(new Date()));
  const downloadDates = validateDates({
    from: downloadFrom,
    to: downloadTo,
  });
  const downloader = useServerFn(downloadTxns);
  const [downloadError, setDownloadError] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      {/* Upload Txns from file */}
      <div className="card w-96 bg-base-100 card-md shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Uploads</h2>
          <p>Upload Transactions from a JSON file.</p>
          <input
            type="file"
            name="json-file"
            accept=".json"
            className="file-input file-input-bordered w-full max-w-xs"
            required
          />
          <div className="justify-end card-actions">
            <form
              method="post"
              encType="multipart/form-data"
              className="flex items-center gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                uploader.mutate({ data: formData });
              }}
            >
              <button type="submit" className="btn btn-primary">
                Upload
              </button>
            </form>
            {uploader.isPending && <div className="p-4">Uploading...</div>}
            {uploader.isError && (
              <div className="text-red-500 p-4">{uploader.error.message}</div>
            )}
            {uploader.isSuccess && (
              <div className="text-green-500 p-4">
                Successfully uploaded {uploader.data} transactions.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Download Txns as file */}
      <div className="card w-96 bg-base-100 card-md shadow-sm">
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
                setDownloadError("");
                if (downloadDates.error) {
                  return;
                }
                var resp: string;
                try {
                  resp = await downloader({
                    data: { from: downloadDates.from, to: downloadDates.to },
                  });
                } catch (error) {
                  setDownloadError(`Error downloading transactions: ${error}`);
                  return;
                }
                if (resp) {
                  const blob = new Blob([resp], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "all.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
            >
              Download
            </button>
            {downloadDates.error && (
              <div className="text-red-500 p-4">{downloadDates.message}</div>
            )}
            {downloadError && (
              <div className="text-red-500 p-4">{downloadError}</div>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Txns */}
      <div className="card w-96 bg-base-100 card-md shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Delete</h2>
          <p>Delete all transactions</p>
          <div className="justify-end card-actions">
            <button
              className="btn btn-error"
              onClick={async () => {
                await deleter.mutate({});
              }}
            >
              Delete
            </button>
            {deleter.isPending && <div className="p-4">Uploading...</div>}
            {deleter.isError && (
              <div className="text-red-500 p-4">{deleter.error.message}</div>
            )}
            {deleter.isSuccess && (
              <div className="text-green-500 p-4">
                Successfully deleted {deleter.data} transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
