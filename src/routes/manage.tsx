import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

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
      console.log(json);
    } catch (error) {
      return new Error(`Received invalid JSON file: ${error}`);
    }
  });

export const Route = createFileRoute("/manage")({
  component: Manage,
});

function Manage() {
  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Upload transactions as JSON</h2>
      <form
        method="post"
        encType="multipart/form-data"
        className="flex items-center gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const resp = await uploadTxns({ data: formData });
          if (resp) {
            console.log(`Upload result: ${resp}`);
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
    </div>
  );
}
