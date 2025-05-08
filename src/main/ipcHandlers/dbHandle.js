const { ipcMain } = require("electron");
const { insertBook, insertChapter, getFirstChapter } = require("../dbtool.js");

const dbHandle = () => {
  ipcMain.on("db-insert-book", (event, book) => {
    insertBook(book, event);
  });
  ipcMain.on("db-insert-chapter", (event, chapter) => {
    insertChapter(chapter, event);
  });
  ipcMain.on("db-first-chapter", (event, bookId) => {
    getFirstChapter(bookId, event);
  });
};

module.exports = dbHandle;
