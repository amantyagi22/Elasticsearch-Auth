require("dotenv").config();
const express = require("express");

//Routes
const userRoute = require("./routes/user");
const app = express();

//Middlewares
app.use(express.json());
app.use("/", userRoute);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}
app.listen(port, () => {
  console.log(`Backend Server is running at ${port}`);
});
