<script setup>
import { ref, provide, watch } from "vue";
import Header from "./components/header.vue";
import TxtEditor from "./components/txtEditor.vue";
import EventBus from "../common/EventBus";

const chapters = ref([]);
const curChapter = ref({
  id: 0,
  bookId: 0,
  href: "",
  title: "",
  content: "",
});

// 引用 TxtEditor 组件
const txtEditorRef = ref(null);
const metadata = ref({
  title: "",
  author: "",
  description: "",
  cover: "",
  ext: "",
  fileContent: "",
});

provide("curChapter", curChapter);
provide("chapters", chapters);
provide("metadata", metadata);

// 点击左侧菜单时更新 currentContent

const handleChapterClick = (chapter) => {
  curChapter.value = chapter;
};

EventBus.on("updateCurChapter", (newChapter) => {
  console.log("updateCurChapter", newChapter);
  curChapter.value = newChapter;
});
</script>

<template>
  <div class="container">
    <Header></Header>
    <div class="content">
      <div id="leftMenu">
        <div
          v-if="chapters.length > 0"
          v-for="(chapter, index) in chapters"
          :key="index"
          @click="handleChapterClick(chapter)"
        >
          {{ chapter.title }}
        </div>
        <div id="side-bar-header">
          <img id="side-bar-cover" />
          <div>
            <h1 id="side-bar-title"></h1>
            <p id="side-bar-author"></p>
          </div>
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

#side-bar-header {
  padding: 1rem;
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  align-items: center;
  padding: 5px;
}

#side-bar-cover {
  height: 10vh;
  min-height: 60px;
  max-height: 180px;
  border-radius: 3px;
  border: 0;
  background: lightgray;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.1), 0 0 16px rgba(0, 0, 0, 0.1);
  margin-inline-end: 1rem;
}

#side-bar-cover:not([src]) {
  display: none;
}

#side-bar-title {
  margin: 0.5rem 0;
  font-size: inherit;
}

#side-bar-author {
  margin: 0.5rem 0;
  font-size: small;
  color: GrayText;
}

#toc-view {
  padding: 0.5rem;
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
  transition: transform 0.2s ease;
  opacity: 0.5;
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

#toc-view [aria-expanded="false"] + [role="group"] {
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
  width: 200px;
  height: 100%;
  background-color: #f0f0f0;
  border-right: 1px solid #add8e6;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

#leftMenu div {
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-overflow: ellipsis;
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
