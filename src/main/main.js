const { app, BrowserWindow, ipcMain, Menu, dialog, Tray } = require('electron');
const { isDevEnv } = require('./env');
const path = require('path');
const { detectEncoding, readTxtFile } = require('./txtParse');
const { createEpub } = require('./createEpub');
const { initDatabase } = require('./dbtool')
const fs = require('fs');
const Store = require("electron-store");
const store = new Store();
const htmlPath = path.join(app.getPath('userData'), 'bookdata', 'htmls');
let resourcesRoot = path.resolve(app.getAppPath());
let publicRoot = path.join(__dirname, '../../public');

if (!isDevEnv) {
    resourcesRoot = path.dirname(resourcesRoot);
    publicRoot = path.join(__dirname, '../../dist');
}

let mainWin = null, tray = null;
let options = {
    width: 1050,
    height: 660,
    frame: false,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
    },
};

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
    app.quit();
} else {
    app.on("second-instance", (event, argv, workingDir) => {
        if (mainWin) {
            if (!mainWin.isVisible()) mainWin.show();
            mainWin.focus();
        }
    });
}
/* 自定义函数 */
const startup = () => {
    init()
}

const init = () => {
    app.whenReady().then(async () => {
        await initDatabase();
        mainWin = createWindow();
        initWindowBounds(mainWin);
    })

    app.on('activate', (event) => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWin = createWindow()
        }
    })

    app.on('window-all-closed', (event) => {
        if (!isDevEnv) {
            app.quit()
        }
    })

    app.on('before-quit', (event) => {
        sendToRenderer('app-quit')
    })
}


//创建浏览窗口
const createWindow = () => {
    if (!mainWin) {
        // 从 electron-store 中获取窗口大小和位置
        const windowWidth = parseInt(store.get("mainWindowWidth") || 1050);
        const windowHeight = parseInt(store.get("mainWindowHeight") || 660);
        const windowX = parseInt(store.get("mainWindowX"));
        const windowY = parseInt(store.get("mainWindowY"));
        const mainWindow = new BrowserWindow({
            ...options,
            width: windowWidth,
            height: windowHeight,
            x: windowX,
            y: windowY
        });
        if (isDevEnv) {
            mainWindow.loadURL("http://localhost:2000/")
            mainWindow.webContents.openDevTools()
        } else {
            mainWindow.loadFile('dist/index.html')
        }

        tray = new Tray(path.join(publicRoot, '/images/logo.png'));
        tray.setToolTip('Less-Epuber');
        let contextMenu = generateContextMenu();
        tray.setContextMenu(contextMenu);
        tray.on('double-click', () => {
            mainWindow.show();
        });
        mainWindow.once('ready-to-show', () => {
            mainWindow.show()
        })

        mainWindow.once('ready-to-show', () => {
            mainWindow.show()
        })
        // 监听窗口大小改变事件
        mainWindow.on("resize", () => {
            if (!mainWindow.isDestroyed()) {
                if (!mainWindow.isMaximized()) {
                    let bounds = mainWindow.getBounds();
                    store.set({
                        mainWindowWidth: bounds.width,
                        mainWindowHeight: bounds.height,
                    });
                } else {
                    console.log('当前为大化状态，不保存窗口大小和位置');
                }
            }
        });
        // 监听窗口移动事件
        mainWindow.on("move", () => {
            if (!mainWindow.isDestroyed()) {
                if (!mainWindow.isMaximized()) {
                    let bounds = mainWindow.getBounds();
                    store.set({
                        mainWindowX: bounds.x,
                        mainWindowY: bounds.y,
                    });
                }
            }
        });
        return mainWindow
    }
    return mainWin;
}

// 动态生成上下文菜单
const generateContextMenu = () => {
    return Menu.buildFromTemplate([
        {
            label: '打开主界面',
            icon: path.join(publicRoot, '/images/app.png'),
            click: () => {
                mainWin.show();
            },
        },
        { type: 'separator' }, // 添加分隔线

        {
            label: '退出',
            icon: path.join(publicRoot, '/images/quit.png'),
            click: function () {
                app.quit();
            },
        },
    ]);
};

const initWindowBounds = (win) => {
    store.get('mainWindowWidth') || store.set('mainWindowWidth', win.getSize()[0]);
    store.get('mainWindowHeight') || store.set('mainWindowHeight', win.getSize()[1]);
    store.get('mainWindowX') || store.set('mainWindowX', win.getPosition()[0]);
    store.get('mainWindowY') || store.set('mainWindowY', win.getPosition()[1]);
}

ipcMain.on('window-min', event => {
    const webContent = event.sender;
    const win = BrowserWindow.fromWebContents(webContent);
    win.hide();
});

ipcMain.on('window-max', event => {
    const webContent = event.sender;
    const win = BrowserWindow.fromWebContents(webContent);
    if (win.isMaximized()) {
        const width = store.get("mainWindowWidth") || 1050;
        const height = store.get("mainWindowHeight") || 660;
        const x = store.get("mainWindowX") || mainWin.getPosition()[0];
        const y = store.get("mainWindowY") || mainWin.getPosition()[1];
        if (width && height) {
            win.setSize(width, height);
            if (x && y) {
                win.setPosition(x, y);
            }
        }
    } else {
        win.maximize();
    }
});

ipcMain.on('window-close', event => {
    const webContent = event.sender;
    const win = BrowserWindow.fromWebContents(webContent);
    win.hide();
});

ipcMain.handle('open-file-dialog', async (event, fileType) => {
    console.log(fileType);
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWin, {
        properties: ['openFile'],
        filters: [
            { name: 'E-Books', extensions: [fileType] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (!canceled) {
        const filePath = filePaths[0];
        try {
            // 检测文件编码
            const encoding = await detectEncoding(filePath);
            console.log(`检测到文件编码为: ${encoding}`);
            // 读取 TXT 文件内容
            const fileContent = await readTxtFile(filePath, encoding);
            // 将文件内容发送给渲染端
            sendToRenderer('file-content', { filePath, fileContent });
        } catch (error) {
            console.error('读取文件时出错:', error);
        }
        return filePath;
    }
    return null;
});

const sendToRenderer = (channel, args) => {
    try {
        if (mainWin) mainWin.webContents.send(channel, args)
    } catch (error) {
    }
}

// 定义转换函数
const chapters2Html = (chapters) => {
    return chapters.map((chapter) => {
        // 复制原对象，避免修改原始数据
        const newChapter = { ...chapter };
        // 将 content 中的换行符替换为 <p> 标签
        newChapter.content = formatText(newChapter.content);
        return newChapter;
    });
};

// 格式化文本，添加分段和缩进
const formatText = (text) => {
    const lines = text.split('\n');
    let paragraphs = [];

    for (let line of lines) {
        line = line.trim();
        if (line !== '') {
            paragraphs.push(`<p>${line}</p>`);
        }
    }

    return paragraphs.join('\n');
}

ipcMain.handle('export-epub', async (event, { chapters, metadata }) => {
    try {
        console.log(chapters, metadata);
        const newChapter = chapters2Html(chapters);
        // 弹出保存对话框
        const { filePath } = await dialog.showSaveDialog({
            title: '保存 EPUB 文件',
            defaultPath: `${metadata.title}.epub`,
            filters: [
                { name: 'EPUB 文件', extensions: ['epub'] },
                { name: '所有文件', extensions: ['*'] }
            ]
        });

        if (!filePath) {
            return { success: false, message: '用户取消保存' };
        }

        await createEpub(newChapter, metadata).then((epubContent) => {
            console.log('导出文件目录', filePath);
            fs.writeFile(filePath, epubContent, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('文件写入成功');
                }
            });
        });
        return { success: true, filePath };
    } catch (error) {
        console.error('导出 EPUB 失败:', error);
        return { success: false, message: error.message };
    }
});

// 监听渲染进程发送的 save-str 事件
ipcMain.on('save-str', (event, { timestamp, fileName, content }) => {
    const saveDir = path.join(htmlPath, String(timestamp));
    const savePath = path.join(saveDir, fileName);
    fs.mkdirSync(path.dirname(savePath), { recursive: true });
    fs.writeFile(savePath, content, 'utf8', (err) => {
        if (err) {
            console.error('保存文件时出错:', err);
        } else {
            console.log(`文件 ${fileName} 保存成功`);
        }
    });
});

//启动应用
startup()

