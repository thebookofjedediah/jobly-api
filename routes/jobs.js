const express = require("express");
const ExpressError = require("../helpers/expressError");
const Job = require("../models/job");
const { validate } = require('jsonschema');
const { createJob, updateJob } = require('../schemas');

const router = new express.Router();


// ********************
// GET all jobs
// ********************
router.get('/', async function(req, res, next) {
    try {
        const jobs = await Job.findAll(req.query);
        return res.json({ jobs });
      } catch (e) {
        return next(e);
      }
});

// ********************
// POST create a new job
// ********************
router.post('/', async function (req, res, next) {
    try {
        const validation = validate(req.body, createJob);
        if (!validation.valid) {
          throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (e) {
        next(e)
    }
})

// ********************
// GET single job by id
// ********************
router.get('/:id', async function(req, res, next) {
    try {
      const job = await Job.findOne(req.params.id);
      return res.json({ job });
    } catch (e) {
      return next(e);
    }
});

// ********************
// PATCH update a job
// ********************
router.patch('/:id', async function(req, res, next) {
    try {
        if ('id' in req.body) {
            throw new ExpressError('You are not allowed to change the ID', 400);
        }

        const validation = validate(req.body, updateJob);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (e) {
        return next(e);
    }
  });

// ********************
// DELETE remove a job
// ********************
router.delete('/:id', async function(req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ message: 'Job deleted' });
    } catch (err) {
        return next(err);
    }
  });

module.exports = router;