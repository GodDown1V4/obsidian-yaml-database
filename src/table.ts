import { Modal, App, TFile, Notice, MarkdownPostProcessorContext } from "obsidian";
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from "src/md";
import { hiddenPropInTable } from "main";
import { createInputWithChoice, add3SearchInput, add2SortSelect, add4SearchPropInput, SelectedFileModal, add2newSettingsInput, addnewItemInput } from "src/modal"
import { setInterval } from "timers";

var buttonConut = true

// 允许的属性类型，若不满足则设为默认类型text
export var admittedType = [
    "text",
    "number",
    "date",
    "time",
    "checkbox",
    "img",
    "url",
]

export class Table {
    app: App;
    source: string;     // codeblock中的代码语句
    el: HTMLElement;
    context: MarkdownPostProcessorContext;
    table: HTMLTableElement;
    search: HTMLInputElement;
    divOperate: HTMLDivElement;
    refreshButton: HTMLButtonElement;

    constructor(app: App, source: string, el: HTMLElement, context: MarkdownPostProcessorContext) {
        this.app = app;
        this.source = source;
        this.el = el;
        this.context = context;

        el.empty()

        // 操作区域
        this.divOperate = el.createDiv({
            attr: {
                "class": "tableOpreate"
            }
        })
        var divTable = el.createDiv()   // 表格区域
        var superThis = this

        // 1、刷新按钮
        this.refreshButton = this.divOperate.createEl("button")
        this.refreshButton.innerHTML = "刷新"
        this.refreshButton.onclick = function (this, evt) {
            // 重新渲染表格
            divTable.empty()
            superThis.renderTable()
            divTable.appendChild(superThis.table)
        }

        // 2、搜索框
        this.search = this.divOperate.createEl("input", {
            attr: {
                "type": "search"
            }
        })

        this.search.placeholder = "搜索..."
        this.search.oninput = function (this) {
            divTable.empty()
            superThis.renderTable()
            divTable.appendChild(superThis.table)
        }

        // 3、属性按钮（显示名称、数据类型）
        var propButton = this.divOperate.createEl("button")
        propButton.innerHTML = "属性"
        // 4、排序按钮
        var sortButton = this.divOperate.createEl("button")
        sortButton.innerHTML = "↑↓"
        // 5、筛选文档按钮
        var filterButton = this.divOperate.createEl("button")
        filterButton.innerHTML = "筛选"
        // 6、添加文档按钮
        var addButton = this.divOperate.createEl("button")
        addButton.innerHTML = "＋"
        // 对应操作
        propButton.onclick = function (this, evt) {
            superThis.propModal(this)
        }
        sortButton.onclick = function (this, evt) {
            superThis.sortModal(this)
        }
        filterButton.onclick = function (this, evt) {
            superThis.filterModal(this)
        }
        addButton.onauxclick = function (this, evt) {
            superThis.newSettingsModal(this)
        }
        addButton.onclick = function (this, evt) {
            superThis.newItemModal(this)
        }

        // 渲染表格
        this.renderTable()
        divTable.appendChild(this.table)
    }

    /**
     * ================================================================
     * 解析source
     * ================================================================
     */

    // 属性参数部分
    parseProp(): Array<Array<string>> {
        // 判断是否有prop选项
        var showPropsList: Array<Array<string>> = new Array()
        for (var line of this.source.split('\n')) {
            // 开头为prop:的不是条件是属性
            if (line.startsWith("prop:")) {
                for (var item of line.replace('prop:', '').split(',')) {
                    // 属性名:属性显示名称:属性类型
                    if (item) {
                        showPropsList.push(item.split(":"))
                    }
                }
                break
            }
        }

        return showPropsList
    }
    getHeadsByProp(tfiles: Array<TFile>): Array<Array<string>> {
        // 设置题头，按顺序依次为：文件名、属性1、属性2、……
        var search = new Search(this.app);

        var headslist = search.getYamlPropertiesNameOfTfiles(tfiles)
        // 判断是否有prop选项
        var showPropsList = this.parseProp()

        if (!showPropsList.length) {
            // 没有prop就排除隐藏的属性后显示
            for (var defaultHead of headslist) {
                if (hiddenPropInTable.split("\n").indexOf(defaultHead) == -1) {
                    showPropsList.push([defaultHead, defaultHead, "text", "200px"])
                }
            }
        }
        showPropsList.unshift(["文件", "文件", "text", "200px"])
        return showPropsList
    }

    // 条件参数部分
    parseConditions(): Array<Array<string>> {
        // 解析代码块中的现实的条件
        var conditions: Array<Array<string>> = new Array()
        for (var line of this.source.split('\n')) {
            // 开头为prop:的不是条件
            if (line.startsWith("condition:")) {
                var lineList = line.replace("condition:", "").split(":")
                if (lineList.length > 3) {
                    conditions.push([lineList[0], lineList[1], line.replace(`${lineList[0]}:${lineList[1]}:`, "")])
                }
                else if (lineList.length == 3) {
                    conditions.push([lineList[0], lineList[1], lineList[2]])
                }
            }
        }
        return conditions
    }
    getTfilesByConditions(): Array<TFile> {
        // 解析代码块中的条件参数
        var conditions: Array<Array<string>> = this.parseConditions()

        // 如果搜索框中有值，那么需要将搜索框的内容也添加为条件
        var tfiles = new Search(this.app).getSelectedTFiles(conditions)
        var newTfiles: Array<TFile> = new Array()
        if (this.search.value) {
            var propList = this.getHeadsByProp(tfiles)
            for (var file of tfiles) {
                var md = new MDIO(this.app, file.path)
                for (var i = 0; i < propList.length; i++) {
                    if (i == 0) {
                        // propList的第一个是文件
                        if (file.basename.indexOf(this.search.value) != -1) {
                            newTfiles.push(file)
                            break
                        }
                    }
                    else {
                        // propList的第一个是文件，后边才是属性
                        if (String(md.getPropertyValue(propList[i][0])).indexOf(this.search.value) != -1) {
                            newTfiles.push(file)
                            break
                        }
                    }
                }
            }
        }
        else {
            newTfiles = tfiles
        }

        return newTfiles
    }

    // 排序参数部分
    parseSort(): Array<Array<string>> {
        // 判断是否有sort选项
        var sortList: Array<Array<string>> = new Array()
        // 解析排序
        for (var line of this.source.split('\n')) {
            // 开头为sort:
            if (line.startsWith("sort:")) {
                for (var item of line.replace("sort:", "").split(',')) {
                    if (item) {
                        sortList.push(item.split(':'))
                    }
                }
            }
        }
        return sortList
    }
    getTfilesBySort(tfiles: Array<TFile>, headslist: Array<Array<string>>): Array<TFile> {

        var sortList = this.parseSort()
        // 筛选类型为checkbox的属性名称
        var chcekboxHeads: Array<string> = new Array()
        for (var head of headslist) {
            if (head[2] == "checkbox") {
                chcekboxHeads.push(head[0])
            }
        }

        // 先按最后的条件排序，这样就能实现多条件排序了
        for (var sort of sortList.reverse()) {
            // 
            if (sort[0] == "文件") {
                if (sort[1].toLowerCase() == "desc") {
                    // 降序
                    tfiles.sort((a, b) => b.basename.localeCompare(a.basename, 'zh')); //z~a 排序
                }
                else {
                    // 升序
                    tfiles.sort((a, b) => a.basename.localeCompare(b.basename, 'zh')); //a~z 排序
                }
            }
            else {
                if (chcekboxHeads.indexOf(sort[0]) != -1) {
                    function boolStrToNumber(str: string): number {
                        if (str == 'true') {
                            return 1
                        }
                        else {
                            return 0
                        }
                    }
                    if (sort[1].toLowerCase() == "desc") {
                        // 降序
                        tfiles.sort((a, b) => boolStrToNumber(String(new MDIO(this.app, b.path).getPropertyValue(sort[0]))) - boolStrToNumber(String(new MDIO(this.app, a.path).getPropertyValue(sort[0])))); //true~false 排序
                    }
                    else {
                        // 升序
                        tfiles.sort((a, b) => boolStrToNumber(String(new MDIO(this.app, a.path).getPropertyValue(sort[0]))) - boolStrToNumber(String(new MDIO(this.app, b.path).getPropertyValue(sort[0])))); //false~true 排序
                    }
                }
                else {
                    if (sort[1].toLowerCase() == "desc") {
                        // 降序
                        tfiles.sort((a, b) => String(new MDIO(this.app, b.path).getPropertyValue(sort[0])).localeCompare(String(new MDIO(this.app, a.path).getPropertyValue(sort[0])), 'zh')); //z~a 排序
                    }
                    else {
                        // 升序
                        tfiles.sort((a, b) => String(new MDIO(this.app, a.path).getPropertyValue(sort[0])).localeCompare(String(new MDIO(this.app, b.path).getPropertyValue(sort[0])), 'zh')); //a~z 排序
                    }
                }
            }
        }

        return tfiles
    }

    // 新建文档位置及文档模板参数部分 new:文件夹路径:文件模板路径
    parseNewSettings(): Array<string> {
        // 判断是否有new选项
        var newSettingsList: Array<string> = ["", ""]
        for (var line of this.source.split('\n')) {
            if (line.startsWith("new:") && line.replace("new:", "").split(":").length == 2) {
                newSettingsList = line.replace("new:", "").split(":")
                break
            }
        }
        return newSettingsList
    }
    // 返回可以使用的newSettings，[文件夹路径,模板文件路径]，返回的文件夹路径后面带/
    getNewConfig(): Array<string> {
        var pathList = this.context.sourcePath.split("/")
        pathList.pop()
        var cunnentFolderPath = pathList.join("/")

        // 解析new设置获得新建文件夹路径和模板路径
        var newSettings = this.parseNewSettings()
        var folderPath = newSettings[0]
        var templatePath = newSettings[1]

        // 检查文件夹路径和文件路径是否存在
        if (folderPath) {
            if (new Search(this.app).getAllFoldersPathList().indexOf(folderPath) == -1) {
                folderPath = ""
            }
        }
        if (templatePath) {
            if (new Search(this.app).getAllFilesPathList().indexOf(templatePath) == -1) {
                templatePath = ""
            }
        }
        console.log(templatePath)

        // 若文件夹路径不存在，则按系统设置创建文件
        var newFileLocation = this.app.vault.config.newFileLocation
        if (!folderPath) {
            // 检查系统默认新建文档位置
            switch (newFileLocation) {
                case "root": folderPath = "/"; break;
                case "current": folderPath = cunnentFolderPath; break;
                case "folder": folderPath = this.app.vault.config.newFileFolderPath; break;
                default: folderPath = "/"; break;
            }
        }
        if (!folderPath) {
            // 如果还是没有正确的路径那就在根路径下创建文档
            folderPath = "/"
        }
        if (!folderPath.endsWith("/")) {
            folderPath = folderPath + "/"
        }

        return [folderPath, templatePath]
    }

    /**
     * ================================================================
     * 操作区域
     * ================================================================
     */
    filterModal(mainbutton: GlobalEventHandlers) {

        mainbutton.disabled = true
        // 解析代码块中的现实的条件
        var oldConditions = this.parseConditions()
        var otherParams: Array<string> = new Array()
        for (var line of this.source.split('\n')) {
            // 如果开头不是条件且不为空行
            if (!line.startsWith("condition:") && line) {
                otherParams.push(line)
            }
        }

        // 在操作面板下方新建一个操作区域
        var filterDiv = this.divOperate.createDiv()
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app

        // 无刷新表单
        filterDiv.createEl("iframe", {
            'attr': {
                'id': 'id_iframe',
                'name': 'id_iframe',
                'style': 'display:none',
            }
        })
        var filterConDiv = filterDiv.createDiv()
        var button = filterDiv.createEl("button", {
            attr: {
                "data-toggle": "tooltip",
                "title": "添加新的筛选文档的条件"
            }
        })
        var cancelbutton = filterDiv.createEl("button")

        var form = filterConDiv.createEl("form", {
            'attr': {
                'name': 'form1',
                'target': 'id_iframe',
            }
        })
        button.setText("➕")
        button.onclick = function () {
            var conditionArea = add3SearchInput(app)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea);

        }

        // 确认框
        form.createEl("input", {
            'attr': {
                'target': 'id_iframe',
                'type': 'submit',
                'value': '   确定    ',
            }
        })
        cancelbutton.setText("取消编辑")
        cancelbutton.onclick = function () {
            filterDiv.remove()
            mainbutton.disabled = false
        }

        for (var condition of oldConditions) {
            var conditionArea = add3SearchInput(this.app, condition)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea);
        }


        var superThis = this

        form.onsubmit = function (this) {
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value) && String(conInput[2].value)) {
                    otherParams.push(`condition:${conInput[0].value}:${conInput[1].value}:${conInput[2].value}`)
                }
            }
            var newContent = ""
            for (var line of otherParams) {
                if (line) {
                    newContent = newContent + line + "\n"
                }
            }
            superThis.updateCodeBlock(newContent)
            filterDiv.remove()
            // 重新渲染表格
            setInterval(() => {
                superThis.refreshButton.click()
            }, 500)
            mainbutton.disabled = false
        }

    }

    sortModal(mainbutton: GlobalEventHandlers) {
        mainbutton.disabled = true
        var otherParams = new Array()
        // 解析排序
        var sortList = this.parseSort()
        for (var line of this.source.split('\n')) {
            // 开头为sort:
            if (!line.startsWith("sort:") && line) {
                otherParams.push(line)
            }
        }

        // 在操作面板下方新建一个操作区域
        var sortDiv = this.divOperate.createDiv()
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app

        // 无刷新表单
        sortDiv.createEl("iframe", {
            'attr': {
                'id': 'id_iframe',
                'name': 'id_iframe',
                'style': 'display:none',
            }
        })
        var filterConDiv = sortDiv.createDiv()
        var button = sortDiv.createEl("button", {
            attr: {
                "data-toggle": "tooltip",
                "title": "添加新的排序条件"
            }
        })
        var cancelbutton = sortDiv.createEl("button")

        var form = filterConDiv.createEl("form", {
            'attr': {
                'name': 'form1',
                'target': 'id_iframe',
            }
        })
        button.setText("➕")
        var propsList = new Search(app).getYamlPropertiesNameOfTfiles(this.getTfilesByConditions())
        propsList.unshift("文件")
        button.onclick = function () {

            var conditionArea = add2SortSelect(propsList)
            form.appendChild(conditionArea[2])
            inputList.push(conditionArea);

        }

        // 确认框
        form.createEl("input", {
            'attr': {
                'target': 'id_iframe',
                'type': 'submit',
                'value': '   确定    ',
            }
        })
        cancelbutton.setText("取消编辑")
        cancelbutton.onclick = function () {
            sortDiv.remove()
            mainbutton.disabled = false
        }

        for (var condition of sortList) {
            var conditionArea = add2SortSelect(propsList, condition)
            form.appendChild(conditionArea[2])
            inputList.push(conditionArea);
        }


        var superThis = this

        form.onsubmit = function (this) {
            var newContent = ""
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value)) {
                    newContent = newContent + `${conInput[0].value}:${conInput[1].value},`
                }
            }
            // 如果有值
            if (newContent) {
                newContent = otherParams.join("\n") + "\nsort:" + newContent
            }
            else {
                newContent = otherParams.join("\n")
            }
            var result = ""
            for (var line of newContent.split("\n")) {
                if (line) {
                    result = result + line + "\n"
                }
            }
            // 更新代码块并移除当前面板
            superThis.updateCodeBlock(String(result))
            sortDiv.remove()
            // 重新渲染表格
            setInterval(() => {
                superThis.refreshButton.click()
            }, 500)
            mainbutton.disabled = false
        }

    }

    propModal(mainbutton: GlobalEventHandlers) {
        var superThis = this
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app
        mainbutton.disabled = true

        // 解析代码块中的属性参数
        var oldPropsList = this.parseProp()
        var otherParams: Array<string> = new Array()
        for (var line of this.source.split('\n')) {
            // 获取不是属性的参数并存入新行
            if (!line.startsWith("prop:") && line) {
                otherParams.push(line)
            }
        }

        // 在操作面板下方新建一个操作区域
        var propDiv = this.divOperate.createDiv()

        var bulkButton = propDiv.createEl("button")
        bulkButton.setText("批量编辑属性")
        bulkButton.onclick = function () {
            // 解析代码块中的现实的条件
            var condotions = superThis.parseConditions()
            new SelectedFileModal(superThis.app, condotions).open()
        }


        // 无刷新表单
        propDiv.createEl("iframe", {
            'attr': {
                'id': 'id_iframe',
                'name': 'id_iframe',
                'style': 'display:none',
            }
        })
        var filterConDiv = propDiv.createDiv()
        var button = propDiv.createEl("button", {
            attr: {
                "data-toggle": "tooltip",
                "title": "添加新的显示属性"
            }
        })
        var cancelbutton = propDiv.createEl("button")

        var form = filterConDiv.createEl("form", {
            'attr': {
                'name': 'form1',
                'target': 'id_iframe',
            }
        })
        var propsList = new Search(app).getYamlPropertiesNameOfTfiles(this.getTfilesByConditions())

        button.setText("➕")
        button.onclick = function () {
            var conditionArea = add4SearchPropInput(propsList)
            form.appendChild(conditionArea[4])
            inputList.push(conditionArea);

        }
        cancelbutton.setText("取消编辑")
        cancelbutton.onclick = function () {
            propDiv.remove()
            mainbutton.disabled = false
        }

        // 确认框
        form.createEl("input", {
            'attr': {
                'target': 'id_iframe',
                'type': 'submit',
                'value': '   确定    ',
            }
        })
        for (var condition of oldPropsList) {
            var conditionArea = add4SearchPropInput(propsList, condition)
            form.appendChild(conditionArea[4])
            inputList.push(conditionArea);
        }

        form.onsubmit = function (this) {
            var newContent = ""
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value) && String(conInput[2].value) && String(conInput[3].value)) {
                    newContent = newContent + `${conInput[0].value}:${conInput[1].value}:${conInput[2].value}:${conInput[3].value},`
                }
            }
            // 如果参数有值
            if (newContent) {
                newContent = otherParams.join("\n") + "\nprop:" + newContent
            }
            else {
                newContent = otherParams.join("\n")
            }
            var result = ""
            for (var line of newContent.split("\n")) {
                if (line) {
                    result = result + line + "\n"
                }
            }
            superThis.updateCodeBlock(result)
            propDiv.remove()  // 删除面板
            // 重新渲染表格
            setInterval(() => {
                superThis.refreshButton.click()
            }, 500)
            mainbutton.disabled = false
        }
    }

    newSettingsModal(mainbutton: GlobalEventHandlers) {
        var superThis = this
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app
        mainbutton.disabled = true

        // 解析代码块中的属性参数
        var oldNewSettings = this.parseNewSettings()
        var otherParams: Array<string> = new Array()
        for (var line of this.source.split('\n')) {
            // 获取不是属性的参数并存入新行
            if (!line.startsWith("new:") && line) {
                otherParams.push(line)
            }
        }

        // 在操作面板下方新建一个操作区域
        var newSettingsDiv = this.divOperate.createDiv()


        // 无刷新表单
        newSettingsDiv.createEl("iframe", {
            'attr': {
                'id': 'id_iframe',
                'name': 'id_iframe',
                'style': 'display:none',
            }
        })
        var filterConDiv = newSettingsDiv.createDiv()
        var cancelbutton = newSettingsDiv.createEl("button")

        var form = filterConDiv.createEl("form", {
            'attr': {
                'name': 'form1',
                'target': 'id_iframe',
            }
        })

        cancelbutton.setText("取消编辑")
        cancelbutton.onclick = function () {
            newSettingsDiv.remove()
            mainbutton.disabled = false
        }

        // 确认框
        form.createEl("input", {
            'attr': {
                'target': 'id_iframe',
                'type': 'submit',
                'value': '   确定    ',
            }
        })
        var foldersList = new Search(app).getAllFoldersPathList()
        var filesList = new Search(app).getAllFilesPathList()
        var conditionArea = add2newSettingsInput(foldersList, filesList, oldNewSettings)
        form.appendChild(conditionArea[2])
        inputList.push(conditionArea);

        form.onsubmit = function (this) {
            var newContent = `${otherParams.join("\n")}`
            for (var conInput of inputList) {
                // 判断文件夹是否信息正确，不正确就设为空
                if (foldersList.indexOf(conInput[0].value) != -1) {
                    newContent = `${newContent}\nnew:${conInput[0].value}:`
                }
                else {
                    newContent = `${newContent}\nnew::`
                }
                // 判断模板文件是否信息正确，不正确就设为空
                if (filesList.indexOf(conInput[1].value) != -1) {
                    newContent = `${newContent}${conInput[1].value}`
                }
                else {
                    newContent = `${newContent}`
                }
            }
            superThis.updateCodeBlock(newContent)
            newSettingsDiv.remove()  // 删除面板
            mainbutton.disabled = false
        }
    }
    newItemModal(mainbutton: GlobalEventHandlers) {
        var superThis = this
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app
        mainbutton.disabled = true

        // 解析代码块中的属性参数
        var oldNewSettings = this.parseNewSettings()

        // 在操作面板下方新建一个操作区域
        var newSettingsDiv = this.divOperate.createDiv()


        // 无刷新表单
        newSettingsDiv.createEl("iframe", {
            'attr': {
                'id': 'id_iframe',
                'name': 'id_iframe',
                'style': 'display:none',
            }
        })
        var filterConDiv = newSettingsDiv.createDiv()
        var cancelbutton = newSettingsDiv.createEl("button")

        var form = filterConDiv.createEl("form", {
            'attr': {
                'name': 'form1',
                'target': 'id_iframe',
            }
        })

        cancelbutton.setText("取消新建")
        cancelbutton.onclick = function () {
            newSettingsDiv.remove()
            mainbutton.disabled = false
        }

        // 确认框
        form.createEl("input", {
            'attr': {
                'target': 'id_iframe',
                'type': 'submit',
                'value': '   确定    ',
            }
        })
        var input = addnewItemInput()
        form.appendChild(input)


        input.oninput = function (this) {
            superThis.renameCheck(this.value, superThis.getNewConfig()[0])
        }

        input.focus()

        function solveConditions(path: string) {
            // 检查模板文件，为模板文件赋值条件参数
            // 1、yaml包含：若模板文件不含则添加
            // 2、yaml属性：若模板文件不含则添加，不符合则更改
            // 3、标签：若模板文件不含则添加
            setTimeout(() => {
                var md = new MDIO(app, path)
                var conditions = superThis.parseConditions()
                for (var i = 0; i < conditions.length; i++) {
                    var doSomething = false
                    switch (conditions[i][0]) {
                        case "yaml": {
                            if (conditions[i][1] == "包含") {
                                if (!md.hasProperty(conditions[i][2])) {
                                    doSomething = true
                                    md.addProperty(conditions[i][2])
                                }
                            } else {
                                if (md.hasProperty(conditions[i][2])) {
                                    doSomething = true
                                    md.delProperty(conditions[i][2])
                                }
                            }
                        }; break;
                        case "yaml属性": {
                            if (!md.hasProperty(conditions[i][1])) {
                                doSomething = true
                                md.addProperty(conditions[i][1], conditions[i][2])
                            }
                            else {
                                if (md.getPropertyValue(conditions[i][1]) != conditions[i][2]) {
                                    doSomething = true
                                    md.updatePropertyValue(conditions[i][1], conditions[i][2])
                                }
                            }
                        }; break;
                        case "标签": {
                            if (conditions[i][1] == "包含") {
                                if (!md.hasTag(conditions[i][2])) {
                                    // 为模板文件添加标签
                                    if (md.hasProperty("tags")) {
                                        doSomething = true
                                        md.updatePropertyValue("tags", `${md.getTagsName().join(",")},${conditions[i][2]}`)
                                    }
                                    else if (md.hasProperty("tag")) {
                                        doSomething = true
                                        md.updatePropertyValue("tag", `${md.getTagsName().join(",")},${conditions[i][2]}`)
                                    }
                                    else {
                                        doSomething = true
                                        md.addProperty("tags", conditions[i][2])
                                    }
                                }
                            } else {
                                if (md.hasTag(conditions[i][2])) {
                                    // 为模板文件删除标签
                                    var newTagsList = new Array()
                                    for (var tag of md.getTagsName()) {
                                        if (tag != conditions[i][2]) {
                                            newTagsList.push(tag)
                                        }
                                    }
                                    if (md.hasProperty("tags")) {
                                        doSomething = true
                                        md.updatePropertyValue("tags", newTagsList.join(","))
                                    }
                                    else if (md.hasProperty("tag")) {
                                        doSomething = true
                                        md.updatePropertyValue("tag", newTagsList.join(","))
                                    }
                                    else {
                                        doSomething = true
                                        md.addProperty("tags", newTagsList.join(","))
                                    }
                                }
                            }
                        }; break;
                        default: break;
                    }
                    if (doSomething) {
                        setTimeout(() => {
                            solveConditions(path)
                        }, 100)
                        break
                    }
                }
            }, 100)
        }

        function insertTr(path: string): HTMLTableRowElement{
            var headslist = superThis.getHeadsByProp(superThis.getTfilesByConditions())
            var datalist = new Array()
            for (var i = 0; i < headslist.length; i++) {
                if (i == 0) {
                    datalist.push(path)
                }
                else {
                    var md = new MDIO(superThis.app, path)
                    datalist.push(md.getPropertyValue(headslist[i][0]))
                }
            }
            return superThis.createNewTr(headslist, datalist)
        }

        form.onsubmit = function (this) {
            var config = superThis.getNewConfig()
            if (superThis.renameCheck(input.value, config[0])) {
                // 创建文件
                if (config[1]) {    // 如果存在模板文件
                    for (var file of superThis.app.vault.getMarkdownFiles()) {
                        if (file.path = config[1]) {
                            solveConditions(config[1])
                            setTimeout(() => {
                                superThis.app.vault.copy(file, `${config[0]}${input.value}.md`)
                            }, 500)
                            break;
                        }
                    }
                }
                else {
                    superThis.app.vault.create(`${config[0]}${input.value}.md`, "").then(() => {
                        var md = new MDIO(app, `${config[0]}${input.value}.md`)
                        solveConditions(`${config[0]}${input.value}.md`)
                    })
                }
                newSettingsDiv.remove()  // 删除面板
                setTimeout(() => {
                    insertTr(`${config[0]}${input.value}.md`).insertAfter(superThis.table.children[0])
                }, 1000)
                mainbutton.disabled = false
            }
        }
    }

    updateCodeBlock(content: string) {
        if (!content.endsWith("\n")) {
            content = content + "\n"
        }
        var path = this.context.sourcePath
        for (var file of this.app.vault.getMarkdownFiles()) {
            if (file.path == path) {
                this.app.vault.read(file).then(oldContent => {
                    this.app.vault.modify(file, oldContent.replace(this.source, content)).then(() => {
                        // 赋值给source，实现不刷新页面重新渲染表格
                        this.source = content
                    })
                })
                return
            }
        }
    }

    /**
     * ================================================================
     * 渲染表格
     * ================================================================
     */
    renderTable() {
        // 1、解析conditions获取文档TFile数组
        var tfiles = this.getTfilesByConditions()
        this.table = document.createElement("table")
        this.table.setAttrs({
            "style": "table-layout:fixed;",
        })

        // 2、解析要显示的属性，设置题头，按顺序依次为：文件（行首会自动添加这个）、属性1、属性2、……
        var headslist = this.getHeadsByProp(tfiles)
        this.setTh(headslist)

        // 3、解析排序
        tfiles = this.getTfilesBySort(tfiles, headslist)

        // 4、为表格一行一行的添加数据
        for (var file of tfiles) {
            var datalist = new Array()
            for (var i = 0; i < headslist.length; i++) {
                if (i == 0) {
                    datalist.push(file.path)
                }
                else {
                    var md = new MDIO(this.app, file.path)
                    datalist.push(md.getPropertyValue(headslist[i][0]))
                }
            }
            this.table.appendChild(this.createNewTr(headslist, datalist))
        }

    }

    setTh(headslist: Array<Array<string>>) {
        var tr = this.table.createEl("tr")

        for (var col of headslist) {
            var th = document.createElement("th")
            th.setAttrs({
                'contenteditable': 'false',
            })
            th.setAttr("width", col[3])
            th.innerHTML = col[1]
            tr.appendChild(th)
        }

    }

    createNewTr(headslist: Array<Array<string>>, datalist: Array<string>): HTMLTableRowElement {
        var tr = document.createElement("tr")
        for (var i = 0; i < datalist.length; i++) {
            var td = document.createElement("td")
            td.setAttr("width", headslist[i][3])
            if (i == 0) {
                // 文件
                var a = document.createElement("a")
                a.setAttrs({
                    "class": "internal-link",
                    "data-hredf": datalist[i],
                    "href": datalist[i],
                    "target": "_blank",
                    "rel": "noopener",
                })
                a.innerHTML = datalist[i].split('/').pop().replace(".md", "")
                td.appendChild(a)
                td.setAttrs({
                    "path": datalist[i]
                })
                var superThis = this

                td.ondblclick = function (this) {
                    this.setAttrs({
                        "contenteditable": "true",
                    })
                    this.innerHTML = this.getAttr("path").split('/').pop().replace(".md", "")
                }
                td.oninput = function (this) {
                    var oldPath = this.getAttr("path")
                    var oldName = this.getAttr("path").split('/').pop().replace(".md", "")
                    var newValue = this.innerHTML
                    if (oldName != newValue) {
                        superThis.renameCheck(newValue, oldPath.replace(`${oldName}.md`, ""))
                    }
                }
                td.onblur = function (this) {
                    this.setAttrs({
                        "contenteditable": "false",
                    })
                    var oldPath = this.getAttr("path")
                    var oldName = this.getAttr("path").split('/').pop().replace(".md", "")
                    var newValue = this.innerHTML
                    if (oldName != newValue) {
                        if (superThis.renameCheck(newValue, oldPath.replace(`${oldName}.md`, ""))) {
                            // 重命名文件
                            var file = superThis.app.vault.getAbstractFileByPath(oldPath)
                            superThis.app.fileManager.renameFile(file, `${file.parent.path}/${newValue}.md`).then(() => {
                                this.empty()
                                var a = document.createElement("a")
                                a.setAttrs({
                                    "class": "internal-link",
                                    "data-hredf": `${file.parent.path}/${newValue}.md`,
                                    "href": `${file.parent.path}/${newValue}.md`,
                                    "target": "_blank",
                                    "rel": "noopener",
                                })
                                this.setAttrs({
                                    "path": `${file.parent.path}/${newValue}.md`
                                })
                                a.innerHTML = newValue
                                this.appendChild(a)
                            })
                            return
                        }
                    }
                    this.empty()
                    var a = document.createElement("a")
                    a.setAttrs({
                        "class": "internal-link",
                        "data-hredf": oldPath,
                        "href": oldPath,
                        "target": "_blank",
                        "rel": "noopener",
                    })
                    a.innerHTML = oldName
                    this.appendChild(a)
                }
            }
            else {
                td = this.createInput(td, headslist[i], datalist, i)
            }

            tr.appendChild(td)
        }
        return tr
    }

    createInput(td: HTMLTableCellElement, subHeadslist: Array<string>, datalist: Array<string>, i: number): HTMLTableCellElement {
        var propType = subHeadslist[2]   // 属性类型
        var path = datalist[0]       // 文档路径
        var lastValue = datalist[i]       // 修改前的值，用于判断当前值是否被修改
        var prop = subHeadslist[0]   // 当前属性
        var width = subHeadslist[3]

        // 1、处理input格式
        var input = td.createEl("input", {
            attr: {
                "type": propType,
                "path": path,    // 文档路径
                "name": lastValue,   // 修改前的值，用于判断当前值是否被修改
                "list": prop,   // 当前属性
                "style": "display:none",
            }
        })
        td.onclick = function () {
            if (input.getAttr("type") == "text") {

            }
            else {
                td.empty()
                td.appendChild(input)
                input.setAttr("style", "display:true")
                input.focus()
            }
        }
        this.solveInput(td, input)
        // 2、处理input失焦动作
        var app = this.app
        var superThis = this
        input.onblur = function (this: HTMLInputElement) {
            var md = new MDIO(app, this.getAttr("path"))
            // 根据不同类型处理
            switch (this.getAttr("type")) {
                case "checkbox": var newValue: string = String(this.checked); break;
                default: var newValue: string = this.value; break;
            }
            if (String(this.getAttr("name")) != newValue) {
                oneOperationYamlChangeHistory.length = 0
                this.setAttr("name", newValue)
                // 有该属性则修改值
                if (md.hasProperty(this.getAttr("list"))) {
                    md.tableUpdateProperty(this.getAttr("list"), newValue)
                }
                // 没有该属性则新建该属性并赋值
                else {
                    md.addProperty(this.getAttr("list"), newValue)
                }
                allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
            }
            input.setAttr("style", "display:none")
            superThis.solveInput(td, input)
        }
        td.appendChild(input)
        return td
    }

    solveInput(td: HTMLTableCellElement, input: HTMLInputElement) {
        td.empty()
        switch (input.getAttr("type")) {
            case "checkbox": {
                input.setAttr("style", "")
                if (input.getAttr("name") == "true") {
                    input.checked = true
                }
                else {
                    input.checked = false
                }
                input.onclick = function (this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            case "img": {
                input.value = input.getAttr("name")
                td.createEl("img", {
                    attr: {
                        "src": input.getAttr("name"),
                        "width": ""
                    }
                })

            }; break;
            case "url": {
                input.value = input.getAttr("name")
                td.createEl("a", {
                    attr: {
                        "href": input.getAttr("name")
                    }
                }).innerHTML = input.value

            }; break;
            case "date": {
                td.innerHTML = input.getAttr("name")
                input.value = input.getAttr("name")
                input.oninput = function (this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            case "time": {
                td.innerHTML = input.getAttr("name")
                input.value = input.getAttr("name")
                input.oninput = function (this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            case "text": {
                td.innerHTML = input.getAttr("name")
                input.value = input.getAttr("name")
                td.setAttr("contenteditable", "true")
                var superThis = this
                var app = this.app
                td.onblur = function () {
                    oneOperationYamlChangeHistory.length = 0
                    var newValue = td.innerHTML.replace(/<input.*/g, "")
                    var md = new MDIO(app, input.getAttr("path"))
                    if (String(input.getAttr("name")) != newValue) {
                        input.setAttr("name", newValue)
                        // 有该属性则修改值
                        if (md.hasProperty(input.getAttr("list"))) {
                            md.tableUpdateProperty(input.getAttr("list"), newValue)
                        }
                        // 没有该属性则新建该属性并赋值
                        else {
                            md.addProperty(input.getAttr("list"), newValue)
                        }
                    }
                    allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                    input.setAttr("style", "display:none")
                    superThis.solveInput(td, input)
                }
            }; break;
            default: {
                td.innerHTML = input.getAttr("name")
                input.value = input.getAttr("name")
            }; break;
        }
        td.appendChild(input)
    }


    /**
     * ================================================================
     * 添加页面功能
     * ================================================================
     */

    /**
     * 检查文件名称的重命名是否符合要求
     * @param basename 文件名称
     * @param folderPath 一般都是开头不带/，末尾带/，相对于库的路径
     */
    renameCheck(basename: string, folderPath: string) {
        var isOk = true

        var conditions = this.parseConditions()

        if (!folderPath.endsWith("/")) {
            folderPath = folderPath + "/"
        }

        // 1、检查文件名称是否符合条件
        for (var condition of conditions) {
            // 检查是否符合文件名称参数
            if (condition[0] == "文件名称") {
                var reg = new RegExp(condition[2]);
                if (condition[1] == "符合") {
                    if (!basename.match(reg)) {
                        isOk = false
                        break
                    }
                }
                else {
                    if (basename.match(reg)) {
                        isOk = false
                        break
                    }
                }
            }
            // 检查是否符合文件路径参数
            else if (condition[0] == "文件路径") {
                var reg = new RegExp(condition[2]);
                if (condition[1] == "符合") {
                    if (!`${folderPath}${basename}.md`.match(reg)) {
                        isOk = false
                        break
                    }
                }
                else {
                    if (`${folderPath}${basename}.md`.match(reg)) {
                        isOk = false
                        break
                    }
                }
            }
        }
        if (!isOk) {
            new Notice(`新建文件名称不符合yamledit的条件参数`)
            return false
        }

        // 2、检查文件名称是否与新建文档所在路径的其它文档重名
        var folder = this.app.vault.getAbstractFileByPath(folderPath.substring(0, folderPath.length - 1))
        if (folder) {
            if (folder.hasOwnProperty("children")) {
                for (var child of folder.children) {
                    if (child.name == `${basename}.md`) {
                        new Notice(`文件与其所在文件夹的其它重名。文件夹路径为: ${folderPath}`)
                        return false
                    }
                }
            }
        }

        // 3、检查文件名称是否合法
        // 不能以.开头
        if (basename.startsWith('.')) {
            isOk = false
            new Notice(`文件名称不能以.开头`)
            return false
        }
        // 不能包含*"\/<>:|?
        var unlegalChar = `*"\/<>:|?`
        for (var char of basename) {
            if (unlegalChar.indexOf(char) != -1) {
                isOk = false
                new Notice(`文件名称不能包含*"\/<>:|?`)
                return false
            }
        }

        return isOk
    }
}
