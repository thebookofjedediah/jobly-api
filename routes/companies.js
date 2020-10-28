const express = require("express");
const ExpressError = require("../helpers/expressError");
const { adminRequired, authRequired } = require('../middleware/auth');
const Company = require("../models/company");
const { validate } = require('jsonschema');
const { createCompany, updateCompany } = require('../schemas');

const router = new express.Router();

// ********************
// GET all companies and allow query strings for min/max employees, search
// ********************
router.get("/", authRequired, async function (req, res, next) {
    try {
        const companies = await Company.findAll(req.query);
        return res.json({ companies }, 201)
    } catch (e) {
        return next(e)
    }
})

// ********************
// POST create a new company
// ********************
router.post("/", adminRequired, async function (req, res, next) {
    try {
        const validation = validate(req.body, createCompany);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const newCompany = await Company.create(req.body);
        return res.status(201).json({ newCompany });
    } catch (e) {
        next(e)
    }
})

// ********************
// GET single company
// ********************
router.get("/:handle", authRequired, async function (req, res, next) {
    try {
        const company = await Company.findOne(req.params.handle);
        return res.json({ company });
    } catch (e) {
        next(e)
    }
})

// ********************
// PATCH update a single company
// ********************
router.patch("/:handle", adminRequired, async function (req, res, next) {
    try {
        const validation = validate(req.body, updateCompany);
        if (!validation.valid) {
          throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        if ('handle' in req.body) {
            throw new ExpressError('You are not allowed to change the handle.', 400);
        }
        const company = await Company.updateOne(req.params.handle, req.body);
        return res.json({ company });
    } catch (e) {
        next(e)
    }
})

// ********************
// DELETE remove a company from db
// ********************
router.delete('/:handle', adminRequired, async function(req, res, next) {
    try {
      await Company.deleteCompany(req.params.handle);
      return res.json({ message: 'Company deleted' });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;