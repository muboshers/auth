const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const serverless = require("serverless-http");

const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

// routes
const AuthRoute = require("./routes/auth.routes.js");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("./public"));
app.use(
  cors({
    origin: ["*"],
    methods: ["*"],
  })
);

//why

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MONGO DB connected");
  })
  .catch((err) => console.log("error", err?.message));

app.get("/", (req, res) => {
  res.json("ok");
});

// routes

app.use("/api/v1/auth", AuthRoute);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Library API",
      version: "1.0.0",
      description: "A simple Express Library API",
      termsOfService: "http://example.com/terms/",
      contact: {
        name: "API Support",
        url: "http://www.exmaple.com/support",
        email: "support@example.com",
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    servers: [
      {
        url: process.env.SERVER_URL,
        description: "David api docs",
      },
    ],
  },
  apis: ["./controller/*.js"],
};

const specs = swaggerJsDoc(options);

// api documentation
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(specs, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css",
  })
);

app.listen(PORT, () => console.log(`Server has running : ${PORT}`));
module.exports = serverless(app);
