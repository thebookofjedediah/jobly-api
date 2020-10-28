const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/ExpressError");

// ********************
// Ensure they have a valid token
// ********************
function authRequired(req, res, next) {
    try {
        const tokenStr = req.body._token || req.query._token;

        let token = jwt.verify(tokenStr, SECRET_KEY);
        res.locals.username = token.username;
        return next();
    } catch (err) {
        return next(new ExpressError("You must authenticate first", 401));
    }
}

// ********************
// Ensure they are an admin
// ********************
function adminRequired(req, res, next) {
    try {
        const tokenStr = req.body._token;

        let token = jwt.verify(tokenStr, SECRET_KEY);
        res.locals.username = token.username;

        if (token.is_admin) {
            return next();
        }

        // throw an error, so we catch it in our catch, below
        throw new Error();
    } catch (err) {
        return next(new ExpressError("You must be an admin to access", 401));
    }
}

// ********************
// Ensure they have a valid token and are the correct user
// ********************
function ensureCorrectUser(req, res, next) {
    try {
        const tokenStr = req.body._token;

        let token = jwt.verify(tokenStr, SECRET_KEY);
        res.locals.username = token.username;

        if (token.username === req.params.username) {
            return next();
        }
        // throw an error, so we catch it in our catch, below
        throw new Error();
    } catch (err) {
        return next(new ExpressError("Unauthorized", 401));
    }
}

module.exports = {
  authRequired,
  adminRequired,
  ensureCorrectUser
};
