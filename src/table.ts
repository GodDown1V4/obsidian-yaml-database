import { Modal, App, TFile, Notice, MarkdownPostProcessorContext} from "obsidian";
import { MDIO, Search } from "src/md";
import { importantProp, bannedFolder} from "main";
import { table } from "console";

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

        // 解析代码块中的条件
        var conditions: Array<Array<string>> = new Array()
        for (var line of this.source.split('\n')) {
            var subConditions = new Array()
            for (var item of line.split(':')) {
                subConditions.push(item)
            }
            conditions.push(subConditions)
        }
        var search = new Search(this.app);
        var tfiles = search.getSelectedTFiles(conditions)


        // 渲染表格
        this.renderTable(tfiles)

        
        var div = el.createEl("div", {
            "attr" : {
                "style": "width:100%; overflow:scroll;"
            }
        })

        div.appendChild(this.table)
    }

    renderTable(tfiles: Array<TFile>) {
        this.table = document.createElement("table")
        this.table.setAttrs({
            "style": "table-layout:fixed;",
        })
        
        // 设置题头，按顺序依次为：文件名、属性1、属性2、……
        var search = new Search(this.app);

        var headslist = search.getYamlPropertiesNameOfTfiles(tfiles)
        headslist.unshift("文件")

        this.setTh(headslist)

        for (var file of tfiles) {
            var datalist = new Array()
            for (var i=0; i<headslist.length; i++) {
                if (i == 0) {
                    datalist.push(file.path)
                }
                else {
                    var md = new MDIO(this.app, file.path)
                    if (md.hasProperty(headslist[i])) {
                        datalist.push(md.getPropertyValue(headslist[i]))
                    }
                    else {
                        datalist.push("")
                    }
                }
            }
            this.addNewTr(headslist, datalist)
        }

        // 添加新行，第一列为文件路径
        
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
                    // "style": `widtr:${1/datalist.length}%`,
                })
                td.innerHTML = `<a class="internal-link" data-hredf="${datalist[i]}" href="${datalist[i]}" target="_blank" rel="noopener">${datalist[i].split('/').pop()}</a>`
            }
            else {
                td.setAttrs({
                    'contenteditable': 'true',
                    "value": datalist[0],
                    "list": headslist[i],
                    // "style": `widtr:${1/datalist.length}%`,
                })
                td.innerHTML = datalist[i]
            }
            

            var app = this.app
            td.onblur = function(this) {
                var md = new MDIO(app, this.getAttr("value"))
                // 有该属性则修改值
                if (md.hasProperty(this.getAttr("list"))) {
                    md.updatePropertyValue(this.getAttr("list"), this.innerHTML)
                }
                // 没有该属性则新建该属性并赋值
                else {
                    md.addProperty(this.getAttr("list"), this.innerHTML)
                }
            }
            tr.appendChild(td)
        }

    }


}