const { ipcMain } = require("electron");
const {
  insertBook,
  insertChapter,
  getFirstChapter,
  getChapter,
  updateChapter,
} = require("../dbtool.js");

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
  ipcMain.on("db-get-chapter", (event, bookId, href) => {
    getChapter(bookId, href, event);
  });

  ipcMain.on("db-update-chapter", (event, chapter) => {
    console.log("db-update-chapter", chapter);
    updateChapter(chapter.bookId, chapter.href, chapter.content, event);
  });
};

module.exports = dbHandle;
