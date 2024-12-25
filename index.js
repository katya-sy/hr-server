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
    const { users = [], workDays = [], salary = [] } = db;

    const userFromBd = users.find(
      (user) => user.email === email && user.password === password
    );

    if (userFromBd) {
      const today = new Date().toISOString().split("T")[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');
      const existingWorkDay = workDays.find(
        (workDay) => workDay.userId === userFromBd.id && workDay.date === today
      );
      const existingSalary = salary.find(
        (sal) => sal.userId === userFromBd.id && sal.monthDate === firstDayOfMonth
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
      }

      if (!existingSalary) {
        const newSalary = {
          id: salary.length + 1,
          userId: userFromBd.id,
          totalSalary: 0,
          monthDate: firstDayOfMonth
        };
        salary.push(newSalary);
      }

      await fs.promises.writeFile(dbPath, JSON.stringify(db, null, 2), "UTF-8");
      router.db.setState(db);

      return res.json(userFromBd);
    }

    return res.status(403).json({ message: "Неправильный логин или пароль" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

index.post("/logout", async (req, res) => {
  try {
    const { id } = req.body;
    const dbPath = path.resolve(__dirname, "db.json");
    const db = JSON.parse(await fs.promises.readFile(dbPath, "UTF-8"));
    const { users = [], workDays = [], salary = [] } = db;

    const userFromBd = users.find((user) => user.id === id);

    if (userFromBd) {
      const today = new Date().toISOString().split("T")[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');
      const existingWorkDay = workDays.find(
        (workDay) => workDay.userId === userFromBd.id && workDay.date === today
      );
      const existingSalary = salary.find(
        (sal) => sal.userId === userFromBd.id && sal.monthDate === firstDayOfMonth
      );

      if (existingWorkDay) {
        const endTime = new Date().toTimeString().split(" ")[0].slice(0, 5);
        const startTime = existingWorkDay.startTime;
        const start = new Date(`1970-01-01T${startTime}:00Z`);
        const end = new Date(`1970-01-01T${endTime}:00Z`);
        const totalTime = ((end - start) / (1000 * 60 * 60)).toFixed(1);

        existingWorkDay.endTime = endTime;
        existingWorkDay.totalTime = parseFloat(totalTime);

        if (existingSalary) {
          existingSalary.totalSalary += userFromBd.salaryRate * existingWorkDay.totalTime;
        }
        console.log(existingSalary);
        console.log(userFromBd.salaryRate, "+", existingWorkDay.totalTime)

        await fs.promises.writeFile(dbPath, JSON.stringify(db, null, 2), "UTF-8");
        router.db.setState(db);

        return res.json({ message: "Logout successful", workDay: existingWorkDay });
      }

      return res.status(404).json({ message: "Workday not found" });
    }

    return res.status(403).json({ message: "User not found" });
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
