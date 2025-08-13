import { TxnSchema, UploadTxns } from "@/lib/server/db/transactions";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

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
    try {
      const json = JSON.parse(contents);
      const result = txnsSchema.safeParse(json);
      if (!result.success) {
        throw result.error.format();
      }
      UploadTxns(result.data);
    } catch (error) {
      throw new Error(`Received invalid JSON file: ${error}`);
    }
  });

const downloadTxns = createServerFn({
  method: "GET",
}).handler(async () => {
  return '{["sample", "json"]}';
});

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <>
      {/* Upload Txns from file */}
      <div className="p-4">
        <h2 className="text-2xl mb-4">Upload transactions as JSON</h2>
        <form
          method="post"
          encType="multipart/form-data"
          className="flex items-center gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);
            const form = e.currentTarget;
            const formData = new FormData(form);
            try {
              await uploadTxns({ data: formData });
              setSuccess("File uploaded successfully!");
              form.reset();
            } catch (err) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("An unknown error occurred");
              }
            }
          }}
        >
          <input
            type="file"
            name="json-file"
            accept=".json"
            className="file-input file-input-bordered w-full max-w-xs"
            required
          />
          <button type="submit" className="btn btn-primary">
            Upload
          </button>
        </form>
        {error && <div className="text-red-500 p-4">{error}</div>}
        {success && <div className="text-green-500 p-4">{success}</div>}
      </div>
      {/* Download Txns as file */}
      <div className="flex flex-row p-4 gap-4">
        <h2 className="text-2xl mb-4">Download transactions as JSON</h2>
        <button
          className="btn btn-primary"
          onClick={async () => {
            const resp = await downloadTxns();
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
      </div>
    </>
  );
}