const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Company {
    
    // ********************
    // GET all companies with search queries
    // ********************
    static async findAll(data) {
        let baseQuery = `SELECT handle, name FROM companies`;
        let whereExpressions = [];
        let queryValues = [];
    
        if (+data.min_employees >= +data.max_employees) {
            throw new ExpressError(
                "Min employees must be less than max employees",
                400
            );
        }
    
        // For each possible search term, add to whereExpressions and
        // queryValues so we can generate the right SQL
    
        if (data.min_employees) {
            queryValues.push(+data.min_employees);
            whereExpressions.push(`num_employees >= $${queryValues.length}`);
        }
    
        if (data.max_employees) {
            queryValues.push(+data.max_employees);
            whereExpressions.push(`num_employees <= $${queryValues.length}`);
        }
    
        if (data.search) {
            queryValues.push(`%${data.search}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`);
        }
    
        if (whereExpressions.length > 0) {
            baseQuery += " WHERE ";
        }
    
        // Finalize query and return results
    
        let finalQuery = baseQuery + whereExpressions.join(" AND ") + " ORDER BY name";
        const companiesRes = await db.query(finalQuery, queryValues);
        return companiesRes.rows;
    }

    // ********************
    // POST create a company and return json of { company: companyData}
    // ********************
    static async create(data) {
        const duplicateCheck = await db.query(
            `SELECT handle 
                FROM companies 
                WHERE handle = $1`,
            [data.handle]
        );
        if (duplicateCheck.rows[0]) {
            throw new ExpressError(
                `There already exists a company with handle '${data.handle}`,
                400
            );
        }
    
        const result = await db.query(`
            INSERT INTO companies 
                (handle, name, num_employees, description, logo_url)
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING handle, name, num_employees, description, logo_url`,
            [
            data.handle,
            data.name,
            data.num_employees,
            data.description,
            data.logo_url
            ]
        );
        return result.rows[0];
    }

    // ********************
    // GET single company
    // ********************
    static async findOne(handle) {
        const companyRes = await db.query(`
        SELECT handle, name, num_employees, description, logo_url
            FROM companies
            WHERE handle = $1`,
        [handle]
        );

        const foundCompany = companyRes.rows[0];

        if (!foundCompany) {
            throw new ExpressError(`COMPANY NOT FOUND FOR HANDLE ${handle}`, 404)
        }
        
        return foundCompany;
    }

    // ********************
    // PATCH update a single company
    // ********************
    static async updateOne(handle, data) {
        let { query, values } = sqlForPartialUpdate("companies", data, "handle", handle);

        const result = await db.query(query, values);
        const updatedCompany = result.rows[0];

        if(!updatedCompany) {
            throw new ExpressError(`NO COMPANY FOR ${handle} found`, 404)
        }

        return updatedCompany;
    }

    // ********************
    // PATCH update a single company
    // ********************
    static async deleteCompany(handle) {
        const result = await db.query(`
            DELETE 
                FROM companies
                WHERE handle = $1
                RETURNING handle`,
            [handle]
        )

        if (result.rows.length == 0) {
            throw new ExpressError(`NO COMPANY FOR HANDLE ${handle}`, 404)
        }
    }
}

module.exports = Company;