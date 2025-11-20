/**
 * ESLint rule suggestions for preventing column name mismatches in raw SQL
 * 
 * Note: This is a reference file for manual code review, not an actual ESLint plugin.
 * Add these patterns to your code review checklist.
 */

module.exports = {
  // Patterns to watch for in code review:
  rules: {
    // 1. Detect quoted camelCase identifiers in raw SQL
    "no-quoted-camelcase-in-raw-sql": {
      pattern: /\.raw\([^)]*["'][A-Z][a-zA-Z]*["']/,
      message: "Quoted camelCase identifiers in raw SQL may not match database column names. Use lowercase/snake_case instead."
    },
    
    // 2. Detect UPDATE queries with quoted column names
    "no-quoted-columns-in-update": {
      pattern: /UPDATE\s+\w+\s+SET\s+["'][A-Z]/i,
      message: "UPDATE queries with quoted camelCase columns may fail. Use lowercase/snake_case column names."
    },
    
    // 3. Detect RETURNING with quoted columns
    "no-quoted-columns-in-returning": {
      pattern: /RETURNING\s+["'][A-Z]/i,
      message: "RETURNING clauses with quoted camelCase columns may fail. Use lowercase/snake_case column names."
    }
  },
  
  // Safe patterns (these are OK):
  safe: [
    /UPDATE\s+\w+\s+SET\s+\w+\s*=/i,  // Unquoted lowercase columns
    /RETURNING\s+\w+/i,                // Unquoted lowercase columns
    /knex\.schema\./,                  // Knex schema builder (handles naming automatically)
    /strapi\.db\.query\(/,             // Strapi query builder (handles naming automatically)
    /strapi\.entityService\./,         // Strapi entity service (handles naming automatically)
  ]
};

