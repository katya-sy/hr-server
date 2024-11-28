const fs = require("fs");
const jsonServer = require("json-server");
const path = require("path");

const index = jsonServer.create();

const router = jsonServer.router(path.resolve(__dirname, "db.json"));

index.use(jsonServer.defaults({}));
index.use(jsonServer.bodyParser);

index.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const db = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "db.json"), "UTF-8")
    );
    const { users = [] } = db;

    const userFromBd = users.find(
      (user) => user.email === email && user.password === password
    );

    console.log(userFromBd);

    if (userFromBd) {
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
