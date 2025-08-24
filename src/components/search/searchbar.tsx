export default function SearchBar() {
  return (
    <>
      <label className="input focus-within:outline-none m-2">
        <span className="label">From</span>
        <input type="date" className="input focus-within:outline-none" />
      </label>
      <label className="input focus-within:outline-none m-2">
        <span className="label">To</span>
        <input type="date" className="input focus-within:outline-none" />
      </label>
      <label className="input focus-within:outline-none m-2">
        <span className="label">Description</span>
        <select
          defaultValue="~"
          className="select select-ghost focus-within:outline-none"
        >
          <option>~</option>
          <option>!~</option>
        </select>
        <input type="text" className="input focus-within:outline-none" />
      </label>
      <label className="input focus-within:outline-none m-2">
        <span className="label">Amount</span>
        <select
          defaultValue="="
          className="select select-ghost focus-within:outline-none"
        >
          <option>=</option>
          <option>&gt;=</option>
          <option>&lt;=</option>
        </select>

        <input type="number" className="input focus-within:outline-none" />
      </label>
    </>
  );
}
