/**
 * Seeds:
 *  - an admin account (admin / admin1234)
 *  - the PDF's example scenario for john_doe (password: password123),
 *    with three pending brand_1 sales of ₹40 each.
 * Run: npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Sale = require("./models/Sale");

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Sale.deleteMany({});

  const adminHash = await bcrypt.hash("admin1234", 10);
  const johnHash = await bcrypt.hash("password123", 10);

  await User.create({ userId: "admin", name: "Admin", role: "admin", passwordHash: adminHash });
  await User.create({ userId: "john_doe", name: "John Doe", role: "user", passwordHash: johnHash });

  await Sale.insertMany([
    { userId: "john_doe", brand: "brand_1", earning: 40, status: "pending" },
    { userId: "john_doe", brand: "brand_1", earning: 40, status: "pending" },
    { userId: "john_doe", brand: "brand_1", earning: 40, status: "pending" },
  ]);

  console.log("Seeded accounts:");
  console.log("  admin    / admin1234   (role: admin)");
  console.log("  john_doe / password123 (role: user) — 3 pending sales of ₹40 each");
  console.log("Next steps:");
  console.log("  1. Log in as admin, run the advance payout job -> advances 10% = ₹12 total");
  console.log("  2. Reconcile sales: 1 rejected, 2 approved (see PDF example) -> final payout ₹68");
  console.log("  3. Log in as john_doe to see the balance and withdraw.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
