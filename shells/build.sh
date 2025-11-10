set -e

pnpm i 

cd packages/web-terminal-common
pnpm build

cd -
cd packages/web-terminal-mockpty
pnpm build

cd -
cd packages/web-terminal-portal
pnpm build

cd -
cd packages/web-terminal-service
pnpm build

cd -