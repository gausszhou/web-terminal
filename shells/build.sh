set -e

pnpm i 

cd packages/web-terminal-common
pnpm build

cd ../web-terminal-portal
pnpm build

cd ../web-terminal-service
pnpm build

cd -