import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, query, validationResult } from "express-validator";
import fs from "fs";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const SECRET = "SIMPLE_SECRET";

interface JWTPayload {
  username: string;
  password: string;
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Use username and password to create token.
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  const complete = users.find(
    (user: { username: string; password: string }) => {
      user.username === username && bcrypt.compareSync(password, user.password);
    }
  );
  //bug undefinded complete
  console.log(complete);

  if (complete) {
    const token = jwt.sign(
      {
        username: complete.username,
        firstname: complete.firstname,
        lastname: complete.lastname,
        balance: complete.balance,
      },
      SECRET
    );
    res.status(200).json({
      massage: "Login succesfully",
      token,
    });
  } else {
    res.status(400).json({
      massage: "Invalid username or password",
    });
  }
});

app.post("/register", (req, res) => {
  const { username, password, firstname, lastname, balance } = req.body;
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  const existUser = users.find(
    (user: { username: string }) => user.username === username
  );
  if (existUser) {
    res.status(400).json({ massage: "Username is already in used" });
  } else {
    const encryptPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      username,
      password: encryptPassword,
      firstname,
      lastname,
      balance,
    };
    users.push(newUser);
    fs.writeFileSync("./user.json", JSON.stringify(file));
    res.status(200).json({ massage: "Register successfully" });
  }
});

app.get("/balance", (req, res) => {
  const token = req.query.token as string;
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  if (token) {
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload;
      const takeToken = users.fond(
        (user: { username: string }) => user.username === username
      );
      res.status(200).json({
        name: `${takeToken.firstname}` + `${takeToken.lastname}`,
        balance: takeToken.balance,
      });
    } catch (e) {
      //response in case of invalid token
      res.status(401).json({
        massage: "Invalid token",
      });
    }
  }
});

app.post("/deposit", body("amount").isInt({ min: 1 }), (req, res) => {
  //Is amount <= 0 ?
  const token = req.headers.authorization;
  const { amount } = req.body;
  if (token) {
    try {
      if (Number(amount) == 0 || Number(amount) < 0) {
        res.status(400).json({
          massage: "Invalid data",
        });
      } else if (!validationResult(req).isEmpty()) {
        res
          .status(200)
          .json({ message: "Deposit successfully", balance: Number(amount) });
      }
    } catch (e) {
      res.status(401).json({
        massage: "Invalid token",
      });
    }
  }
});

app.post("/withdraw", (req, res) => {
  const token = req.query.token as string;
  const { amount } = req.body;
  if (token) {
    try {
      const user = jwt.verify(token, SECRET);
      console.log(user);
      if (Number(amount) < 0 || Number(amount) == 0) {
        res.status(400).json({
          massage: "Invalid data",
        });
      } else {
        res.status(200).json({
          massage: "Withdraw successfully",
          //get balance from user
          balance: amount,
        });
      }
    } catch (e) {
      res.status(401).json({
        massage: "Invalid token",
      });
    }
  }
  res.end();
});

app.delete("/reset", (req, res) => {
  //code your database reset here
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  file.users = [];
  fs.writeFileSync("./user.json", JSON.stringify(file));
  res.status(200).json({
    message: "Reset database successfully",
  });
});

app.get("/me", (req, res) => {
  res.status(200).json({
    firstname: "Kitiyaporn",
    lastname: "Takham",
    code: "620610774",
    gpa: 3.8,
  });
});

app.get("/demo", (req, res) => {
  return res.status(200).json({
    message: "This message is returned from demo route.",
  });
});

app.listen(PORT, () => console.log(`Server is running at ${PORT}`));
