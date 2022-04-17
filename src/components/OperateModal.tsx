import { ColDef, GridApi, ICellEditorParams, ValueGetterParams } from 'ag-grid-community'
import { App, Modal, ToggleComponent, Notice, DropdownComponent, SearchComponent, ButtonComponent } from 'obsidian'
import t from 'i18n'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import { DataJson } from 'yaml/parse'
import YamlDatabasePlugin from 'main'
import DataGrid, { columnTypes, genFormulaValueGetter } from './DataGrid'

// export class 
/**
 * 1、属性显示控制
 * 2、页面条目限制
 */
export class OperateMolda extends Modal {
    grid: DataGrid
    api: GridApi
    plugin: YamlDatabasePlugin

    constructor(grid: DataGrid) {
        super(grid.plugin.app)
        this.grid = grid
        this.api = grid.api
        this.plugin = grid.plugin
    }

    propHideControl() {
        const { contentEl } = this;
        const superThis = this
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
        const toggleList = this.api.getColumnDefs().map((col: ColDef) => {
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
        confirmButton1.onclick = function () {
            const toggleValuesList = toggleList.map((toggle) => {
                return toggle.getValue()
            })
            superThis.api.getColumnDefs().map((col: ColDef, index) => {
                superThis.grid.colimnApi.setColumnVisible(col.colId, toggleValuesList[index])
            })
            new DataJson(superThis.grid).saveColDef(superThis.api)
            superThis.close()
        }
    }

    async paginationPageSizeControl() {
        const { contentEl } = this;
        const superThis = this
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

        const DBconfig = await this.grid.getDBconfig()
        const pageSizeInput = paginationSizeTitleDiv.createEl("input", {
            attr: {
                type: "number",
                class: 'filterInput',
                placeholder: t("plsInput"),
                "value": DBconfig.paginationSize
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
            new DataJson(superThis.grid).setPaginationSize(superThis.api, size)
            superThis.close()
        }
    }

    async folderControl() {
        const { contentEl } = this;
        const superThis = this
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

        const DBconfig = await this.grid.getDBconfig()
        const folderInput = FolderDiv.createEl("input", {
            attr: {
                type: "text",
                class: 'filterInput',
                placeholder: t("plsSelectAFolder"),
                list: "folderSearch",
                "value": DBconfig.folder
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
                new DataJson(superThis.grid).setFolder(folderInput.value)
                superThis.grid.refreshBtnOnClick()
                superThis.close()
            }
            else {
                new Notice(`${t("isAWrongFolderPath")}: ${folderInput.value}`)
            }
        }
    }

    async templateControl() {

        const { contentEl } = this;
        const superThis = this
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
        const DBconfig = await this.grid.getDBconfig()
        templateDiv.createDiv().innerHTML = t("templateConfig")
        const templateInput = templateDiv.createEl("input", {
            attr: {
                type: "text",
                class: 'filterInput',
                placeholder: t("plsInput"),
                list: "templateSearch",
                "value": DBconfig.templatePath
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
            new DataJson(superThis.grid).setTemplate(templateInput.value)
            superThis.close()
        }
    }

    onOpen(): void {
        const title = this.titleEl
        title.setText(t("tableSettings"));

        const { contentEl } = this;

        // 属性显隐控制
        this.propHideControl()
        contentEl.createEl("hr")

        // 表格页面条数控制
        this.paginationPageSizeControl()
        contentEl.createEl("hr")

        // 文档筛选条件设置：当前表格管理的文档对象
        this.folderControl()
        contentEl.createEl("hr")

        // 新建文档模板设置
        this.templateControl()
        contentEl.createEl("hr")
    }
}


export class EditPropertyMolda extends Modal {
    grid: DataGrid
    plugin: YamlDatabasePlugin
    api: GridApi
    propertyName: string

    constructor(grid: DataGrid, propertyName: string) {
        super(grid.app)
        this.grid = grid
        this.plugin = grid.plugin
        this.api = grid.api
        this.propertyName = propertyName
    }

    onOpen(): void {
        const title = this.titleEl
        title.setText(`${t("editProperty")}: ${this.propertyName}`);

        const { contentEl } = this;
        const superThis = this
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
        var admittedType = new Array()
        for (var item in columnTypes) {
            admittedType.push(item)
        }
        admittedType.map((T) => {
            if (T != thisType) {
                dropdown.addOption(T, t(T))
            }
        })
        // 根据dropdown动态设置type配置区域
        const typeConfigDiv = contentEl.createDiv()
        typeConfigDiv.innerHTML = ""
        var typeConfigValue = ""
        function solveTypeConfig() {
            var columns = superThis.api.getColumnDefs()
            // console.log(dropdown.getValue());
            typeConfigDiv.innerHTML = ""
            switch (dropdown.getValue()) {
                case "tags": {
                    typeConfigDiv.createEl("br")
                    typeConfigDiv.innerHTML = t("typeConfig")
                    typeConfigDiv.createEl("br")
                    const textarea = typeConfigDiv.createEl("textarea")
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"].join("\n")
                            typeConfigValue = textarea.value
                        }
                    })
                    textarea.oninput = function () {
                        typeConfigValue = textarea.value
                    }
                }; break;
                case "select": {
                    typeConfigDiv.createEl("br")
                    typeConfigDiv.innerHTML = t("typeConfig")
                    typeConfigDiv.createEl("br")
                    const textarea = typeConfigDiv.createEl("textarea")
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"].join("\n")
                            typeConfigValue = textarea.value
                        }
                    })
                    textarea.oninput = function () {
                        typeConfigValue = textarea.value
                    }
                }; break;
                case "multiSelect": {
                    typeConfigDiv.createEl("br")
                    typeConfigDiv.innerHTML = t("typeConfig")
                    typeConfigDiv.createEl("br")
                    const textarea = typeConfigDiv.createEl("textarea")
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"].join("\n")
                            typeConfigValue = textarea.value
                        }
                    })
                    textarea.oninput = function () {
                        typeConfigValue = textarea.value
                    }
                }; break;
                case "formula": {
                    typeConfigDiv.createEl("br")
                    const colsName = superThis.api.getColumnDefs().map((col: ColDef) => {
                        return col.colId
                    })
                    typeConfigDiv.innerHTML = `${t("typeConfig")}<br>${t("existedColsName")}: ${colsName.join(", ")}`
                    typeConfigDiv.createEl("br")
                    const textarea = typeConfigDiv.createEl("textarea", {
                        attr: {
                            class: "formula"
                        }
                    })
                    textarea.placeholder = t("selectOptionsIntro")
                    columns.map((col: ColDef) => {
                        if (col.colId == thisColumn && col.cellEditorParams["values"]) {
                            textarea.defaultValue = col.cellEditorParams["values"]
                            typeConfigValue = textarea.value
                        }
                    })
                    textarea.oninput = function () {
                        try {
                            const colsName = superThis.api.getColumnDefs().map((col: ColDef) => {
                                return col.colId
                            })
                            // 替换值
                            var value = textarea.value
                            for (const colId of colsName) {
                                const newReg = new RegExp(`prop\\(${colId}\\)`)
                                value = value.replace(newReg, `''`)
                            }
                            new Function(value)()

                            typeConfigValue = textarea.value
                        }
                        catch (err) {
                            new Notice(t("wrongFormula"))
                            console.log(err);
                            typeConfigValue = ''
                        }
                    }
                }; break;
                default: break;
            }
        }
        solveTypeConfig()
        dropdown.onChange(() => {
            solveTypeConfig()
        })
        // 应用变更按钮
        contentEl.createEl("br")
        const confirmButton = contentEl.createEl("button", {
            attr: {
                "style": "background-color: #CC3333;color:white"
            }
        })
        confirmButton.innerHTML = t("applyTheChanges")
        confirmButton.onclick = function () {
            const type = dropdown.getValue()
            const newColums = columns.map((col: ColDef) => {
                if (col.colId == thisColumn) {
                    col.type = type
                    if (type == "select" || type == "multiSelect" || type == "tags") {
                        col.cellEditorParams = {
                            "values": typeConfigValue.split("\n")
                        }
                    }
                    else if (type == "formula") {
                        try {
                            const getter = genFormulaValueGetter(superThis.api.getColumnDefs(), typeConfigValue)
                            if (typeof (getter) == "string") {
                                col.cellEditorParams = {
                                    "values": ""
                                }
                                col.valueGetter = function () {
                                    return getter
                                }
                            }
                            else {
                                col.cellEditorParams = {
                                    "values": typeConfigValue
                                }
                                col.valueGetter = function (params: ValueGetterParams) {
                                    return String(getter(params))
                                }
                            }
                        }
                        catch (err) {
                            new Notice(t("wrongFormula"))
                            console.log(err);
                            col.cellEditorParams = {
                                "values": ""
                            }
                        }
                    }
                }
                return col
            })
            superThis.grid.setState({
                columnDefs: newColums
            })
            // superThis.api.setColumnDefs(columns)
            superThis.close()
        }

        contentEl.createEl("hr")
        // 显隐和删除控制
        const hideControlDiv = contentEl.createDiv()
        // 显隐
        hideControlDiv.createSpan().innerHTML = `${t("hideInView")}&nbsp;&nbsp;`
        new ToggleComponent(hideControlDiv)
            .setValue(true)
            .onChange((value) => {
                this.grid.colimnApi.setColumnVisible(thisColumn, value)
            })
        contentEl.createEl("hr")
        // 删除
        new ButtonComponent(contentEl)
            .setButtonText(t("deleteProperty"))
            .onClick(async () => {
                oneOperationYamlChangeHistory.length = 0
                const DBconfig = await this.grid.getDBconfig()
                new Search(this.app).getTFilesOfAFolder(DBconfig.folder).map(async (file) => {
                    await new MDIO(this.app, file.path).delProperty(thisColumn)
                })
                allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                // 由于修改了文档的yaml属性，所以这里会直接保存，会导致表格重新渲染
                var newCols = new Array()
                this.grid.api.getColumnDefs().map((col: ColDef) => {
                    if (col.colId != thisColumn) {
                        newCols.push(col)
                    }
                })
                this.api.setColumnDefs(newCols)
                this.close()
            })


    }

    onClose(): void {
    }
}