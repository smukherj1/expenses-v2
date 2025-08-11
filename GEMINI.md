# Project Overview

This is a web application for tracking expenses. It is built with React, TypeScript, and Vite. It uses TanStack Router for routing and Drizzle ORM for interacting with a SQLite database. The UI is styled with Tailwind CSS and Daisy UI components.

The Web UI will have the following capabilities:

- A Search page to search for transactions by their date, description, amount, source or tag. Allows the user to add, update or remove the
  tag on one or more fetched transactions.

- A Manage page to uploads transactions from a JSON file and download all transactions in the db as a JSON file (in the same format supported by upload).
  The manage page also allows deleting all transactions currently in the database.

# Building and Running

**Development:**

To run the development server, run the following command in the background:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

**Build:**

To build the application for production, use the following command:

```bash
bun run build
```

# Development Conventions

- **Routing:** The application uses TanStack Router for routing. Routes are defined in the `src/routes` directory. The `src/routeTree.gen.ts` file is auto-generated and should not be modified directly.
- **Database:** The application uses Drizzle ORM to interact with a SQLite database. The database schema is defined in `src/lib/server/schema.ts`.
- **Styling:** The application uses Tailwind CSS for styling. The main stylesheet is located at `src/styles/app.css`. Daisy UI is also installed and should be preferred for UI components.
