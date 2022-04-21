import { ColDef, GridApi } from "ag-grid-community";
import t from "i18n";
import { App, Notice } from "obsidian";
import { MDIO, Search } from "./md";
import YamlDatabasePlugin from "main";
import DataGrid from "components/DataGrid";


export interface dbconfig {
    id: string                             // id
    colDef: Array<ColDef>                  // 列定义
    filterModal: { [key: string]: any; }   // 列过滤器
    folder: string
    paginationSize: number
    templatePath: string
}

export class DataJson {
    grid: DataGrid
    app: App;
    plugin: YamlDatabasePlugin

    constructor(grid: DataGrid) {
        this.grid = grid
        this.plugin = grid.plugin
        this.app = grid.plugin.app;

        this.initYamlCodeblockJson()
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
    private async initYamlCodeblockJson() {
        var DBconfig = await this.grid.getDBconfig()
        // console.log('codblock 初始化', yamlCodeblockJson);

        if (!DBconfig.folder) {
            DBconfig.folder = '/'
            new Notice(t("setRootAsFolder"))
        }
        const yamlPropertiesName = new Search(this.app).getYamlPropertiesNameOfAFolder(DBconfig.folder)

        if (!DBconfig.colDef) {
            DBconfig.colDef = new Array()
        }

        var isOk = true

        // 1、获取source中colDef有效列和失效列
        var validColDefNameList: Array<string> = new Array()
        var invalidColDefIndexList: Array<number> = new Array()
        DBconfig.colDef.map((colDef: ColDef, index: number) => {
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
            DBconfig.colDef.splice(value, 1)
        })
        // 1.2、检查有效列中是否包含 yamleditFirstFileColumn 是否存在
        if (validColDefNameList.indexOf("yamleditFirstFileColumn") == -1) {
            isOk = false
            validColDefNameList.unshift("yamleditFirstFileColumn")
            DBconfig.colDef.unshift({
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
                DBconfig.colDef.push({
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
        if (!DBconfig.paginationSize) {
            isOk = false
            DBconfig.paginationSize = 50
        }
        else if (DBconfig.paginationSize > 1000) {
            isOk = false
            DBconfig.paginationSize = 1000
        }
        else if (DBconfig.paginationSize < 0) {
            isOk = false
            DBconfig.paginationSize = 1
        }

        // 若不ok说明source属性和库中的yaml属性不匹配，将库中的属性更新到yaml表格中去，即写入代码块
        if (!isOk) {
            this.grid.setDBconfig(DBconfig)
        }
    }

    async getColumsFromDataJson() {
        await this.initYamlCodeblockJson()
        var DBconfig = await this.grid.getDBconfig()
        const newColDefs = DBconfig.colDef.map((el: ColDef) => {
            return el
        })
        return newColDefs
    }

    async getRowsFromDataFiles() {
        var DBconfig = await this.grid.getDBconfig()
        var cols = await this.getColumsFromDataJson()
        const rows = new Search(this.app).getTFilesOfAFolder(DBconfig.folder).map((tFile) => {
            var md = new MDIO(this.app, tFile.path)
            const arow = cols.map((col: ColDef) => {
                if (col.field == "yamleditFirstFileColumn") {
                    return { [col.field]: tFile.path }
                }
                else if (col.type == 'createdTime') {
                    const time = new Date(tFile.stat.ctime)
                    return { [col.field]: `${time.toLocaleDateString()} ${time.toLocaleTimeString()}` }
                }
                else if (col.type == 'modifiedTime') {
                    const time = new Date(tFile.stat.mtime)
                    return { [col.field]: `${time.toLocaleDateString()} ${time.toLocaleTimeString()}` }
                }
                else {
                    return { [col.field]: md.getPropertyValue(col.field) }
                }
            })
            return Object.assign({}, ...arow)
        })
        return rows
    }

    async loadColDef(api: GridApi) {
        // console.log("加载Col");
        var DBconfig = await this.grid.getDBconfig()
        const newColDefs = DBconfig.colDef.map((el: ColDef) => {
            return el
        })
        api.setColumnDefs(newColDefs)
    }

    async saveColDef(api: GridApi) {
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
        var DBconfig = await this.grid.getDBconfig()
        DBconfig.colDef = api.getColumnDefs().map((col: ColDef) => {
            var newColDef: ColDef = {}
            for (var item in col) {
                // console.log(item, col[item], typeof (col[item]))
                if (needToSave.indexOf(item) != -1) {
                    if (item == "cellEditorParams") {
                        if (col.type == "select" || col.type == "multiSelect" || col.type == "tags" || col.type == "formula") {
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
        this.grid.setDBconfig(DBconfig)
    }

    async loadFliterModal(api: GridApi) {
        // console.log("加载Filter");
        var DBconfig = await this.grid.getDBconfig()
        api.setFilterModel(DBconfig.filterModal)
    }

    async saveFliterModal(api: GridApi) {
        var DBconfig = await this.grid.getDBconfig()
        DBconfig.filterModal = api.getFilterModel()
        this.grid.setDBconfig(DBconfig)
    }

    async setFolder(folderPath: string) {
        var DBconfig = await this.grid.getDBconfig()
        DBconfig.folder = folderPath
        this.grid.setDBconfig(DBconfig)
    }
    async setTemplate(filePath: string) {
        var DBconfig = await this.grid.getDBconfig()
        DBconfig.templatePath = filePath
        this.grid.setDBconfig(DBconfig)
    }

    async setPaginationSize(api: GridApi, size: number) {
        var DBconfig = await this.grid.getDBconfig()
        DBconfig.paginationSize = size
        this.grid.setDBconfig(DBconfig)
        api.paginationSetPageSize(size)
    }
}
