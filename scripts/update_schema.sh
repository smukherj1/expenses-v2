set -eux

# Directly pushes schema changes which is a big no-no if you
# actually care about not losing the data :P
bunx drizzle-kit push