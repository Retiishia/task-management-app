const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskdb';

async function reset() {
  await mongoose.connect(MONGODB_URI);
  const password = process.argv[2] || 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'retiishia@gmail.com' },
    {
      $set: {
        password: hashedPassword,
        isVerified: true,
        role: 'admin',
      },
    },
    { upsert: true }
  );

  console.log(`✅ Admin account retiishia@gmail.com updated with password: "${password}"`);
  console.log('Role: admin | Verified: true');
  await mongoose.disconnect();
}

reset().catch((err) => {
  console.error('Error resetting admin:', err);
  process.exit(1);
});
