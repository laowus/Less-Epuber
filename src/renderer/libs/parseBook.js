import { createTOCView } from "./ui/tree.js";
import { makeBook } from "./view.js";
const { ipcRenderer } = window.require("electron");
const $ = document.querySelector.bind(document);

const locales = "en";
const listFormat = new Intl.ListFormat(locales, {
  style: "short",
  type: "conjunction",
});

const formatLanguageMap = (x) => {
  if (!x) return "";
  if (typeof x === "string") return x;
  const keys = Object.keys(x);
  return x[keys[0]];
};

const formatOneContributor = (contributor) =>
  typeof contributor === "string"
    ? contributor
    : formatLanguageMap(contributor?.name);

const formatContributor = (contributor) =>
  Array.isArray(contributor)
    ? listFormat.format(contributor.map(formatOneContributor))
    : formatOneContributor(contributor);

export const open = async (file) => {
  console.log("file", file);
  // 获取文件扩展名
  const ext = file.name.match(/\.([^.]+)$/)?.[1] || "";
  const book = await makeBook(file);
  createLeftMenu(book);
  getHtml(book, ext);
  console.log("book", book);
};


// 定义一个函数来提取 HTML 字符串中的纯文本
function getTextFromHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || '';
  }

const getHtml = async (book, ext) => {
  book.sections;

  try {
    // toc 中 href 与 section.id 匹配，获取 section 的 html 添加 
    const sectionInfoArray = await Promise.all(
      book.sections.map(async (section) => {
        const doc = await section.createDocument();
        return [section.id, getTextFromHTML(doc.documentElement.outerHTML)];
      })
    );

    console.log("sectionInfoArray", sectionInfoArray);

    // 将 sectionInfoArray 转换为对象，方便通过 href 查找
    const sectionInfoMap = Object.fromEntries(sectionInfoArray);

    // 循环 toc 生成新数组
    let newToc = [];
    for (const tocItem of book.toc) {
      let newTocItem = { ...tocItem }; // 复制 tocItem 的属性
      if (sectionInfoMap[tocItem.href]) {
        newTocItem.html = sectionInfoMap[tocItem.href];
        newToc.push(newTocItem); // 添加 html 属性
      } 
      if (tocItem.subitems) {
        for (const subitem of tocItem.subitems) {
          let newTocItem = {...subitem }; // 复制 subitem 的属性
          if (sectionInfoMap[subitem.href]) {
            newTocItem.html = sectionInfoMap[subitem.href];
            newToc.push(newTocItem); // 添加 html 属性
          }
        }
      }
    }
    console.log('循环结束，newToc 数组内容：', newToc);
    // 你可以在这里调用其他函数，将 newToc 作为参数传递
    // processNewToc(newToc);
    

    

    // // 先处理 epub
    // const timestamp = Date.now();
    // for (const tocItem of book.toc) {
    //   const contentPromise = getContent(tocItem.href, book.sections);
    //   console.log(tocItem.label, tocItem.href, contentPromise);
    //   if (tocItem.subitems) {
    //     for (const subitem of tocItem.subitems) {
    //       const subContentPromise = getContent(subitem.href, book.sections);
    //       console.log(subitem.label, subitem.href, subContentPromise);
    //     }
    //   }
    // }
    // sections toc
    // await section.createDocument().then(async (document) => {
    //     // // 将 document 对象转换为 HTML 字符串
    //     // const htmlContent = document.documentElement.outerHTML;
    //     // // 判断 section.id 是否有后缀，若没有则添加 .html
    //     // const fileName = ext == 'epub' ? section.id : `${section.id}.html`;
    //     // ipcRenderer.send('save-html', {
    //     //     timestamp,
    //     //     fileName: fileName,
    //     //     content: htmlContent
    //     // });
    // });
  } catch (err) {
    console.error("处理文件时出错:", err);
  }
};

//判断section.id 是否有后缀，如果没有加.html

//创建目录
const createLeftMenu = (book) => {
  const toc = book.toc;
  const title = formatLanguageMap(book.metadata?.title) || "Untitled Book";
  $("#side-bar-cover").src = "";
  $("#side-bar-title").innerText = title;
  $("#side-bar-author").innerText = formatContributor(book.metadata?.author);
  Promise.resolve(book.getCover?.())?.then((blob) =>
    blob ? ($("#side-bar-cover").src = URL.createObjectURL(blob)) : null
  );
  if (toc) {
    const tocView = createTOCView(toc, (href) => {
      console.log("href", href);
    });
    const tocViewElement = $("#toc-view");
    tocViewElement.innerHTML = "";
    tocViewElement.append(tocView.element);
  }
};
