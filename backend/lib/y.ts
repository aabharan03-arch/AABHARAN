import { prisma } from './prisma';

async function main() {
  const updated = await prisma.subscription.update({
    where: {
      id: '9d0b2232-fb20-460f-9e8c-e6fc36c98ce2',
    },
    data: {
      expiryDate: new Date('2026-09-26T00:00:00.000Z'),
    },
  });

  console.log('Updated subscription:');
  console.log(updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });