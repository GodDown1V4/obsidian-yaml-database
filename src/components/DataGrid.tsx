import { App, Menu, Point, TFile } from 'obsidian'
import React, { EffectCallback, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'
import t from '../i18n'
import {
  CellEditingStoppedEvent,
  ColDef,
  ColumnApi,
  ColumnMovedEvent,
  ColumnResizedEvent,
  DragStoppedEvent,
  FilterChangedEvent,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  ValueGetterParams,
  ValueSetterParams,
} from 'ag-grid-community'
import CustomHeader from './CustomHeader'
import { CtimeCellRender, ImgCellRender, InLinkCellRender, MtimeCellRender, TagCellRender, TextCellRender, TodoCellRender, UrlCellRender } from './CustomCellRender'
import { DataJson, dbconfig } from 'yaml/parse'
import { OperateMolda } from './OperateModal'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import YamlDatabasePlugin from 'main'
import { DateEditor, InlinkEditor, NumberEditor, MultiSelectEditor, TimeEditor, SelectEditor } from './CustomCellEditor'



interface Props {
  databaseID: string
  plugin: YamlDatabasePlugin
  paginationSize: number
}

interface State {
  columnDefs: ColDef[]
  rowData: Array<{ [key: string]: string }>
  isEditingHeaders: boolean
  displayOperateButton: boolean
}

interface DataGridTable {
  column: ColDef[]
  row: Array<{ [index: string]: string }>
}

// 自定义组件
export const components = {
  // 单元格渲染组件
  'CustomCellRenderer': TextCellRender,
  'TodoCellRender': TodoCellRender,
  'ImgCellRender': ImgCellRender,
  'TagCellRender': TagCellRender,
  'InLinkCellRender': InLinkCellRender,
  // 单元格编辑器组件
  'NumberEditor': NumberEditor,
  'DateEditor': DateEditor,
  'TimeEditor': TimeEditor,
  'InlinkEditor': InlinkEditor,
}

// 定义列类型
export const columnTypes = {
  'text': {
    cellRenderer: TextCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'number': {
    cellRenderer: TextCellRender,
    cellEditor: NumberEditor,
    filter: 'agNumberColumnFilter',
    editable: true,
  },
  'date': {
    cellRenderer: TextCellRender,
    cellEditor: DateEditor,
    filter: 'agDateColumnFilter',
    editable: true,
  },
  'time': {
    cellRenderer: TextCellRender,
    cellEditor: TimeEditor,
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'checkbox': {
    cellRenderer: TodoCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: false,
  },
  'img': {
    cellRenderer: ImgCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'url': {
    cellRenderer: UrlCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'tags': {
    cellRenderer: TagCellRender,
    cellEditor: MultiSelectEditor,
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'textarea': {
    cellRenderer: TextCellRender,
    cellEditor: 'agLargeTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'inLink': {
    cellRenderer: InLinkCellRender,
    cellEditor: InlinkEditor,
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'select': {
    cellRenderer: TextCellRender,
    cellEditor: SelectEditor,
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'multiSelect': {
    cellRenderer: TextCellRender,
    cellEditor: MultiSelectEditor,
    filter: 'agTextColumnFilter',
    editable: true,
  },
  'formula': {
    cellRenderer: TextCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: false,
  },
  'createdTime': {
    cellRenderer: CtimeCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: false,
  },
  'modifiedTime': {
    cellRenderer: MtimeCellRender,
    cellEditor: 'agTextCellEditor',
    filter: 'agTextColumnFilter',
    editable: false,
  },
}

// valueGetter 和 valueSetter
export const defaultValueGetter = function (params: ValueGetterParams) {
  const colId = params.column.getId()
  let currentValue = params.data[colId]
  while (/<br\/>/.test(currentValue)) {
    currentValue = currentValue.replace('<br/>', '\n')
  }
  return currentValue
}

export const defaultValueSetter = function (params: ValueSetterParams) {
  const colId = params.column.getId()
  let currentValue = params.data[colId]
  while (/\n/.test(currentValue)) {
    currentValue = currentValue.replace('\n', '<br/>')
  }
  return currentValue
}
// 不是直接给formula列的，需要先处理下
export const genFormulaValueGetter = function (columnDefs: ColDef[], codeStr: string) {
  var value = codeStr
  for (const col of columnDefs) {
    const newReg = new RegExp(`prop\\(${col.colId}\\)`)
    value = value.replace(newReg, `params.data.${col.colId}`)
  }
  if (value.indexOf('prop(') == -1) {
    return new Function('params', value)
  }
  else {
    return t("wrongFormula")
  }
}

// 表格
export default class DataGrid extends React.Component<Props, State, EffectCallback> {
  app: App
  plugin: YamlDatabasePlugin
  defaultColDef: { [key: string]: any }
  clickedRowIndex: string | null
  clickedColumn: string
  clickedColumnIndex: number | null
  isColumnDrag: boolean
  isColumnResize: number
  colimnApi: ColumnApi
  api: GridApi
  dataJson: DataJson
  isSearching: boolean
  selectedRows: Array<{ [key: string]: string }>

  constructor(props: Props) {
    // console.log("构建AGGrid");
    super(props)
    this.plugin = props.plugin
    this.app = props.plugin.app

    // 初始化state
    this.state = {
      columnDefs: [],
      rowData: [],
      isEditingHeaders: false,
      displayOperateButton: false,
    }

    //init temp variable
    this.clickedRowIndex = null
    this.clickedColumnIndex = null
    this.isColumnDrag = false
    this.isColumnResize = 0
    this.isSearching = false
    this.selectedRows = new Array()


    // 列的默认设置
    this.defaultColDef = {
      resizable: true,
      // flex: 1,
      editable: true,
      autoHeight: true,
      wrapText: true,
      sortable: true,
      filterParams: {
        buttons: ['reset', 'apply'],
        debounceMs: 200
      },
      headerComponentParams: {
        grid: this
      },
      valueGetter: defaultValueSetter,
      valueSetter: defaultValueSetter,
      // cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        app: this.plugin.app,
        columnDefs: this.state.columnDefs,
        rowData: this.state.rowData,
      },
      cellEditorPopup: true,
      // cellRenderer: CustomCellRenderer,
      cellRendererParams: {
        app: this.plugin.app,
      }

    }


    this.handleContextMenu = this.handleContextMenu.bind(this)  // 右键选单：暂不需要
    this.onCellEditingStopped = this.onCellEditingStopped.bind(this)  // 一个单元格停止编辑：修改文件名或者属性值 TODO
    this.onColumnMoved = this.onColumnMoved.bind(this)  // 列移动：重新调整prop:排序顺序
    this.onDragStopped = this.onDragStopped.bind(this)  // 拖动停止
    this.onGridReady = this.onGridReady.bind(this)  // 表格准备好
    this.onSelectionChanged = this.onSelectionChanged.bind(this)  // 更新选中行
    this.onSortChanged = this.onSortChanged.bind(this)  // 保存排序设置
    this.onFilterChanged = this.onFilterChanged.bind(this)  // 保存滤波器设置
    this.onColumnResized = this.onColumnResized.bind(this)  // 列宽大小调整

    this.newItemBtnOnClick = this.newItemBtnOnClick.bind(this)  // 新建项目按钮
    this.refreshBtnOnClick = this.refreshBtnOnClick.bind(this)  // 新建刷新按钮
    this.editColumnBtnOnClick = this.editColumnBtnOnClick.bind(this)
  }

  // state变化后执行的操作
  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: React.EffectCallback): void {
    // console.log('state更改并进入eseEffect');
    if (prevState.columnDefs !== this.state.columnDefs) {
      // 更新列
      const newColumns = this.state.columnDefs.map(el => {
        el.cellEditor = columnTypes[String(el.type)]["cellEditor"]
        el.cellRenderer = columnTypes[String(el.type)]["cellRenderer"]
        el.filter = columnTypes[String(el.type)]["filter"]
        el.editable = columnTypes[String(el.type)]["editable"]
        el.headerComponent = this.state.isEditingHeaders ? CustomHeader : ""
        if (el.type == "number") {
          el.comparator = function (valueA, valueB, nodeA, nodeB, isInverted) {
            return valueA - valueB
          }
        }
        else {
          el.comparator = function (valueA, valueB, nodeA, nodeB, isInverted) {
            if (valueA == valueB) return 0;
            return (valueA > valueB) ? 1 : -1;
          }
        }
        if (el.type == "formula" && this.state.columnDefs && el.cellEditorParams["values"]) {
          const getter = genFormulaValueGetter(this.state.columnDefs, el.cellEditorParams["values"])
          if (typeof (getter) == "string") {
            el.valueGetter = function () {
              return getter
            }
          }
          else {
            el.valueGetter = function (params: ValueGetterParams) {
              return String(getter(params))
            }
          }
        }
        else {
          el.valueGetter = defaultValueGetter
        }
        return el
      })
      this.api.setColumnDefs(newColumns)
      this.dataJson.saveColDef(this.api)
    }
  }

  pinTopUntitledRow() {
    // 对rows进行处理，将未命名的新建文档放在前面
    var newRows = new Array()
    this.api.forEachNode((row) => {
      const fileName = row.data["yamleditFirstFileColumn"].split("/").pop().replace(".md", '')
      const untitledReg = new RegExp(`${t("untitled")}_(1|2\\d{3}-(([1-9])|(1[0-2]))-(([1-9])|([1-2][0-9])|(3([0|1]))))(_(\\d{2}|\\d{1})-(\\d{2}|\\d{1})-(\\d{2}|\\d{1}))`)

      if (untitledReg.test(fileName)) {
        newRows.push(row.data)
      }
    })
    this.api.setPinnedTopRowData(newRows)
  }

  async getDBconfig() {
    return await this.plugin.getDBbyID(this.props.databaseID)
  }

  setDBconfig(yamlCodeblockJson: dbconfig) {
    this.plugin.saveDB2Settings(yamlCodeblockJson)
  }

  private isDarkMode(): boolean {
    return Array.from(document.body.classList).includes('theme-dark')
  }

  handleContextMenu(params: any) {
    // console.log(params.rowIndex)

    this.clickedRowIndex = params.rowIndex

    const path = params.data["yamleditFirstFileColumn"]

    const menu = new Menu(this.app)

    menu.addItem((item) => {
      item
        .setTitle(t('deleteThisRow'))
        .setIcon('trash')
        .onClick(async () => {
          if (this.app.vault["config"].hasOwnProperty("trashOption")) {
            switch (this.app.vault["config"]["trashOption"]) {
              case "system": await this.app.vault.trash(this.app.vault.getAbstractFileByPath(path), true); break;
              case "local": await this.app.vault.trash(this.app.vault.getAbstractFileByPath(path), false); break;
              default: await this.app.vault.trash(this.app.vault.getAbstractFileByPath(path), true); break;
            }
          }
          else {
            await this.app.vault.trash(this.app.vault.getAbstractFileByPath(path), true);
          }
          console.log(params);

          this.api.applyTransaction({
            remove: [params.data]
          })
          this.pinTopUntitledRow()
        })
    })
    menu.showAtPosition(params.event as Point)
  }

  async onCellEditingStopped(event: CellEditingStoppedEvent) {

    if (event.oldValue != event.newValue) {
      const rowIndex = event.rowIndex // 行索引
      // 不能使用行索引，必须使用event.data["yamleditFirstFileColumn"]
      // const filePath = event.data["yamleditFirstFileColumn"]
      const colKey = event.column.getColId()  // 修改的列ID

      // 获取当前选中行的文件路径
      var selectedRowFilePath: string[] = [event.data["yamleditFirstFileColumn"]]
      if (event.rowPinned != "top") { // 不是置顶行就有可能是多选
        selectedRowFilePath = this.selectedRows.map((row) => {
          return row["yamleditFirstFileColumn"]
        })
      }

      // 处理新赋值的内容中的换行符
      var newValue = String(event.newValue).replace(/\n/g, '<br/>')
      if (typeof (event.newValue) == "undefined") {
        newValue = String(event.oldValue).replace(/\n/g, '<br/>')
      }

      // 处理行数据，对所有选中行进行操作
      oneOperationYamlChangeHistory.length = 0

      selectedRowFilePath.map((filePath: string) => {

      })

      this.api.forEachNode((row) => {
        // 获取文档路径
        const thisRowPath = row.data["yamleditFirstFileColumn"]
        // 对所有选中行进行处理
        if (selectedRowFilePath.indexOf(thisRowPath) != -1) {
          // 文件重命名在cellEditor进行
          if (colKey == "yamleditFirstFileColumn") {
            if (selectedRowFilePath[0] == thisRowPath) {
              row.data[colKey] = newValue
            }
          }
          else {
            // 对所有选中行进行处理
            if (selectedRowFilePath.indexOf(thisRowPath) != -1) {
              row.data[colKey] = newValue
              // 文档重命名在自定义inLinkCellEditor中进行
              const md = new MDIO(this.app, thisRowPath)
              if (md.hasProperty(colKey)) {
                md.updateProperty(colKey, row.data[colKey])
              }
              else {
                md.addProperty(colKey, row.data[colKey])
              }
            }
          }
        }
      })
      allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
      this.api.refreshCells()

      localStorage.setItem('focusedRow', `${colKey},${rowIndex}`)
    }
    // 更新select中的候选项
    if (event.colDef.type == 'multiSelect' || event.colDef.type == 'select' || event.colDef.type == 'tags') {
      this.setState({ columnDefs: this.api.getColumnDefs() })
    }
    // 取消对改名后的未命名文件的置顶
    else if (event.colDef.colId == 'yamleditFirstFileColumn') {
      this.pinTopUntitledRow()
    }
  }

  onColumnMoved(event: ColumnMovedEvent) {
    if (event.column) {
      this.clickedColumn = event.column.getColId()
      this.clickedColumnIndex = event.toIndex
      this.isColumnDrag = true
    }
  }

  onDragStopped(event: DragStoppedEvent) {
    //console.log('dragStoped:', event)
    if (this.isColumnDrag) {
      this.dataJson.saveColDef(event.api)
      this.isColumnDrag = false
    }
  }

  async onGridReady(event: GridReadyEvent) {
    // console.log("GridReady");
    this.colimnApi = event.columnApi
    this.api = event.api
    this.dataJson = new DataJson(this)

    // 初始化行列
    // console.log("从JSON读取列, 从文件读取行");
    const column = await this.dataJson.getColumsFromDataJson()
    const row = await this.dataJson.getRowsFromDataFiles()
    this.setState({
      columnDefs: column,
      rowData: row
    })
    this.pinTopUntitledRow()
    // filter初始化
    this.dataJson.loadFliterModal(event.api)

  }

  onSelectionChanged(event: SelectionChangedEvent) {
    this.selectedRows = event.api.getSelectedRows()
  }

  onSortChanged(event: SortChangedEvent) {
    const newColumns = this.api.getColumnDefs().map((col: ColDef) => {
      return col
    })
    this.setState({
      columnDefs: newColumns
    })
    this.dataJson.saveColDef(event.api)
  }

  onFilterChanged(event: FilterChangedEvent) {
    if (!this.isSearching) {
      this.dataJson.saveFliterModal(event.api)
    }
  }

  onColumnResized(event: ColumnResizedEvent) {
    // console.log(event)
    if (this.isColumnResize == 0) {
      var isResizing = setInterval(() => {
        if (this.isColumnResize > 1) {
          // 500ms内若this.isColumnResize>0说明还在调整size
          // 再次重新计数event
          this.isColumnResize = 1
        }
        else {
          this.dataJson.saveColDef(event.api)
          this.isColumnResize = 0
          clearInterval(isResizing)
        }
      }, 500)
    }
    this.isColumnResize++
  }

  async newItemBtnOnClick() {
    // 获取配置信息
    const DBconfig = await this.getDBconfig()
    // 获取文件新建路径
    var myDate = new Date();
    const newFilePath = `${DBconfig.folder}/${t("untitled")}_${myDate.getFullYear()}-${myDate.getMonth()}-${myDate.getDay()}_${myDate.getHours()}-${myDate.getMinutes()}-${myDate.getSeconds()}.md`
    // 为下面添加新行做准备，若有模板，则会读取模板的值覆盖当前信息
    var arow = this.api.getColumnDefs().map((col: ColDef) => {
      if (col.field == "yamleditFirstFileColumn") {
        return { [col.field]: newFilePath }
      } else {
        return { [col.field]: "" }
      }
    })
    // 尝试获取模板文件
    const tabstractFile = this.app.vault.getAbstractFileByPath(DBconfig.templatePath)
    var content = ""
    if (tabstractFile) {
      if (tabstractFile.hasOwnProperty("extension")) {
        if (tabstractFile["extension"] == "md") {
          // 读取文件
          if (tabstractFile instanceof TFile) {
            // 获取模板内容
            var md = new MDIO(this.app, tabstractFile.path)
            content = await md.read()
            // 获取当前文件的yaml以便为下面添加行使用
            arow = this.api.getColumnDefs().map((col: ColDef) => {
              if (col.field == "yamleditFirstFileColumn") {
                return { [col.field]: newFilePath }
              } else {
                return { [col.field]: md.getPropertyValue(col.field) }
              }
            })
          }
        }
      }
    }
    await this.app.vault.create(newFilePath, content)
    this.api.applyTransaction({
      add: [Object.assign({}, ...arow)]
    })
    this.pinTopUntitledRow()
    // this.app.metadataCache.getFileCache(createdFile)
  }

  editColumnBtnOnClick() {
    var bool = this.state.isEditingHeaders ? false : true
    this.setState({ isEditingHeaders: bool })

    const newColumns = this.api.getColumnDefs().map((col: ColDef) => {
      col.headerComponent = bool ? CustomHeader : ""
      return col
    })
    this.setState({
      columnDefs: newColumns
    })
    // this.api.setColumnDefs(newColumns)
    if (!bool) {
      this.dataJson.saveColDef(this.api)
    }
  }

  async refreshBtnOnClick() {
    const block = new DataJson(this)
    this.setState({
      columnDefs: await block.getColumsFromDataJson(),
      rowData: await block.getRowsFromDataFiles()
    })
    this.pinTopUntitledRow()
  }



  render() {
    return (
      <div
        id="table-body"
        className={
          this.isDarkMode() ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
        }
        style={{ height: '100%', width: '100%' }}
      >
        <div
          onMouseEnter={() => this.setState({ displayOperateButton: true })}
          onMouseLeave={() => this.setState({ displayOperateButton: false })}
          style={{ margin: "10px 0" }}
        >
          <button
            style={{ "backgroundColor": '#0099FF', "color": "white" }}
            onClick={this.newItemBtnOnClick}
          >
            {t("createNewFile")}
          </button>

          <input
            type="text"
            className='filterInput'
            placeholder={t("searchInput")}
            onInput={(event) => {
              this.isSearching = true
              this.api.setQuickFilter(event.target["value"]);
            }}
            onBlur={(event) => {
              if (!event.target.value) {
                this.isSearching = false
              }
            }}
          />

          <button
            style={{
              "display": this.state.displayOperateButton || this.state.isEditingHeaders ? "inline" : "none",
              "backgroundColor": this.state.isEditingHeaders ? "#CC3333" : "",
              "color": this.state.isEditingHeaders ? "white" : "",
            }}
            onClick={this.editColumnBtnOnClick}
          >
            {this.state.isEditingHeaders ? t("applyTheChanges") : t("editColumns")}
          </button>

          <button
            style={{ "display": this.state.displayOperateButton && !this.state.isEditingHeaders ? "inline" : "none" }}
            onClick={() => { new OperateMolda(this).open() }}
          >
            {t("tableSettings")}
          </button>

          <button
            style={{ "display": this.state.displayOperateButton && !this.state.isEditingHeaders ? "inline" : "none" }}
            onClick={this.refreshBtnOnClick}
          >
            {t("refresh")}
          </button>
        </div>
        <AgGridReact
          defaultColDef={this.defaultColDef}
          columnTypes={columnTypes}
          components={components}
          rowData={this.state.rowData}
          columnDefs={this.state.columnDefs}
          // rowDragManaged={true}
          animateRows={true}
          //rowDragEntireRow={true}
          suppressContextMenu={true}
          preventDefaultOnContextMenu={true}
          onCellContextMenu={this.handleContextMenu}
          onCellEditingStopped={this.onCellEditingStopped}
          stopEditingWhenCellsLoseFocus={true}
          // onRowDragEnd={this.onRowDragEnd}
          onColumnMoved={this.onColumnMoved}
          onDragStopped={this.onDragStopped}
          onGridReady={this.onGridReady}
          pagination={true}
          paginationPageSize={this.props.paginationSize}
          rowSelection='multiple' // 多选
          multiSortKey='ctrl' // 多行排序
          onSelectionChanged={this.onSelectionChanged}
          onSortChanged={this.onSortChanged}
          onFilterChanged={this.onFilterChanged}
          onColumnResized={this.onColumnResized}
        ></AgGridReact>
      </div>
    )
  }
}
