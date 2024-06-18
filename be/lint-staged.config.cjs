module.exports = {
  '**/*.+(ts|tsx)': ['pnpm run lint:fix:staged', "pnpm tsc-files --noEmit"],
  'prisma/schema.prisma': ['pnpm prisma format'],
};
