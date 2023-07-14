const jwt = require("jsonwebtoken");
const IsAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(404).json({ message: "Invalid token" });
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.SECRET || "DAVID", function (err, decoded) {
      if (err) return res.status(401).json({ message: "Unauthorized" });
      req.userId = decoded._id;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  IsAuthenticated,
};
