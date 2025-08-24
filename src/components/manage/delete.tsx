import { DeleteTxns } from "@/lib/server/db/transactions";
import { useMutation } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const deleteTxns = createServerFn({
  method: "POST",
}).handler(async () => {
  return DeleteTxns();
});

export default function Component() {
  const deleter = useMutation({ mutationFn: useServerFn(deleteTxns) });

  return (
    <Card className="w-96 md:w-240">
      <CardHeader>
        <CardTitle>Delete</CardTitle>
        <CardDescription>Delete all transactions.</CardDescription>
      </CardHeader>
      <CardFooter className="justify-between">
        <div>
          {deleter.isPending && <div className="p-4">Deleting...</div>}
          {deleter.isError && (
            <div className="text-red-500 p-4">{deleter.error.message}</div>
          )}
          {deleter.isSuccess && (
            <div className="text-green-500 p-4">
              Successfully deleted {deleter.data} transactions.
            </div>
          )}
        </div>
        <Button
          variant="destructive"
          onClick={async () => {
            await deleter.mutate({});
          }}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}