import { Modal, App, TFile, Notice, MarkdownPostProcessorContext} from "obsidian";
import { MDIO, Search } from "src/md";
import { bannedPropInTable, hiddenPropInTable} from "main";

export class Table {
    app: App;
    source: string;     // codeblock中的代码语句
    el: HTMLElement;
    context: MarkdownPostProcessorContext;
    table: HTMLTableElement;
    search: HTMLInputElement;

    constructor(app: App,source: string, el: HTMLElement, context: MarkdownPostProcessorContext) {
        this.app = app;
        this.source = source;
        this.el = el;
        this.context = context;

        var divOperate = el.createDiv({
            attr: {
                "class": "tableOpreate"
            }
        }) // 操作区域
        var divTable = el.createDiv()   // 表格区域
        var superThis = this

        // 1、刷新按钮
        var buttonFresh = divOperate.createEl("button")
        buttonFresh.innerHTML = "刷新"
        buttonFresh.onclick = function(this, evt) {
            // 重新渲染表格
            divTable.empty()
            superThis.renderTable()
            divTable.appendChild(superThis.table)
        }

        // 2、搜索框
        this.search = divOperate.createEl("input", {
            attr: {
                "type": "search"
            }
        })

        this.search.placeholder = "搜索..."
        this.search.onkeyup = function(this, evt) {
            if (evt.key == "Enter") {
                // 重新渲染表格
                divTable.empty()
                superThis.renderTable()
                divTable.appendChild(superThis.table)
            }
        }

        // 渲染表格
        this.renderTable()
        divTable.appendChild(this.table)
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

        // 允许的属性类型，若不满足则设为默认类型text
        var admittedType = [
            "text",
            "number",
            "date",
            "time",
            "checkbox",
            "img",
        ]

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
            if (!line.startsWith("prop:") && !line.startsWith("sort:")) {
                for (var item of line.split(':')) {
                    subConditions.push(item)
                }
                conditions.push(subConditions)
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
                    sortList.push(item.split(':'))
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

    // 对于可编辑的td，为其创建输入或者其它元素
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
                if (input.getAttr("name")) {
                    input.checked = true
                }
                else {
                    input.checked = false
                }
            }; break;
            case "img": {
                // 隐藏input
                input.style.visibility = "hidden"
                input.value = datalist[i]
                // 点击img会出现input
                td.createEl("img", {
                    attr: {
                        "src" : input.getAttr("name")
                    }
                })
                td.ondblclick = function(this) {
                    this.children[1].style.visibility = "visible"
                }
                // input.style.visibility = "visible"
                
            }; break;
            default:input.value = datalist[i]; break;

        }

        // 2、处理input失焦动作
        var app = this.app
        input.onblur = function(this) {
            var md = new MDIO(app, this.getAttr("path"))
            // 根据不同类型处理
            switch(this.getAttr("type")) {
                case "checkbox": {
                    if (this.getAttr("name")!=this.checked){
                        this.setAttr("name", this.checked)   
                        // 有该属性则修改值
                        if (md.hasProperty(this.getAttr("list"))) {
                            md.tableUpdateProperty(this.getAttr("list"), this.checked)
                        }
                        // 没有该属性则新建该属性并赋值
                        else {
                            md.addProperty(this.getAttr("list"), this.checked)
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
