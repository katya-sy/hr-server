const fs = require("fs");
const jsonServer = require("json-server");
const path = require("path");

const index = jsonServer.create();

const router = jsonServer.router(path.resolve(__dirname, "db.json"));

index.use(jsonServer.defaults({}));
index.use(jsonServer.bodyParser);

index.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const dbPath = path.resolve(__dirname, "db.json");
    const db = JSON.parse(fs.readFileSync(dbPath, "UTF-8"));
    const { users = [], workDays = [] } = db;

    const userFromBd = users.find(
      (user) => user.email === email && user.password === password
    );

    if (userFromBd) {
      const today = new Date().toISOString().split("T")[0];
      const existingWorkDay = workDays.find(
        (workDay) => workDay.userId === userFromBd.id && workDay.date === today
      );
      const startTime = new Date().toTimeString().split(" ")[0].slice(0, 5);

      if (!existingWorkDay) {
        const newWorkDay = {
          id: workDays.length + 1,
          userId: userFromBd.id,
          date: today,
          startTime: startTime,
          endTime: "",
          totalTime: 0
        };

        workDays.push(newWorkDay);
        await fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "UTF-8");
        router.db.setState(db);
      }

      return res.json(userFromBd);
    }

    return res.status(403).json({ message: "Неправильный логин или пароль" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

index.use((req, res, next) => {
  next();
});

index.use(router);

index.listen(80, () => {
  console.log("server is running on 80 port");
});
