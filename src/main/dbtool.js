const path = require('path')
const { app, ipcMain } = require('electron')
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose()
const bookData = path.join(app.getPath('userData'), 'bookdata');

let db

// 获取数据库文件路径
const getDatabasePath = () => {
    ensureDirectoryExists(bookData);
    return path.join(bookData, 'database.db');
}
// 封装的函数，判断文件夹是否存在，不存在则创建
const ensureDirectoryExists = (dirPath) => {
    fs.access(dirPath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件夹不存在，创建它
            fs.mkdir(dirPath, { recursive: true }, (mkdirErr) => {
                if (mkdirErr) {
                    console.error("Error creating folder:", mkdirErr);
                } else {
                    console.log("Folder created successfully:", dirPath);
                }
            });
        } else {
            // 文件夹存在
            console.log("Folder already exists:", dirPath);
        }
    });
};
const initDatabase = () => {
    const dbPath = getDatabasePath();
    console.log('Database path:', dbPath);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 检查数据库文件是否存在
            fs.access(dbPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.log('Database file does not exist. Creating a new one.');
                    db = new sqlite3.Database(dbPath, (err) => {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        } else {
                            console.log('Connected to the SQLite database.');
                            createTable();
                            resolve();
                        }
                    });
                } else {
                    console.log('Database file already exists.');
                    db = new sqlite3.Database(dbPath, (err) => {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        } else {
                            console.log('Connected to the existing SQLite database.');
                            resolve();
                        }
                    });
                }
            });
        }, 1000); // 等待1秒
    });
}

// 创建数据库表
const createTable = () => {
    db.run(`
        CREATE TABLE ee_book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            description TEXT,
            cover TEXT,
            path TEXT,
            createTime TEXT,
            updateTime TEXT
        )
    `, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Table ee_books created.');
    });
    db.run(`
       CREATE TABLE ee_chapter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bookId INTEGER,
            title TEXT,
            href TEXT,
            content TEXT,
            createTime TEXT,
            updateTime TEXT
        )
    `, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Table ee_chapter created.');
    });
}


const insertBook = (book, event) => {
    db.run(`
    INSERT INTO ee_book (title, author, description, cover, path, createTime, updateTime)
     VALUES (? , ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [book.title, book.author, book.description, book.cover, book.path], function (err) {
            if (err) {
                console.error(err.message);
                event.reply('db-insert-book-response', { success: false });
            } else {
                event.reply('db-insert-book-response', { success: true, id: this.lastID });
            }
        });
}

//导出
module.exports = {
    initDatabase,
    insertBook
}

