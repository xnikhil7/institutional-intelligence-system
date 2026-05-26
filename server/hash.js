const bcrypt = require("bcrypt");
const db = require("./config/db");

(async () => {
  try {
    const [users] = await db.query("SELECT id, password FROM users");

    for (let user of users) {
      // Skip already hashed passwords
      if (user.password.startsWith("$2b$")) continue;

      const hashed = await bcrypt.hash(user.password, 10);

      await db.query(
        "UPDATE users SET password=? WHERE id=?",
        [hashed, user.id]
      );

      console.log(`✅ Hashed user ID: ${user.id}`);
    }

    console.log("🔥 All passwords hashed successfully");
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
})();