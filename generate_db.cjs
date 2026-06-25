const fs = require('fs');
const path = require('path');

try {
    const sqlPath = path.resolve(__dirname, '../Gr3_ProBuildPC/database/seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    function parseSqlInsert(tableName, cols) {
        const regex = new RegExp(`INSERT INTO ${tableName}[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`, 'i');
        const match = sql.match(regex);
        if (!match) return [];
        
        const valuesStr = match[1];
        
        let inString = false;
        let inRow = false;
        let currentToken = "";
        let currentRow = [];
        let rows = [];
        
        for (let i = 0; i < valuesStr.length; i++) {
            const c = valuesStr[i];
            
            if (c === "'" && valuesStr[i-1] !== '\\') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (c === '(' && !inRow) {
                    inRow = true;
                    currentRow = [];
                    currentToken = "";
                    continue;
                }
                if (c === ')' && inRow) {
                    inRow = false;
                    if (currentToken.trim().length > 0) {
                        let val = currentToken.trim();
                        if (val === 'NULL') val = null;
                        else if (!isNaN(val)) val = Number(val);
                        currentRow.push(val);
                    }
                    
                    let obj = {};
                    cols.forEach((col, idx) => {
                        obj[col] = currentRow[idx];
                    });
                    rows.push(obj);
                    continue;
                }
                if (c === ',' && inRow) {
                    let val = currentToken.trim();
                    if (val === 'NULL') val = null;
                    else if (!isNaN(val)) val = Number(val);
                    currentRow.push(val);
                    currentToken = "";
                    continue;
                }
            }
            
            if (inRow) {
                currentToken += c;
            }
        }
        
        return rows;
    }

    const categories = parseSqlInsert('CATEGORIES', ['id', 'name', 'status']).map(c => ({ id: c.id, name: c.name }));
    const brands = parseSqlInsert('BRANDS', ['id', 'name', 'img', 'status']).map(b => ({ id: b.id, name: b.name }));

    const products = parseSqlInsert('PRODUCTS', ['id', 'categoryId', 'brandId', 'name', 'description', 'image', 'price', 'status']).map(p => {
        let img = p.image || '';
        img = img.replace('images/products/', '');
        img = img.replace('images/brands/', '');
        return {
            id: p.id,
            name: p.name,
            price: p.price,
            stock: Math.floor(Math.random() * 50) + 10,
            categoryId: p.categoryId,
            brandId: p.brandId,
            image: img,
            description: p.description
        };
    });

    const users = parseSqlInsert('USERS', ['id', 'fullName', 'status', 'email', 'password', 'role']).map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        password: "123", // reset password for demo
        role: u.role === 'STAFF' ? 'ADMIN' : 'CUSTOMER'
    }));

    // Generate JSON structure
    const db = { categories, brands, products, users, orders: [], cart: [] };
    
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    console.log(`Successfully generated db.json with ${products.length} products and ${users.length} users.`);
} catch (err) {
    console.error("Error generating database:", err);
}
