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
            <div class="leftMenu">
                <div v-if="chapters.length > 0" v-for="(chapter, index) in chapters" :key="index"
                    @click="handleChapterClick(chapter)">
                    {{ chapter.title }}
                </div>
            </div>
            <TxtEditor ref="txtEditorRef" />
        </div>
        <div class="footbar">
            <span v-if="curChapter.content">当前在: {{ curChapter.title }}</span>
        </div>
    </div>
</template>

<style>
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

.leftMenu {
    width: 20%;
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

.leftMenu div {
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    text-overflow: ellipsis;
    box-sizing: border-box;
}

.leftMenu div:hover {
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
