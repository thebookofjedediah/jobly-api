const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

const BCRYPT_WORK_FACTOR = 12;

class User {

    // ********************
    // Authenticate a user
    // ********************
    static async authenticate(data) {
        // try to find the user first
        const result = await db.query(`
            SELECT username, 
                password, 
                first_name, 
                last_name, 
                email, 
                photo_url, 
                is_admin
            FROM users 
            WHERE username = $1`,
            [data.username]
        );
        const user = result.rows[0];
        if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(data.password, user.password);
            if (isValid) {
                return user;
            }
        }
        throw ExpressError("Invalid Password", 401);
      }

    // ********************
    // GET all users
    // ********************
    static async findAll() {
        const userRes = await db.query(`
        SELECT username, first_name, last_name, email
            FROM users
        `)
        return userRes.rows;
    }

    // ********************
    // POST create a user
    // ********************
    static async register(data) {
        const duplicateCheck = await db.query(`
            SELECT username 
                FROM users 
                WHERE username = $1`,
            [data.username]
        );
    
        if (duplicateCheck.rows[0]) {
            throw new ExpressError(`
                There already exists a user with username '${data.username}`,
                400
            );
        }
    
        const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    
        const result = await db.query(`
            INSERT INTO users (username, password, first_name, last_name, email, photo_url) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING username, password, first_name, last_name, email, photo_url`,
            [
                data.username,
                hashedPassword,
                data.first_name,
                data.last_name,
                data.email,
                data.photo_url
            ]
        );
    
        return result.rows[0];
      }

    // ********************
    // GET single user by username
    // ********************
    static async findOne(username) {
        const userRes = await db.query(`
            SELECT username, first_name, last_name, photo_url 
                FROM users 
                WHERE username = $1`,
            [username]
        );
    
        const user = userRes.rows[0];
    
        if (!user) {
            throw new ExpressError(`There exists no user '${username}'`, 404);
        }
    
        return user;
      }


    // ********************
    // PATCH update a user
    // ********************
    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }
    
        let { query, values } = sqlForPartialUpdate("users", data, "username", username);
    
        const result = await db.query(query, values);
        const user = result.rows[0];
    
        if (!user) {
            throw new ExpressError(`There exists no user '${username}'`, 404);
        }
    
        delete user.password;
        delete user.is_admin;
    
        return result.rows[0];
    }


    // ********************
    // DELETE a user
    // ********************
    static async remove(username) {
        let result = await db.query(`
            DELETE FROM users 
                WHERE username = $1
                RETURNING username`,
            [username]
        );
    
        if (result.rows.length === 0) {
          throw new ExpressError(`There exists no user '${username}'`, 404);
        }
    }

}


module.exports = User;