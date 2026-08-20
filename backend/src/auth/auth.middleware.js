const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        // Get the Authorization header
        const authHeader = req.headers.authorization;

        // Check if the header exists
        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        // Verify the token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user information in the request
        req.user = decoded;

        // Continue to the next function
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};
const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to access this resource"
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};