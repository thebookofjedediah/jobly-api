const express = require("express");
const ExpressError = require("../helpers/expressError");
const { ensureCorrectUser, authRequired } = require('../middleware/auth');
const User = require("../models/user");
const createToken = require('../helpers/createToken');
const { validate } = require('jsonschema');
const { createUser, updateUser } = require('../schemas');

const router = new express.Router();

// ********************
// GET all users
// ********************
router.get("/", authRequired, async function (req, res, next) {
    try {
        const users = await User.findAll(req.query);
        return res.json({ users });
    } catch (e) {
        next(e)
    }
})

// ********************
// POST create a user
// ********************
router.post("/", async function (req, res, next) {
    try {
        const validation = validate(req.body, createUser);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const newUser = await User.register(req.body);
        const token = createToken(newUser);
        return res.status(201).json({ token });
    } catch (e) {
        next(e)
    }
})

// ********************
// GET single user
// ********************
router.get("/:username", authRequired, async function (req, res, next) {
    try {
        const user = await User.findOne(req.params.username);
        return res.json({ user });
    } catch (e) {
        next(e)
    }
})

// ********************
// PATCH update a user
// ********************
router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const validation = validate(req.body, updateUser);
        if (!validation.valid) {
        throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (e) {
        next(e)
    }
})

// ********************
// DELETE a user
// ********************
router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ message: 'User deleted' });
    } catch (e) {
        next(e)
    }
})

module.exports = router;