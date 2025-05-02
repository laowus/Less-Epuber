<script setup>
import { ref, onMounted, inject, toRaw } from 'vue';
import { ElMessage } from 'element-plus';
import WindowCtr from './windowCtr.vue';
import { getChapters } from '../utils/funs.js';
import { open } from '../libs/reader.js';
const fs = window.require('fs');
const { ipcRenderer, webUtils } = window.require('electron');
const reg = {
    pre: ['', '第', '卷', 'chapter'],
    aft: ['', '章', '回', '节', '集', '部', '篇', '部分'],
    selected: [1, 1]
};

// 注入数据
const chapters = inject('chapters');
const curChapter = inject('curChapter');
const metadata = inject('metadata');
const indentNum = ref(2);
const curIndex = ref(0);

// 对话框相关数据
const dialogFormVisible = ref(false)

const changeTab = (index) => {
    curIndex.value = index
}
const parseEpub = async file => {
    const filePath = webUtils.getPathForFile(file);
    Object.defineProperty(file, 'path', {
        value: filePath,
        writable: false,
        enumerable: true,
        configurable: false
    });
    await open(file);
}


const epubToc2Chapters = (book) => {
    const { toc, metadata, loadText, sections } = book;
    for (const section of sections) {
        section.load().then((res) => {
            console.log(res);
            const txt = loadText(res);
            console.log(txt);
        })
    }
};



const initDom = () => {
    $('#add-epub-file').addEventListener('change', e => {
        // 检查用户是否选择了文件
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            parseEpub(file);
        } else {
            console.log('用户未选择文件');
        }
    })
    $('#add-epub-btn').addEventListener('click', () => $('#add-epub-file').click())

}
onMounted(() => {
    initDom();
    ipcRenderer.on('file-content', (event, { filePath, fileContent }) => {
        const path = require('path');
        const ext = path.extname(filePath);
        const txtName = path.basename(filePath, ext);
        metadata.value = { title: txtName, author: '', description: '', cover: '', ext: ext, fileContent: fileContent };
        dialogFormVisible.value = true;
    });
});



const addTxt = () => {
    ipcRenderer.invoke('open-file-dialog', 'txt').then((fileInfos) => {
        //获取返回的文件内容
        console.log(fileInfos);
    });
}

const addEpub = () => {

}
const newChapter = () => {
    console.log(`新建章节`);
}

const insertChapter = () => {
    console.log(`插入章节`);
}

const regString = () => {
    const pre = $("#pre").value;
    const aft = $("#aft").value;
    let attach = $("#attach").value.trim();
    attach ? attach = `|^\s*(${attach})` : attach = "";
    // 动态拼接正则表达式
    const regexPattern = `^\\s*([${pre}][一二三四五六七八九十0-9]+[${aft}]).*${attach}([^\\n]+)?$`;
    const chapterRegex = new RegExp(regexPattern, 'gm');
    console.log(chapterRegex);
    chapters.value = getChapters(curChapter.value.content, curChapter.value.title, chapterRegex);
    console.log(chapters.value);
    // chapters.value = chapters;
    curChapter.value = chapters.value[0];
};

const deleteEmptyLines = () => {
    if (curChapter.value.content) {
        // 按换行符分割字符串
        const lines = curChapter.value.content.split('\n');
        // 过滤掉空行
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        // 重新拼接字符串
        curChapter.value.content = nonEmptyLines.join('\n');
        updateChapters();
    }
}

const indentFirstLine = () => {
    if (curChapter.value.content) {
        const indentString = '    '.repeat(indentNum.value);
        console.log("空格", indentString, "空格");
        // 按换行符分割字符串
        const lines = curChapter.value.content.split('\n').map(line => line.trimStart());
        // 给每一行添加缩进
        const indentedLines = lines.map(line => indentString + line);
        // 重新拼接字符串
        curChapter.value.content = indentedLines.join('\n');
        updateChapters();
    }
}
// 手动更新 chapters 数组的函数
const updateChapters = () => {
    const targetIndex = curChapter.value.index;
    const foundIndex = chapters.value.findIndex(chap => chap?.index === targetIndex);
    if (foundIndex !== -1) {
        // 找到对应的 index，更新该对象
        chapters.value[foundIndex] = { ...curChapter.value };
    } else {
        // 未找到对应的 index，添加新的章节对象
        chapters.value.push({ ...curChapter.value });
    }
};
// 新增导出 epub 方法
const exportEpub = () => {

    console.log(toRaw(chapters.value), toRaw(metadata.value), '导出 epub');
    ipcRenderer.invoke('export-epub', {
        chapters: toRaw(chapters.value),
        metadata: toRaw(metadata.value)
    }).then((result) => {
        ElMessage.success(`导出${metadata.value.title}成功!`);
    }).catch((error) => {
        ElMessage.error(`导出${metadata.value.title}失败，请重试!`);
    });
};

const saveMetadata = () => {
    if (!metadata.value.title || !metadata.value.author) {
        if (!metadata.value.title) {
            // 假设书名输入框有 ref 引用
            ElMessage.error('书名不能为空，请填写完整信息。');
            const titleInput = document.querySelector('#meta-title');
            if (titleInput) {
                titleInput.focus();
            }
        } else if (!metadata.value.author) {
            // 假设作者输入框有 ref 引用
            ElMessage.error('作者不能为空，请填写完整信息。');
            const authorInput = document.querySelector('#meta-author');
            if (authorInput) {
                authorInput.focus();
            }
        }
        return;
    }
    // 在这里处理保存元数据的逻辑
    console.log('保存元数据:', metadata.value);
    dialogFormVisible.value = false;
    if (metadata.value.ext === '.txt') {
        curChapter.value = { index: 0, title: metadata.value.title, content: metadata.value.fileContent };
        chapters.value = [];
        chapters.value.push(curChapter.value);
        console.log(chapters.value);
    }
}
</script>
<template>
    <el-dialog v-model="dialogFormVisible" title="新建书籍" width="500">
        <div class="meta-content">
            <div class="meta-left">
                <div class="meta-item">
                    <label><span style="color:red">*</span>书名:</label>
                    <input id="meta-title" type="text" v-model="metadata.title" required />
                </div>
                <div class="meta-item">
                    <label><span style="color:red">*</span>作者:</label>
                    <input id="meta-author" type="text" v-model="metadata.author" required />
                </div>
                <div class="meta-item">
                    <label>简介:</label><br /><br />
                    <el-mention
                        v-model="metadata.description"
                        style="width: 200px"
                        placeholder="输入简介"
                        type="textarea" />
                </div>
            </div>
            <div class="meta-right">
                <div class="meta-item">
                    <label>封面:</label>
                    <div class="meta-cover">
                        <span v-show="!metadata.cover">
                            双击插入图片:<br />
                            格式为jpg,png,jpeg
                        </span>
                        <img width="220" height="220" v-show="metadata.cover" src="">
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="saveMetadata">确 定</el-button>
                <el-button @click="dialogFormVisible = false">取 消</el-button>
            </div>
        </template>
    </el-dialog>
    <div class="header">
        <div class="tabs">
            <div class="tabnames">
                <div class="tabname" @click="changeTab(0)" :class="{ active: curIndex === 0 }">
                    导入
                </div>
                <div class="tabname" @click="changeTab(1)" :class="{ active: curIndex === 1 }">
                    章节
                </div>
                <div class="tabname" @click="changeTab(2)" :class="{ active: curIndex === 2 }">
                    编辑
                </div>
                <div class="tabname" @click="changeTab(3)" :class="{ active: curIndex === 3 }">
                    工具
                </div>
                <div class="tabname" @click="changeTab(4)" :class="{ active: curIndex === 4 }">
                    发布
                </div>
                <div class="drag-tab">
                </div>
                <WindowCtr />
            </div>
            <div class="tabcontent">
                <div v-show="curIndex === 0">
                    <button class="btn-icon" @click="addTxt">
                        <span class="iconfont icon-txt" style="color:#FFB347"></span>
                        <span>导入txt</span>
                    </button>
                    <input type="file" id="add-epub-file" hidden accept=".epub" />
                    <button class="btn-icon" id="add-epub-btn">
                        <span class="iconfont icon-Epub" style="color:green"></span>
                        <span>导入epub</span>
                    </button>
                </div>
                <div v-show="curIndex === 1">
                    <button class="btn-icon" disabled>
                        <span class="iconfont icon-xinjian" style="color:green"></span>
                        <span>新建章节</span>
                    </button>
                    <button class="btn-icon" disabled>
                        <span class="iconfont icon-jiaru" style="color:green"></span>
                        <span>插入章节</span>
                    </button>
                </div>
                <div v-show="curIndex === 2">
                    <button class="btn-icon" @click="deleteEmptyLines" :disabled="!curChapter.content">
                        <span class="iconfont icon-shanchukonghang" style="color:red"></span>
                        <span>删除空行</span>
                    </button>
                    <select @change="indentNum = parseInt($event.target.value)" :value="indentNum">
                        <option v-for="index in [0, 1, 2, 3, 4, 5, 6]" :key="index"> {{ index }}</option>
                    </select>
                    <button class="btn-icon" @click="indentFirstLine" :disabled="!curChapter.content">
                        <span class="iconfont icon-shouhangsuojin" style="color:green"></span>
                        <span>首行缩进</span>
                    </button>
                </div>
                <div v-show="curIndex === 3">
                    <div class="reg-string">
                        <span>规则:</span>
                        <select id="pre">
                            <option v-for="(pr, index) in reg.pre" :selected="reg.selected[0] == index"> {{ pr }}</option>
                        </select>
                        <span>[数字]</span>
                        <select id="aft">
                            <option v-for="(af, index) in reg.aft" :selected="reg.selected[1] == index"> {{ af }}</option>
                        </select>
                        <span>特别:</span>
                        <input id="attach" style="width: 150px;height: 20px; font-size: 12px;" placeholder="多个用|分开" />
                        <button class="btn-icon" @click="regString" :disabled="!curChapter.content">
                            <span class="iconfont icon-jianqie" style="color:green"></span>
                            <span>开始分割</span>
                        </button>
                    </div>
                </div>
                <div v-show="curIndex === 4">
                    <button class="btn-icon" @click="exportEpub" :disabled="!curChapter.content">
                        <span class="iconfont icon-daochuexl" style="color:green"></span>
                        <span>生成epub</span>
                    </button>
                    <button class="btn-icon" @click="exportTxt" disabled>
                        <span class="iconfont icon-daochutxt" style="color:green"></span>
                        <span>生成txt</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
/* 给对话框添加样式 */
dialog {
    padding: 0;
    position: fixed;
    left: 40%;
    top: 20%;
    transform: translate(-50%, -50%);
    border: none;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    padding: 5px;
    width: 400px;
    height: 50%;

}

dialog input,
dialog textarea {
    font-size: 12px !important;
    padding: 0;
    /* 清除内边距 */
    margin: 0;
    /* 清除外边距 */
    border: 1px solid #ccc;
    resize: vertical;
}

dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
}

.metadata-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
}

.meta-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    padding: 5px;
    border-bottom: 1px solid #ccc;
}

.meta-content {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.meta-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 50%;
}

.meta-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.meta-right span {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.meta-cover {
    width: 180px;
    height: 180px;
    border: 1px dashed #ccc;
    display: flex;
    margin-top: 10px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.meta-content input {
    width: 100%;
    padding: 5px;
    border: 1px solid #ccc;
    width: 135px;
    margin-left: 10px;
}

.meta-footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    height: 30px;
    width: 100%;
}

.meta-footer button {
    width: 4rem;
    height: 1.5rem;
    margin-left: 10px;
    border: 1px solid #ccc;
}

.meta-footer .iconfont {
    font-size: 12px !important;
    padding: 5px;
}

.reg-string {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.reg-string select {
    border: 1px solid #ccc;
    /* 设置 1 像素宽的灰色实线边框 */
    border-radius: 4px;
    /* 可选：添加圆角边框 */
}

.header {
    width: 100%;
    background-color: #f0f0f0;
    display: flex;
    flex-direction: row;
    border: 1px solid #add8e6;
    height: 100px;
}

.tabs {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.tabnames {
    width: 100%;
    display: flex;
    flex-direction: row;
    background-color: #87ceeb;
    padding-left: 10px;
    gap: 10px;
}

.tabname {
    width: 50px;
    height: 30px;
    align-items: center;
    justify-content: center;
    display: flex;
}

.tabname.active {
    background-color: white;
    border: 1px solid #87ceeb;
    /* 设置下边框颜色为白色 */
    border-bottom-color: white;
    border-radius: 10px 10px 0 0;
}

.drag-tab {
    flex: 1;
    user-select: none;
    -webkit-app-region: drag;
    -webkit-user-select: none;
}

.tabcontent div {
    background-color: white;
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    background-color: #add8e6;
}

.btn-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: transparent;
    transition: background-color 0.3s ease;
    margin: 10px;
    font-size: 12px;
}

.btn-icon .iconfont {
    font-size: 2rem;
}

.btn-icon:hover {
    background-color: #FFFFCC;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

/* 添加按钮禁用状态样式 */
.btn-icon:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    /* 降低透明度，让按钮看起来变灰 */
}

.btn-icon:disabled .iconfont {
    color: #ccc;
    /* 禁用状态下图标颜色变灰 */
}

.btn-icon:disabled:hover {
    background-color: transparent;
    /* 禁用状态下鼠标悬停不改变背景色 */
    box-shadow: none;
    /* 禁用状态下鼠标悬停不显示阴影 */
}
</style>