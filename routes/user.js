require("dotenv").config();
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authSchema } = require("../helpers/validation_schema");
const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });

// Register a user
router.post("/register", async (req, res) => {
  const userExist = await client.search({
    index: "student",
    body: {
      query: {
        match_phrase: {
          username: req.body.username,
        },
      },
    },
  });
  const userFound = [...userExist.hits.hits];
  if (userFound.length > 0)
    return res.status(401).json({
      message: "User Already Exists",
      Userid: userFound[0]._id,
    });
  try {
    const result = await authSchema.validateAsync(req.body);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(result.password, salt);

    await client.index({
      index: "student",
      id: req.body.id,
      body: {
        name: result.name,
        username: result.username,
        password: hashedPassword,
        phoneNumber: result.phoneNumber,
      },
    });
    res.status(200).json({
      message: "User successfully registered",
      id: result.id,
    });
  } catch (err) {
    if (err.isJoi === true) {
      const { details } = err;
      console.log();
      res.status(422).json({ message: err });
    } else res.status(500).json({ message: "Username already exist" });
  }
});

// Get all users data
router.get("/get-all-data", async (req, res) => {
  try {
    const result = await client.search({
      index: "student",
    });
    res.send(result.hits.hits);
  } catch (error) {
    res.status(500).json({ message: "Bad request type" });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  try {
    const result = await client.search({
      index: "student",
      body: {
        query: {
          match_phrase: {
            username: req.body.username,
          },
        },
      },
    });
    const user = [...result.hits.hits];

    if (user.length == 0) {
      return res.json({
        status: "error",
        error: "No user exists from this username",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user[0]._source.password
    );
    if (isPasswordValid) {
      const token = jwt.sign(
        {
          _id: user[0]._id,
          name: user[0]._source.name,
          username: user[0]._source.username,
        },
        `${process.env.SECRET_TOKEN}`
      );
      return res.json({ status: "ok", userId: user[0]._id, jwttoken: token });
    } else {
      return res.status(401).json({ message: "Invalid Password" });
    }
  } catch (err) {
    return res.json({ error: err, status: "error", user: false });
  }
});

//The homepage cookie storage
router.get("/homepage", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, `${process.env.SECRET_TOKEN}`);
    const username = decoded.username;
    const result = await client.search({
      index: "student",
      body: {
        query: {
          match_phrase: {
            username: username,
          },
        },
      },
    });
    const user = [...result.hits.hits];

    if (user.length == 0) {
      return res.json({
        status: "error",
        error: "No User exists from this username",
      });
    }

    res.json({ status: "ok" });
  } catch (error) {
    res.json({ status: "error", error: error });
  }
});
module.exports = router;
