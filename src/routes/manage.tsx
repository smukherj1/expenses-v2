import { TxnSchema, UploadTxns } from "@/lib/server/db/transactions";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod/v4";
import {
  fromError as fromZodError,
  createErrorMap,
} from "zod-validation-error";
import { useMutation } from "@tanstack/react-query";

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
      json = JSON.parse(contents);
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

const downloadTxns = createServerFn({
  method: "GET",
}).handler(async () => {
  return '{["sample", "json"]}';
});

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  const uploader = useMutation({
    mutationFn: useServerFn(uploadTxns),
  });

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
            const form = e.currentTarget;
            const formData = new FormData(form);
            uploader.mutate({ data: formData });
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
