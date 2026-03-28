const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('./node_modules/bcryptjs');
const p = new PrismaClient();
p.user.findUnique({ where: { email: 'admin@managedad.com' } }).then(async (u) => {
  console.log('Found:', !!u);
  console.log('HasPw:', !!u?.hashedPassword);
  if (u?.hashedPassword) {
    const v = await bcrypt.compare('Admin@123', u.hashedPassword);
    console.log('Valid:', v);
  }
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
