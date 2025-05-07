const {ipcMain} = require('electron')
const {insertBook} = require('../dbtool.js')

const dbHandle = () => {
    ipcMain.on('db-insert-book', (event, book) => {
        insertBook(book, event);
    });
}

module.exports = dbHandle;