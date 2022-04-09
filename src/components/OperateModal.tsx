import { ColDef, GridApi, ICellEditorParams } from 'ag-grid-community'
import { App, Modal, ToggleComponent, Notice, DropdownComponent, SearchComponent, ButtonComponent } from 'obsidian'
import t from 'i18n'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import { admittedType } from './CustomHeader'
import { admittedTypeCellEditor, admittedTypeCellRender, Codeblock, yamlCodeblockJson } from 'yaml/parse'

interface Props extends ICellEditorParams {
    app: App
    columnDefs: ColDef[]
    rowData: Array<{ [key: string]: string }>
}

// export class 
/**
 * 1、属性显示控制
 * 2、页面条目限制
 */
export class OperateMolda extends Modal {
    api: GridApi
    source: string

    constructor(app: App, api: GridApi, source: string) {
        super(app)
        this.api = api
        this.source = source
    }

    onOpen(): void {
        const title = this.titleEl
        title.setText(t("tableSettings"));

        const { contentEl } = this;

        const coldefs = this.api.getColumnDefs()

        // 属性显隐控制
        const HideControlDivTitle = contentEl.createEl("h3", {
            attr: {
                'data-toggle': "tooltip",
                'title': t("openOrCloseThisSetting"),
                'class': "modalTitle",
            }
        })
        const columnHideControlDiv = contentEl.createDiv()

        columnHideControlDiv.style.display = 'none'
        HideControlDivTitle.innerHTML = t("displayOrHide")
        HideControlDivTitle.onclick = function () {
            columnHideControlDiv.style.display = (columnHideControlDiv.style.display == 'block') ? 'none' : 'block'
        }
        const toggleList = coldefs.map((col: ColDef) => {
            const div = document.createElement("div")
            div.setAttr("class", "tableSettingsModal")
            const toggle = new ToggleComponent(div)
                .setValue(!col.hide)
            if (col.colId == "yamleditFirstFileColumn") {
                toggle.disabled = true
            }
            div.createSpan().innerHTML = `&nbsp;&nbsp;${col.field}&nbsp;|&nbsp;${col.headerName}`
            columnHideControlDiv.appendChild(div)
            return toggle
        })
        // 应用变更按钮
        const confirmButton1 = columnHideControlDiv.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        confirmButton1.innerHTML = t("applyTheChanges")
        const superThis = this
        confirmButton1.onclick = function () {
            const toggleValuesList = toggleList.map((toggle) => {
                return toggle.getValue()
            })
            const newColumns = coldefs.map((col: ColDef, index) => {
                col.hide = !toggleValuesList[index]
                return col
            })
            superThis.api.setColumnDefs(newColumns)
            new Codeblock(superThis.app, superThis.source).saveColDef(superThis.api)
            superThis.close()
        }
        contentEl.createEl("hr")

        // 表格页面条数控制 TODO
        const paginationPageSizeTitle = contentEl.createEl("h3", {
            attr: {
                'data-toggle': "tooltip",
                'title': t("openOrCloseThisSetting"),
                'class': "modalTitle",
            }
        })
        const paginationSizeTitleDiv = contentEl.createDiv()

        paginationSizeTitleDiv.style.display = 'none'
        paginationPageSizeTitle.innerHTML = t("paginationPageSizeTitle")
        paginationPageSizeTitle.onclick = function () {
            paginationSizeTitleDiv.style.display = (paginationSizeTitleDiv.style.display == 'block') ? 'none' : 'block'
        }
        const pageSizeInput = paginationSizeTitleDiv.createEl("input", {
            attr: {
                type: "number",
                class: 'filterInput',
                placeholder: t("plsInput"),
                "value": JSON.parse(this.source).paginationSize
            }
        })
        const pageSizeConfirmButton = paginationSizeTitleDiv.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        pageSizeConfirmButton.innerHTML = t("applyTheChanges")
        pageSizeConfirmButton.onclick = function () {
            var size = Number(pageSizeInput.value)
            if (size > 1000) {
                size = 1000
            }
            else if (size < 0) {
                size = 1
            }
            new Codeblock(superThis.app, superThis.source).setPaginationSize(size)
            superThis.close()
        }



        contentEl.createEl("hr")

        // 文档筛选条件设置：当前表格管理的文档对象
        const FolderTitle = contentEl.createEl("h3", {
            attr: {
                'data-toggle': "tooltip",
                'title': t("openOrCloseThisSetting"),
                'class': "modalTitle",
            }
        })
        const FolderDiv = contentEl.createDiv()

        FolderDiv.style.display = 'none'
        FolderTitle.innerHTML = t("selectFolder")
        FolderTitle.onclick = function () {
            FolderDiv.style.display = (FolderDiv.style.display == 'block') ? 'none' : 'block'
        }
        FolderDiv.createDiv().innerHTML = t("selectFolderIntro")
        FolderDiv.createDiv().innerHTML = " "
        const folderInput = FolderDiv.createEl("input", {
            attr: {
                type: "text",
                class: 'filterInput',
                placeholder: t("plsSelectAFolder"),
                list: "folderSearch",
                "value": JSON.parse(this.source).folder
            }
        })
        const folderInputDataList = FolderDiv.createEl("datalist", {
            attr: {
                id: "folderSearch"
            }
        })
        new Search(this.app).getAllFoldersPath().map((folder) => {
            folderInputDataList.createEl("option", {
                attr: {
                    value: folder
                }
            })
        })
        const folderConfirmButton = FolderDiv.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        folderConfirmButton.innerHTML = t("applyTheChanges")
        folderConfirmButton.onclick = function () {
            if (new Search(superThis.app).getAllFoldersPath().indexOf(folderInput.value) != -1) {
                new Codeblock(superThis.app, superThis.source).setFolder(folderInput.value)
                superThis.close()
            }
            else {
                new Notice(`${t("isAWrongFolderPath")}: ${folderInput.value}`)
            }
        }
        contentEl.createEl("hr")

        // 新建文档模板设置
        const templateTitle = contentEl.createEl("h3", {
            attr: {
                'data-toggle': "tooltip",
                'title': t("openOrCloseThisSetting"),
                'class': "modalTitle",
            }
        })
        const templateDiv = contentEl.createDiv()

        templateDiv.style.display = 'none'
        templateTitle.innerHTML = t("templateConfig")
        templateTitle.onclick = function () {
            templateDiv.style.display = (templateDiv.style.display == 'block') ? 'none' : 'block'
        }
        templateDiv.createDiv().innerHTML = t("templateConfig")
        const templateInput = templateDiv.createEl("input", {
            attr: {
                type: "text",
                class: 'filterInput',
                placeholder: t("plsInput"),
                list: "templateSearch",
                "value": JSON.parse(this.source).templatePath
            }
        })
        const templateInputDataList = templateDiv.createEl("datalist", {
            attr: {
                id: "templateSearch"
            }
        })
        this.app.vault.getMarkdownFiles().map((file) => {
            templateInputDataList.createEl("option", {
                attr: {
                    value: file.path
                }
            })
        })
        const templateConfirmButton = templateDiv.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        templateConfirmButton.innerHTML = t("applyTheChanges")
        templateConfirmButton.onclick = function () {
            new Codeblock(superThis.app, superThis.source).setTemplate(templateInput.value)
            superThis.close()
        }
        contentEl.createEl("hr")
    }
}


export class EditPropertyMolda extends Modal {
    api: GridApi
    source: string
    propertyName: string

    constructor(app: App, api: GridApi, source: string, propertyName: string) {
        super(app)
        this.api = api
        this.source = source
        this.propertyName = propertyName
    }

    onOpen(): void {
        const title = this.titleEl
        title.setText(`${t("editProperty")}: ${this.propertyName}`);

        const { contentEl } = this;

        var columns = this.api.getColumnDefs()

        // 属性类型选择
        const TypeDiv = contentEl.createDiv()
        TypeDiv.innerHTML = t("type")
        const thisColumn = this.propertyName

        // 获取当前列原本的类型
        var thisType: string | Array<string> = ""
        columns.map((col: ColDef) => {
            if (col.field == thisColumn) {
                thisType = col.type
            }
        })
        // 添加dropdown
        const dropdown = new DropdownComponent(TypeDiv)
        dropdown.addOption(thisType, t(thisType))
        admittedType.map((T) => {
            if (T != thisType) {
                dropdown.addOption(T, t(T))
            }
        })
        contentEl.createEl("hr")
        // 根据dropdown动态设置type配置区域
        const typeConfigDiv = contentEl.createDiv()
        typeConfigDiv.innerHTML = t("typeConfig")
        typeConfigDiv.createEl("br")
        var typeConfigValue = ""
        function solveTypeConfig() {
            switch (dropdown.getValue()) {
                case "select": {
                    const textarea = typeConfigDiv.createEl("textarea")
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"].join("\n")
                        }
                    })
                    textarea.oninput = function () {
                        typeConfigValue = textarea.value
                    }
                }; break;
                case "multi-select": {
                    const textarea = typeConfigDiv.createEl("textarea")
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"].join("\n")
                        }
                    })
                    textarea.oninput = function () {
                        typeConfigValue = textarea.value
                    }
                }; break;
                default: break;
            }
        }
        solveTypeConfig()
        dropdown.onChange(() => {
            solveTypeConfig()
        })
        contentEl.createEl("hr")
        // 显隐和删除控制
        const hideAndDeleteDiv = contentEl.createDiv()
        // 显隐
        hideAndDeleteDiv.createSpan().innerHTML = `${t("hideInView")}&nbsp;&nbsp;`
        new ToggleComponent(hideAndDeleteDiv)
            .setValue(true)
            .onChange((value) => {
                const columns = this.api.getColumnDefs()
                const newColums = columns.map((col: ColDef) => {
                    if (col.colId == thisColumn) {
                        col.hide = !value
                    }
                    return col
                })
                this.api.setColumnDefs(newColums)
            })
        // 删除
        hideAndDeleteDiv.createEl("br")
        new ButtonComponent(hideAndDeleteDiv)
            .setButtonText(t("deleteProperty"))
            .onClick(() => {
                const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
                oneOperationYamlChangeHistory.length = 0
                new Search(this.app).getTAbstractFilesOfAFolder(yamlCodeblockJson.folder).map((file) => {
                    new MDIO(this.app, file.path).delProperty(thisColumn)
                })
                allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                // 由于修改了文档的yaml属性，所以这里会直接保存，会导致表格重新渲染
                setTimeout(() => {
                    new Codeblock(this.app, this.source).saveColDef(this.api)
                }, 100)
                this.close()
            })
        contentEl.createEl("hr")
        // 应用变更按钮
        const confirmButton = contentEl.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        confirmButton.innerHTML = t("applyTheChanges")
        const superThis = this
        confirmButton.onclick = function () {
            const type = dropdown.getValue()
            switch (type) {
                case "select": {
                    // 处理列
                    const newColums = columns.map((col: ColDef) => {
                        if (col.colId == thisColumn) {
                            col.type = type
                            col.cellEditor = admittedTypeCellEditor[type]
                            col.cellEditorParams = {
                                "values": typeConfigValue.split("\n")
                            }
                        }
                        return col
                    })
                    columns = newColums
                }; break;
                default: {
                    // 处理列
                    const newColums = columns.map((col: ColDef) => {
                        if (col.colId == thisColumn) {
                            col.type = type
                            col.cellEditor = admittedTypeCellEditor[type]
                            col.cellRenderer = admittedTypeCellRender[type]
                        }
                        return col
                    })
                    columns = newColums
                }; break
            }
            superThis.api.setColumnDefs(columns)
            superThis.close()
        }

        // 表格页面条数控制 TODO
        // 文档筛选条件设置：当前表格管理的文档对象

    }
}