import { DeleteTxns } from "@/lib/server/db/transactions";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import UploadComponent from "@/components/manage/upload";
import DownloadComponent from "@/components/manage/download";

const deleteTxns = createServerFn({
  method: "POST",
}).handler(async () => {
  return DeleteTxns();
});

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  const deleter = useMutation({ mutationFn: useServerFn(deleteTxns) });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      {/* Upload Txns from file */}
      <UploadComponent />
      {/* Download Txns as file */}
      <DownloadComponent />

      {/* Delete All Txns */}
      <div className="card w-96 md:w-240 bg-base-100 card-md shadow-sm">
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
