import { ColDef, GridApi } from "ag-grid-community";
import t from "i18n";
import { App, Notice } from "obsidian";
import { MDIO, Search } from "./md";
import { DateEditor, InlinkEditor, NumberEditor, TimeEditor } from "components/CustomCellEditor";
import { ImgCellRender, InLinkCellRender, TagCellRender, TodoCellRender } from "components/CustomCellRender";

var hiddenPropInTable = ""

export const admittedTypeCellRender = {
    "text": "",
    "number": "",
    "date": "",
    "time": "",
    "checkbox": TodoCellRender,
    "img": ImgCellRender,
    "tags": TagCellRender,
    "textarea": "",
    "inLink": InLinkCellRender,
    "select": "",
}
export const admittedTypeCellEditor = {
    "text": "",
    "number": NumberEditor,
    "date": DateEditor,
    "time": TimeEditor,
    "checkbox": "",
    "img": "",
    "tags": "",
    "textarea": "agLargeTextCellEditor",
    "inLink": InlinkEditor,
    "select": "agSelectCellEditor",
}


export interface yamlCodeblockJson {
    id: string                             // id
    colDef: Array<ColDef>                  // 列定义
    filterModal: { [key: string]: any; }   // 列过滤器
    folder: string
    paginationSize: number
    templatePath: string
}

export class Codeblock {
    app: App;
    source: string;     // codeblock中的代码语句

    constructor(app: App, source: string) {
        this.app = app;
        this.source = source;

        this.initYamlCodeblockJson()
    }

    private async write(newJson: yamlCodeblockJson) {
        // console.log("写入json到文档");

        // 写入source
        const file = this.app.workspace.getActiveFile()
        const oldContent = await this.app.vault.read(file)
        await this.app.vault.modify(file, oldContent.replace(this.source, JSON.stringify(newJson).replace(/\n/g, '') + "\n"))
        // 更新source
        this.source = JSON.stringify(newJson)
    }

    /**
     * 进行json数据使用前的检查
     *  在进行任何的加载和保存操作前都需要进行
     * -------------------------------------------
     *  - colDef：检查数量并整理（删除失效列、添加新的有效列）
     *  - columnState：检查数量并整理（删除失效列、添加新的有效列）
     *  - filterModal：无需检查
     * -------------------------------------------
     *  1、colDef
     *      1.1、检查失效列并删除
     *      1.2、检查列 yamleditFirstFileColumn 是否存在
     *      1.3、添加新的有效列
     *      1.4、若1、2、3步均无异常发生，则退出函数；否则写入代码块（会刷新表格）
     */
    private initYamlCodeblockJson() {
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)

        // console.log('codblock 初始化', yamlCodeblockJson);

        if (!yamlCodeblockJson.folder) {
            yamlCodeblockJson.folder = '/'
            new Notice(t("setRootAsFolder"))
        }
        const yamlPropertiesName = new Search(this.app).getYamlPropertiesNameOfAFolder(yamlCodeblockJson.folder)

        if (!yamlCodeblockJson.colDef) {
            yamlCodeblockJson.colDef = new Array()
        }

        var isOk = true

        // 1、获取source中colDef有效列和失效列
        var validColDefNameList: Array<string> = new Array()
        var invalidColDefIndexList: Array<number> = new Array()
        yamlCodeblockJson.colDef.map((colDef, index) => {
            if (yamlPropertiesName.indexOf(colDef.field) != -1) {
                validColDefNameList.push(colDef.colId)
            }
            else if (colDef.field == "yamleditFirstFileColumn") {
                if (colDef.type != "inLink") {
                    isOk = false
                    colDef.type = "inLink"
                }
                validColDefNameList.push(colDef.colId)
            }
            else {
                isOk = false
                invalidColDefIndexList.push(index)
            }
        })

        // 1.1、删除失效列
        invalidColDefIndexList.map((value) => {
            yamlCodeblockJson.colDef.splice(value, 1)
        })
        // 1.2、检查有效列中是否包含 yamleditFirstFileColumn 是否存在
        if (validColDefNameList.indexOf("yamleditFirstFileColumn") == -1) {
            isOk = false
            validColDefNameList.unshift("yamleditFirstFileColumn")
            yamlCodeblockJson.colDef.unshift({
                colId: "yamleditFirstFileColumn",
                field: "yamleditFirstFileColumn",
                headerName: t("yamleditFirstFileColumn"),
                type: "inLink",
                width: 200,
                hide: false,
            })
        }

        // 1.3、添加新的有效列
        yamlPropertiesName.map((prop) => {
            // 若该属性在source的colDef中不存在则添加
            if (validColDefNameList.indexOf(prop) == -1) {
                isOk = false
                yamlCodeblockJson.colDef.push({
                    colId: prop,
                    field: prop,
                    headerName: prop,
                    type: "text",
                    width: 200,
                    hide: true,
                })
            }
        })

        // 初始化页面分页条数，默认50条
        if (!yamlCodeblockJson.paginationSize) {
            isOk = false
            yamlCodeblockJson.paginationSize = 50
        }
        else if (yamlCodeblockJson.paginationSize > 1000) {
            isOk = false
            yamlCodeblockJson.paginationSize = 1000
        }
        else if (yamlCodeblockJson.paginationSize < 0) {
            isOk = false
            yamlCodeblockJson.paginationSize = 1
        }

        // 若不ok说明source属性和库中的yaml属性不匹配，将库中的属性更新到yaml表格中去，即写入代码块
        if (!isOk) {
            this.write(yamlCodeblockJson)
        }
    }

    getColumsFromFiles() {
        const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        const newColDefs = yamlCodeblockJson.colDef.map((el: ColDef) => {
            el.cellEditor = admittedTypeCellEditor[String(el.type)]
            el.cellRenderer = admittedTypeCellRender[String(el.type)]
            el.editable = (el.type == "checkbox") ? false : true
            return el
        })
        return newColDefs
    }

    getRowsFromFiles() {
        const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        var cols = this.getColumsFromFiles()
        const rows = new Search(this.app).getTAbstractFilesOfAFolder(yamlCodeblockJson.folder).map((tabstractFile) => {
            var md = new MDIO(this.app, tabstractFile.path)
            const arow = cols.map((col) => {
                if (col.field == "yamleditFirstFileColumn") {
                    return { [col.field]: tabstractFile.path }
                } else {
                    return { [col.field]: md.getPropertyValue(col.field) }
                }
            })
            return Object.assign({}, ...arow)
        })
        return rows
    }

    loadColDef(api: GridApi) {
        // console.log("加载Col");
        const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        const newColDefs = yamlCodeblockJson.colDef.map((el: ColDef) => {
            el.cellEditor = admittedTypeCellEditor[String(el.type)]
            el.cellRenderer = admittedTypeCellRender[String(el.type)]
            el.editable = (el.type == "checkbox") ? false : true
            return el
        })
        api.setColumnDefs(newColDefs)
    }

    saveColDef(api: GridApi) {
        const needToSave = [
            "colId",
            "field",
            "headerName",
            "sort",
            "sortIndex",
            "type",
            "cellEditorParams",
            "width",
            "hide"
        ]
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        yamlCodeblockJson.colDef = api.getColumnDefs().map((col: ColDef) => {
            var newColDef: ColDef = {}
            for (var item in col) {
                // console.log(item, col[item], typeof (col[item]))
                if (needToSave.indexOf(item) != -1) {
                    if (item == "cellEditorParams") {
                        if (col.type == "select") {
                            newColDef[item] = {
                                "values": col[item]["values"]
                            }
                        }
                    }
                    else {
                        newColDef[item] = col[item]
                    }

                }
            }
            return newColDef
        })

        this.write(yamlCodeblockJson)
    }

    loadFliterModal(api: GridApi) {
        // console.log("加载Filter");
        const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        api.setFilterModel(yamlCodeblockJson.filterModal)
    }

    saveFliterModal(api: GridApi) {
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        yamlCodeblockJson.filterModal = api.getFilterModel()
        this.write(yamlCodeblockJson)
    }

    setFolder(folderPath: string) {
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        yamlCodeblockJson.folder = folderPath
        this.write(yamlCodeblockJson)
    }
    setTemplate(filePath: string) {
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        yamlCodeblockJson.templatePath = filePath
        this.write(yamlCodeblockJson)
    }

    setPaginationSize(size: number) {
        var yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.source)
        yamlCodeblockJson.paginationSize = size
        this.write(yamlCodeblockJson)
    }
}
