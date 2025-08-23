import { TxnSchema, UploadTxns } from "@/lib/server/db/transactions";
import { formatZodError } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";

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
      throw new Error(`invalid JSON file: ${error}`);
    }
    const result = txnsSchema.safeParse(json, { reportInput: true });
    if (!result.success) {
      const errorStr = formatZodError(result.error);
      throw new Error(
        `Transactions JSON did not have the expected schema: ${errorStr}`
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

export default function Component() {
  const uploader = useMutation({
    mutationFn: useServerFn(uploadTxns),
  });

  return (
    <div className="card w-96 md:w-240 bg-base-100 card-md shadow-sm">
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
            <button type="submit" className="btn btn-primary">
              Upload
            </button>
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
      </form>
    </div>
  );
}
