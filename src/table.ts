import { Modal, App, TFile, Notice, MarkdownPostProcessorContext} from "obsidian";
import { MDIO, Search } from "src/md";
import { bannedPropInTable, hiddenPropInTable} from "main";

export class Table {
    app: App;
    source: string;     // codeblock中的代码语句
    el: HTMLElement;
    context: MarkdownPostProcessorContext;
    table: HTMLTableElement;


    constructor(app: App,source: string, el: HTMLElement, context: MarkdownPostProcessorContext) {
        this.app = app;
        this.source = source;
        this.el = el;
        this.context = context;


        // 渲染表格
        this.renderTable()

        el.appendChild(this.table)
    }

    parseProp(tfiles: Array<TFile>): Array<string> {// 解析代码块中要显示的属性
        // 设置题头，按顺序依次为：文件名、属性1、属性2、……
        var search = new Search(this.app);

        var headslist = search.getYamlPropertiesNameOfTfiles(tfiles)
        var showPropsList: Array<string> = new Array()
        var hasPropDisplayOption = false
        for (var line of this.source.split('\n')) {
            // 开头为prop:的不是条件
            if (line.startsWith("prop:")) {
                hasPropDisplayOption = true
                for (var item of line.replace('prop:', '').split(',')) {
                    showPropsList.push(item)
                }
                break
            }
        }
        var newHeadsList = new Array()
        if (hasPropDisplayOption) {
            // 如果有prop，那么就按新的属性列表显示
            for (var head of showPropsList) {
                if (headslist.indexOf(head) != -1) {
                    newHeadsList.push(head)
                }
            }
        }
        else {
            // 没有prop就排除隐藏的属性后显示
            for (var head of headslist) {
                if (hiddenPropInTable.split("\n").indexOf(head) == -1) {
                    newHeadsList.push(head)
                }
            }
        }
        newHeadsList.unshift("文件")
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
        return new Search(this.app).getSelectedTFiles(conditions)
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
                for (var item of line.replace("sort:", "").split(':')) {
                    sortList.push(item.split(','))
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
                    datalist.push(md.getPropertyValue(headslist[i]))
                }
            }
            this.addNewTr(headslist, datalist)
        }

        
    }

    setTh(headslist: Array<string>) {
        var tr = this.table.createEl("tr")

        for (var col of headslist) {
            var th = document.createElement("th")
            th.setAttrs({
                    'contenteditable': 'false',
                    // "style": `width:${1/datalist.length}%`,
                })
            th.innerHTML = col
            tr.appendChild(th)
        }

    }

    addNewTr(headslist: Array<string>, datalist: Array<string>) {
        var tr = this.table.createEl("tr")
        for (var i=0; i<datalist.length; i++) {
            var td = document.createElement("td")
            if (i == 0) {
                td.setAttrs({
                    'contenteditable': 'false',
                    "list": headslist[i],
                })
                td.innerHTML = `<a class="internal-link" data-hredf="${datalist[i]}" href="${datalist[i]}" target="_blank" rel="noopener">${datalist[i].split('/').pop().replace(".md", "")}</a>`
            }
            else {
                // 重要属性不可编辑！！
                if (bannedPropInTable.split("\n").indexOf(headslist[i])==-1) {
                    // 如果不是重要属性
                    td.setAttrs({
                        'contenteditable': 'true',
                        "path": datalist[0],
                        "value": datalist[i],
                        "list": headslist[i],
                    })
                }
                else{
                    // 如果不是重要属性
                    td.setAttrs({
                        'contenteditable': 'false',
                        "path": datalist[0],
                        "value": datalist[i],
                        "list": headslist[i],
                    })
                }
                td.innerHTML = datalist[i]
            }
            
            var app = this.app
            td.onblur = function(this) {
                var md = new MDIO(app, this.getAttr("path"))
                if (this.getAttr("value")!=this.innerHTML){
                    this.setAttr("value", this.innerHTML)   
                    // 有该属性则修改值
                    if (md.hasProperty(this.getAttr("list"))) {
                        md.tableUpdateProperty(this.getAttr("list"), this.innerHTML)
                    }
                    // 没有该属性则新建该属性并赋值
                    else {
                        md.addProperty(this.getAttr("list"), this.innerHTML)
                    }
                }
            }
            tr.appendChild(td)
        }

    }


}