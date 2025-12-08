const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const authenticate = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token)
            return res.status(401).json({ message: "Unauthenticated user" });

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from token payload
        const user = await userModel.findById(decoded._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });

        // Attach user to request object
        req.user = user;

        next();
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = authenticate;
