<script setup>
import { ref, provide, watch } from 'vue';
import Header from './components/header.vue';
import TxtEditor from './components/txtEditor.vue';


const chapters = ref([]);
const curChapter = ref({ index: 0, title: '', content: '' });

// 引用 TxtEditor 组件
const txtEditorRef = ref(null);
const metadata = ref({ title: '', author: '', description: '', cover: '', ext: "", fileContent: "" });

provide('curChapter', curChapter);
provide('chapters', chapters);
provide('metadata', metadata);


// 点击左侧菜单时更新 currentContent

const handleChapterClick = (chapter) => {
    curChapter.value = chapter;
};

</script>

<template>
    <div class="container">
        <Header></Header>
        <div class="content">
            <div id="leftMenu">
                <div v-if="chapters.length > 0" v-for="(chapter, index) in chapters" :key="index"
                    @click="handleChapterClick(chapter)">
                    {{ chapter.title }}
                </div>
                <div id="toc-view"></div>
            </div>
            <TxtEditor ref="txtEditorRef" />
        </div>
        <div class="footbar">
            <span v-if="curChapter.content">当前在: {{ curChapter.title }}</span>
        </div>
    </div>
</template>

<style>
html {
    height: 100%;
}

body {
    margin: 0 auto;
    height: 100%;
    font: menu;
    font-family: system-ui, sans-serif;
}



#toc-view {
    padding: .5rem;
    overflow-y: scroll;
}

#toc-view li,
#toc-view ol {
    margin: 0;
    padding: 0;
    list-style: none;
}

#toc-view a,
#toc-view span {
    display: block;
    border-radius: 6px;
    padding: 8px;
    margin: 2px 0;
}

#toc-view a {
    color: CanvasText;
    text-decoration: none;
}

#toc-view a:hover {
    background: var(--active-bg);
}

#toc-view span {
    color: GrayText;
}

#toc-view svg {
    margin-inline-start: -24px;
    padding-inline-start: 5px;
    padding-inline-end: 6px;
    fill: CanvasText;
    cursor: default;
    transition: transform .2s ease;
    opacity: .5;
}

#toc-view svg:hover {
    opacity: 1;
}

#toc-view [aria-current] {
    font-weight: bold;
    background: var(--active-bg);
}

#toc-view [aria-expanded="false"] svg {
    transform: rotate(-90deg);
}

#toc-view [aria-expanded="false"]+[role="group"] {
    display: none;
}

.footbar {
    height: 20px;
    width: 100%;
    background-color: #87ceeb;
    text-align: left;
    line-height: 20px;
}

.content {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: calc(100vh - 120px);
    background-color: #add8e6;
    box-sizing: border-box !important;
}

#leftMenu {
    width: 320px;
    height: 100%;
    background-color: #f0f0f0;
    border-right: 1px solid #add8e6;
    overflow-y: auto;
    overflow-x: hidden;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 5px;
}

#leftMenu div {
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
    text-overflow: ellipsis;
}

#leftMenu div:hover {
    background-color: #e0e0e0;
    transform: translateX(2px);
}

.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100vh;
    font-size: 12px;
}
</style>
