import { createTOCView } from './ui/tree.js'
import { makeBook } from './view.js'
const { ipcRenderer } = window.require('electron');
const $ = document.querySelector.bind(document)

const locales = 'en'
const listFormat = new Intl.ListFormat(locales, { style: 'short', type: 'conjunction' })


const formatLanguageMap = x => {
    if (!x) return ''
    if (typeof x === 'string') return x
    const keys = Object.keys(x)
    return x[keys[0]]
}

const formatOneContributor = contributor => typeof contributor === 'string'
    ? contributor : formatLanguageMap(contributor?.name)

const formatContributor = contributor => Array.isArray(contributor)
    ? listFormat.format(contributor.map(formatOneContributor))
    : formatOneContributor(contributor)

export const open = async (file) => {
    console.log("file", file)
    // 获取文件扩展名
    const ext = file.name.match(/\.([^.]+)$/)?.[1] || '';
    const book = await makeBook(file)
    createLeftMenu(book)
    getHtml(book, ext)
    console.log("book", book)
}

const getHtml = async (book, ext) => {
    try {
        // 获取当前时间戳
        const timestamp = Date.now();
        for (const section of book.sections) {
            await section.loadText().then(async (document) => {
                console.log(document)
            });

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
        }
    } catch (err) {
        console.error('处理文件时出错:', err);
    }
}

//判断section.id 是否有后缀，如果没有加.html



//创建目录
const createLeftMenu = (book) => {
    const toc = book.toc
    const title = formatLanguageMap(book.metadata?.title) || 'Untitled Book'
    $('#side-bar-cover').src = ''
    $('#side-bar-title').innerText = title
    $('#side-bar-author').innerText = formatContributor(book.metadata?.author)
    Promise.resolve(book.getCover?.())?.then(blob =>
        blob ? $('#side-bar-cover').src = URL.createObjectURL(blob) : null)
    if (toc) {
        const tocView = createTOCView(toc, href => {
            console.log("href", href)
        })
        const tocViewElement = $('#toc-view');
        tocViewElement.innerHTML = '';
        tocViewElement.append(tocView.element);
    }
}

