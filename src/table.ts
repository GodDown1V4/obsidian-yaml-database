import { Modal, App, TFile, Notice, MarkdownPostProcessorContext} from "obsidian";
import { MDIO, Search } from "src/md";
import { bannedPropInTable, hiddenPropInTable} from "main";
import { createInputWithChoice,add3SearchInput, add2SortInput, add3SearchPropInput, SelectedFileModal } from "src/modal"

var buttonConut = true

// 允许的属性类型，若不满足则设为默认类型text
export var admittedType = [
    "text",
    "number",
    "date",
    "time",
    "checkbox",
    "img",
]

export class Table {
    app: App;
    source: string;     // codeblock中的代码语句
    el: HTMLElement;
    context: MarkdownPostProcessorContext;
    table: HTMLTableElement;
    search: HTMLInputElement;
    divOperate: HTMLDivElement;
    buttonFresh: HTMLButtonElement;
    propbutton: HTMLButtonElement;
    sortbutton: HTMLButtonElement;
    FilterFresh: HTMLButtonElement;

    constructor(app: App,source: string, el: HTMLElement, context: MarkdownPostProcessorContext) {
        this.app = app;
        this.source = source;
        this.el = el;
        this.context = context;

        // 操作区域
        this.divOperate = el.createDiv({
            attr: {
                "class": "tableOpreate"
            }
        }) 
        var divTable = el.createDiv()   // 表格区域
        var superThis = this

        // 1、刷新按钮
        this.buttonFresh = this.divOperate.createEl("button")
        this.buttonFresh.innerHTML = "刷新"
        this.buttonFresh.onclick = function(this, evt) {
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
        this.search.oninput = function(this) {
            divTable.empty()
            superThis.renderTable()
            divTable.appendChild(superThis.table)
        }

        // 3、属性按钮（显示名称、数据类型）
        this.propbutton = this.divOperate.createEl("button")
        this.propbutton.innerHTML = "属性"
        // 4、排序按钮
        this.sortbutton = this.divOperate.createEl("button")
        this.sortbutton.innerHTML = "↑↓"
        // 5、筛选文档按钮
        this.FilterFresh = this.divOperate.createEl("button")
        this.FilterFresh.innerHTML = "筛选"
        // 对应操作
        this.propbutton.onclick = function(this, evt) {
            superThis.propModal(this)
        }
        this.sortbutton.onclick = function(this, evt) {
            superThis.sortModal(this) 
        }
        this.FilterFresh.onclick = function(this, evt) {
            superThis.filterModal(this)
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
    /**
     * ！！这要求用户使用时必须在代码块中创建ID！！
     * @returns 返回ID
     */
    parseID(): string {
        for (var line of this.source.split('\n')) {
            if (line.startsWith("id:")) {
                return line.replace("id:", "")
            }
        }
    }

    /**
     * 解析属性
     *  1、只有属性：`prop:属性名1,属性名2`
     *  2、有属性和显示名称：`prop:属性名1:name.显示1,属性名2`
     *  3、有属性和属性类型：`prop:属性名1:type.类型名,属性名2`
     *  4、有属性和显示名称以及属性类型：`prop:属性名1:name.显示1:type.属性名,属性名2:type.属性名:name.显示2`
     * @param tfiles 
     * @returns [["文件", "文件", "text"], ["属性", "name(默认为属性本身名)", "type(默认为text)"],……]
     */
    parseProp(tfiles: Array<TFile>): Array<Array<string>> {// 解析代码块中要显示的属性
        // 设置题头，按顺序依次为：文件名、属性1、属性2、……
        var search = new Search(this.app);

        var headslist = search.getYamlPropertiesNameOfTfiles(tfiles)
        // 判断是否有prop选项
        var showPropsList:Array<Array<string>> = new Array()
        var hasPropDisplayOption = false
        for (var line of this.source.split('\n')) {
            // 开头为prop:的不是条件
            if (line.startsWith("prop:")) {
                hasPropDisplayOption = true
                for (var item of line.replace('prop:', '').split(',')) {
                    var buffer:Array<string> = item.split(":")
                    // 默认属性显示名称及类型
                    var propItem: Array<string> = [buffer[0], buffer[0] , "text"]
                    switch (buffer.length) {
                        case 2: {
                            if (buffer[1].startsWith("name.")) {     // 开头为name
                                propItem[1] = buffer[1].replace("name.", "");
                            }
                            else if (buffer[1].startsWith("type.")) {    // 开头为type
                                if (admittedType.indexOf(buffer[1].replace("type.", "")) != -1) {
                                    propItem[2] = buffer[1].replace("type.", "");
                                }
                            }
                        }break;
                        case 3: {
                            if (buffer[1].startsWith("name.")) {     // 1开头为name
                                propItem[1] = buffer[1].replace("name.", "");
                            }
                            else if (buffer[1].startsWith("type.")) {    // 1开头为type
                                if (admittedType.indexOf(buffer[1].replace("type.", "")) != -1) {
                                    propItem[2] = buffer[1].replace("type.", "");
                                }
                            }

                            if (buffer[2].startsWith("name.")) {     // 2开头为name
                                propItem[1] = buffer[2].replace("name.", "");
                            }
                            else if (buffer[2].startsWith("type.")) {    // 2开头为type
                                if (admittedType.indexOf(buffer[2].replace("type.", "")) != -1) {
                                    propItem[2] = buffer[2].replace("type.", "");
                                }
                            }
                            
                        }break;
                        default: break;
                        
                    }
                    showPropsList.push(propItem) 
                }
                break
            }
        }
        var newHeadsList:Array<Array<string>> = new Array()
        if (hasPropDisplayOption) {
            // 如果有prop，那么就按新的属性列表显示
            for (var head of showPropsList) {
                if (headslist.indexOf(head[0]) != -1) {
                    newHeadsList.push(head)
                }
            }
        }
        else {
            // 没有prop就排除隐藏的属性后显示
            for (var defaultHead of headslist) {
                if (hiddenPropInTable.split("\n").indexOf(defaultHead) == -1) {
                    newHeadsList.push([defaultHead, defaultHead, "text"])
                }
            }
        }
        newHeadsList.unshift(["文件", "文件", "text"])
        return newHeadsList
    }

    parseConditions(): Array<TFile> {
        // 解析代码块中的现实的条件
        var conditions: Array<Array<string>> = new Array()
        for (var line of this.source.split('\n')) {
            var subConditions = new Array()
            // 开头为prop:的不是条件
            var lineList = line.split(":")
            if (!line.startsWith("prop:") && !line.startsWith("sort:") && !line.startsWith("id:") && lineList.length>=3) {
                if (lineList.length > 3) {
                    conditions.push([lineList[0], lineList[1] ,line.replace(`${lineList[0]}:${lineList[1]}:`, "")])
                }
                else {
                    for (var item of lineList) {
                        subConditions.push(item)
                    }
                    conditions.push(subConditions)
                }
            }
        }
        // 如果搜索框中有值，那么需要将搜索框的内容也添加为条件
        var tfiles = new Search(this.app).getSelectedTFiles(conditions)
        var newTfiles: Array<TFile> = new Array()
        if(this.search.value) {
            var propList = this.parseProp(tfiles)
            for (var file of tfiles){
                var md = new MDIO(this.app, file.path)
                for (var i=0; i<propList.length; i++) {
                    if (i==0){
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
   
    /**
     * 解析排序并返回排序后的TFile数组
     *  支持多条件排序，排序的顺序从前到后
     *  排序与排序之间使用`:`分隔，如`sort:文件,desc;ctime,desc`
     * @param tfiles 返回的是排序后的文档
     */
    parseSort(tfiles: Array<TFile>): Array<TFile> {

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
        
        // 先按最后的条件排序，这样就能实现多条件排序了
        for (var sort of sortList.reverse()) {
            // 
            if (sort[0] == "文件") {
                if (sort[1].toLowerCase() == "desc") {
                    // 降序
                    tfiles.sort((a, b)=> b.basename.localeCompare(a.basename, 'zh')); //z~a 排序
                }
                else {
                    // 升序
                    tfiles.sort((a, b)=> a.basename.localeCompare(b.basename, 'zh')); //a~z 排序
                }
            }
            else {
                if (sort[1].toLowerCase() == "desc") {
                    // 降序
                    tfiles.sort((a, b)=> String(new MDIO(this.app, b.path).getPropertyValue(sort[0])).localeCompare(String(new MDIO(this.app, a.path).getPropertyValue(sort[0])), 'zh')); //z~a 排序
                }
                else {
                    // 升序
                    tfiles.sort((a, b)=> String(new MDIO(this.app, a.path).getPropertyValue(sort[0])).localeCompare(String(new MDIO(this.app, b.path).getPropertyValue(sort[0])), 'zh')); //a~z 排序
                }
            }
        }
        
        return tfiles
    }

    /**
     * ================================================================
     * 操作区域
     * ================================================================
     */
    filterModal(mainbutton: GlobalEventHandlers) {
        
        mainbutton.disabled = true
        // 解析代码块中的现实的条件
        var oldConditions: Array<Array<string>> = new Array()
        var newConditions: Array<string> = new Array()
        for (var line of this.source.split('\n')) {
            var subConditions = new Array()
            // 开头为prop:的不是条件
            var lineList = line.split(":")
            if (!line.startsWith("prop:") && !line.startsWith("sort:") && !line.startsWith("id:") && lineList.length>=3) {
                if (lineList.length > 3) {
                    oldConditions.push([lineList[0], lineList[1] ,line.replace(`${lineList[0]}:${lineList[1]}:`, "")])
                }
                else {
                    for (var item of lineList) {
                        subConditions.push(item)
                    }
                    oldConditions.push(subConditions)
                }
            }
            else {
                if (line) {
                    newConditions.push(line)
                }
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
        var button = filterDiv.createEl("button")
        var cancelbutton = filterDiv.createEl("button")

		var form = filterConDiv.createEl("form", {
			'attr': {
                'name': 'form1',
				'target': 'id_iframe',
			}
		})
        button.setText("添加新的条件")
        button.onclick = function() {
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
        cancelbutton.onclick = function() {
            filterDiv.remove()
            mainbutton.disabled = false
        }
        
        for (var condition of oldConditions) {
            var conditionArea = add3SearchInput(this.app, condition)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea); 
        }


        var superThis = this
        
        form.onsubmit = function(this){
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value) && String(conInput[2].value)) {
                    newConditions.push(`${conInput[0].value}:${conInput[1].value}:${conInput[2].value}`)
                }
            }
            var newContent = ""
            for (var line of newConditions) {
                if (line) {
                    newContent = newContent + line + "\n"
                }
            }
            superThis.updateCodeBlock(newContent)
            filterDiv.remove()
            // 重新渲染表格
            setInterval(() => {
                superThis.buttonFresh.click()
            }, 500)
            mainbutton.disabled = false
        }
        
    }

    
    sortModal(mainbutton: GlobalEventHandlers) {
        mainbutton.disabled = true
        var newConditions = new Array()
        // 解析排序
        var sortList: Array<Array<string>> = new Array()
        for (var line of this.source.split('\n')) {
            // 开头为sort:
            if (line.startsWith("sort:")) {
                for (var item of line.replace("sort:", "").split(',')) {
                    if (item) {
                        sortList.push(item.split(':'))
                    }
                }
            }
            else {
                newConditions.push(line)
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
        var button = sortDiv.createEl("button")
        var cancelbutton = sortDiv.createEl("button")

		var form = filterConDiv.createEl("form", {
			'attr': {
                'name': 'form1',
				'target': 'id_iframe',
			}
		})
        button.setText("添加新的排序条件")
        var propsList = new Search(app).getYamlPropertiesNameOfTfiles(this.parseConditions())
        propsList.unshift("文件")
        button.onclick = function() {

            var conditionArea = add2SortInput(propsList)
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
        cancelbutton.onclick = function() {
            sortDiv.remove()
            mainbutton.disabled = false
        }
        
        for (var condition of sortList) { 
            var conditionArea = add2SortInput(propsList, condition)
            form.appendChild(conditionArea[2])
            inputList.push(conditionArea); 
        }


        var superThis = this
        
        form.onsubmit = function(this){
            var newContent = ""
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value)) {
                    newContent = newContent + `${conInput[0].value}:${conInput[1].value},`
                }
            }
            if (newContent) {
                newContent = newConditions.join("\n") + "\nsort:" + newContent
            }
            else {
                newContent = newConditions.join("\n")
            }
            var result = ""
            for (var line of newContent.split("\n")) {
                if (line) {
                    result = result + line + "\n"
                }
            }
            //
            superThis.updateCodeBlock(String(result))
            sortDiv.remove()
            // 重新渲染表格
            setInterval(() => {
                superThis.buttonFresh.click()
            }, 500)
            mainbutton.disabled = false
        }
        
    }

    propModal(mainbutton: GlobalEventHandlers) {
        var superThis = this
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app
        mainbutton.disabled = true

        // 解析代码块中的现实的条件
        var oldConditions = this.parseProp(this.parseConditions())
        oldConditions.shift()
        var newConditions: Array<string> = new Array()
        for (var line of this.source.split('\n')) {
            // 开头为prop:的不是条件
            if (!line.startsWith("prop:")) {
                newConditions.push(line)
            }
        }

        // 在操作面板下方新建一个操作区域
        var filterDiv = this.divOperate.createDiv()

        var bulkButton = filterDiv.createEl("button")
        bulkButton.setText("批量编辑属性")
        bulkButton.onclick = function() {
            // 解析代码块中的现实的条件
            var condotions: Array<Array<string>> = new Array()
            for (var line of superThis.source.split('\n')) {
                var subConditions = new Array()
                // 开头为prop:的不是条件
                var lineList = line.split(":")
                if (!line.startsWith("prop:") && !line.startsWith("sort:") && !line.startsWith("id:") && lineList.length>=3) {
                    if (lineList.length > 3) {
                        condotions.push([lineList[0], lineList[1] ,line.replace(`${lineList[0]}:${lineList[1]}:`, "")])
                    }
                    else {
                        for (var item of lineList) {
                            subConditions.push(item)
                        }
                        condotions.push(subConditions)
                    }
                }
            }
            new SelectedFileModal(superThis.app, condotions).open()
        }


		// 无刷新表单
		filterDiv.createEl("iframe", {
			'attr': {
				'id': 'id_iframe',
				'name': 'id_iframe',
				'style': 'display:none',
			}
		})
        var filterConDiv = filterDiv.createDiv()
        var button = filterDiv.createEl("button")
        var cancelbutton = filterDiv.createEl("button")

		var form = filterConDiv.createEl("form", {
			'attr': {
                'name': 'form1',
				'target': 'id_iframe',
			}
		})
        var propsList = new Search(app).getYamlPropertiesNameOfTfiles(this.parseConditions())

        button.setText("添加新的属性")
        button.onclick = function() {
            var conditionArea = add3SearchPropInput(propsList)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea);

        }
        cancelbutton.setText("取消编辑")
        cancelbutton.onclick = function() {
            filterDiv.remove()
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
        for (var condition of oldConditions) {
            var conditionArea = add3SearchPropInput(propsList, condition)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea); 
        }
        
        form.onsubmit = function(this){
            var newContent = ""
            for (var conInput of inputList) {
                if (String(conInput[0].value) && String(conInput[1].value) && String(conInput[2].value)) {
                    newContent = newContent + `${conInput[0].value}:name.${conInput[1].value}:type.${conInput[2].value},`
                }
            }
            if(newContent) {
                newContent = newConditions.join("\n")  + "\nprop:" + newContent
            }
            else {
                newContent = newConditions.join("\n")
            }
            var result = ""
            for (var line of newContent.split("\n")) {
                if (line) {
                    result = result + line + "\n"
                }
            }
            superThis.updateCodeBlock(result)
            filterDiv.remove()
            // 重新渲染表格
            setInterval(() => {
                superThis.buttonFresh.click()
            }, 500)
            mainbutton.disabled = false
        }
    }

    updateCodeBlock(content: string) {
        var path = this.context.sourcePath
        for (var file of this.app.vault.getMarkdownFiles()) {
            if (file.path == path) {
                this.app.vault.read(file).then(oldContent => {
                    this.app.vault.modify(file, oldContent.replace(this.source, content)).then(()=>{
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
        var tfiles = this.parseConditions()
        this.table = document.createElement("table")
        this.table.setAttrs({
            "style": "table-layout:fixed;",
        })

        // 2、解析排序
        tfiles = this.parseSort(tfiles)
        
        // 3、解析要显示的属性，设置题头，按顺序依次为：文件（行首会自动添加这个）、属性1、属性2、……
        var headslist = this.parseProp(tfiles)
        this.setTh(headslist)

        // 4、为表格一行一行的添加数据
        for (var file of tfiles) {
            var datalist = new Array()
            for (var i=0; i<headslist.length; i++) {
                if (i == 0) {
                    datalist.push(file.path)
                }
                else {
                    var md = new MDIO(this.app, file.path)
                    datalist.push(md.getPropertyValue(headslist[i][0]))
                }
            }
            this.addNewTr(headslist, datalist)
        }

        
    }

    setTh(headslist: Array<Array<string>>) {
        var tr = this.table.createEl("tr")

        for (var col of headslist) {
            var th = document.createElement("th")
            th.setAttrs({
                    'contenteditable': 'false',
                    // "style": `width:${1/datalist.length}%`,
                })
            th.innerHTML = col[1]
            tr.appendChild(th)
        }

    }

    addNewTr(headslist: Array<Array<string>>, datalist: Array<string>) {
        var tr = this.table.createEl("tr")
        for (var i=0; i<datalist.length; i++) {
            var td = document.createElement("td")
            if (i == 0) {
                td.innerHTML = `<a class="internal-link" data-hredf="${datalist[i]}" href="${datalist[i]}" target="_blank" rel="noopener">${datalist[i].split('/').pop().replace(".md", "")}</a>`
            }
            else {
                if (bannedPropInTable.split("\n").indexOf(headslist[i][0])==-1) {
                    td = this.createInput(td, headslist[i], datalist, i)
                }
                else{
                    // 重要属性不可编辑！！
                    td.innerHTML = datalist[i]
                }
            }
            
            tr.appendChild(td)
        }

    }
    
    createInput(td: HTMLTableCellElement, subHeadslist: Array<string>, datalist: Array<string>, i:number):HTMLTableCellElement {
        var propType = subHeadslist[2]   // 属性类型
        var path = datalist[0]       // 文档路径
        var lastValue = datalist[i]       // 修改前的值，用于判断当前值是否被修改
        var prop = subHeadslist[0]   // 当前属性
        
        // 1、处理input格式
        var input = td.createEl("input", {
            attr: {
                "type": propType,
                "path": path,    // 文档路径
                "name": lastValue,   // 修改前的值，用于判断当前值是否被修改
                "list": prop,   // 当前属性
            }
        })
        switch (propType) {
            case "checkbox": {
                if (input.getAttr("name") == "true") {
                    input.checked = true
                }
                else {
                    input.checked = false
                }
                input.onclick = function(this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            case "img": {
                input.value = datalist[i]
                // 隐藏input
                input.style.visibility = "hidden"
                // 点击img会出现input
                td.createEl("img", {
                    attr: {
                        "src" : input.getAttr("name")
                    }
                })
                td.ondblclick = function(this: HTMLTableCellElement) {
                    this.children[1].setAttr("style", "visibility:visible;")
                }
                // input.style.visibility = "visible"
                
            }; break;
            case "date":{
                input.value = datalist[i]
                input.oninput = function(this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            case "time":{
                input.value = datalist[i]
                input.oninput = function(this: HTMLInputElement) {
                    this.blur()
                }
            }; break;
            default:input.value = datalist[i]; break;

        }

        // 2、处理input失焦动作
        var app = this.app
        input.onblur = function(this:HTMLInputElement) {
            var md = new MDIO(app, this.getAttr("path"))
            // 根据不同类型处理
            switch(this.getAttr("type")) {
                case "checkbox": {
                    if (this.getAttr("name")!=String(String(this.checked))){
                        this.setAttr("name", this.checked)   
                        // 有该属性则修改值
                        if (md.hasProperty(this.getAttr("list"))) {
                            md.tableUpdateProperty(this.getAttr("list"), String(this.checked))
                        }
                        // 没有该属性则新建该属性并赋值
                        else {
                            md.addProperty(this.getAttr("list"), String(this.checked))
                        }
                    }
                }; break;
                case "img": {
                    this.style.visibility = "hidden"
                    
                    if (this.parentElement.children[0].getAttr("src")!=this.value){
                        this.parentElement.children[0].setAttr("src", this.value)   
                        // 有该属性则修改值
                        if (md.hasProperty(this.getAttr("list"))) {
                            md.tableUpdateProperty(this.getAttr("list"), this.value)
                        }
                        // 没有该属性则新建该属性并赋值
                        else {
                            md.addProperty(this.getAttr("list"), this.value)
                        }
                    }
                }break;
                default: {
                    if (this.getAttr("name")!=this.value){
                        this.setAttr("name", this.value)   
                        // 有该属性则修改值
                        if (md.hasProperty(this.getAttr("list"))) {
                            md.tableUpdateProperty(this.getAttr("list"), this.value)
                        }
                        // 没有该属性则新建该属性并赋值
                        else {
                            md.addProperty(this.getAttr("list"), this.value)
                        }
                    }
                }break;
            }
        }
        td.appendChild(input)
        return td
    }

}
