import { createTOCView } from './ui/tree.js'
import { makeBook } from './view.js'
const $ = document.querySelector.bind(document)
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
    const book = await makeBook(file)
    createLeftMenu(book)
    getHtml(book)
    console.log("book", book)
}

const getHtml = (book) => {
    const toc = book.toc
    if (toc) {

    }
}


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

