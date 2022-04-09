import { App, Menu, Point } from 'obsidian'
import React from 'react'
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
import CustomCellRenderer from './CustomCellRender'
import { Codeblock, yamlCodeblockJson } from 'yaml/parse'
import { OperateMolda } from './OperateModal'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'

interface Props {
  app: App
  tableId: string
  tableString: string
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

export default class DataGrid extends React.Component<Props, State> {
  app: App
  defaultColDef: { [key: string]: any }
  clickedRowIndex: string | null
  clickedColumn: string
  clickedColumnIndex: number | null
  isColumnDrag: boolean
  isColumnResize: number
  colimnApi: ColumnApi
  api: GridApi
  codeblock: Codeblock
  isSearching: boolean
  selectedRows: Array<{ [key: string]: string }>


  constructor(props: Props) {
    super(props)
    // console.log("构建AGGrid");

    this.app = props.app

    this.codeblock = new Codeblock(this.app, props.tableString)
    // console.log("Grid新建Codeblock");

    const column = this.codeblock.getColumsFromFiles()
    const row = this.codeblock.getRowsFromFiles()

    //init temp variable
    this.clickedRowIndex = null
    this.clickedColumnIndex = null
    this.isColumnDrag = false
    this.isColumnResize = 0
    this.isSearching = false
    this.selectedRows = new Array()

    // 将列、行数据传入state
    this.state = {
      columnDefs: column,
      rowData: row,
      isEditingHeaders: false,
      displayOperateButton: false
    }
    // 列的默认设置
    this.defaultColDef = {
      resizable: true,
      // flex: 1,
      editable: true,
      autoHeight: true,
      wrapText: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        debounceMs: 200
      },
      headerComponentParams: {
        app: props.app,
        tableId: props.tableId,
        tableString: props.tableString,
      },
      valueGetter: (params: ValueGetterParams) => {
        const colId = params.column.getId()
        let currentValue = params.data[colId]
        while (/<br\/>/.test(currentValue)) {
          currentValue = currentValue.replace('<br/>', '\n')
        }
        return currentValue
      },
      valueSetter: (params: ValueSetterParams) => {
        const colId = params.column.getId()
        let currentValue = params.data[colId]
        while (/\n/.test(currentValue)) {
          currentValue = currentValue.replace('<br/>', '\n')
        }
        return currentValue
      },
      // cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        app: props.app,
        columnDefs: this.state.columnDefs,
        rowData: this.state.rowData,
      },
      cellEditorPopup: true,
      cellRenderer: CustomCellRenderer,
      cellRendererParams: {
        app: props.app,
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
  }

  private isDarkMode(): boolean {
    return Array.from(document.body.classList).includes('theme-dark')
  }

  handleContextMenu(params: any) {
    // console.log(params.rowIndex)

    this.clickedRowIndex = params.rowIndex

    const thisRow = this.api.getRowNode(params.rowIndex)

    const menu = new Menu(this.app)

    menu.addItem((item) => {
      item
        .setTitle(t('deleteThisRow'))
        .setIcon('trash')
        .onClick(async () => {
          if (this.app.vault["config"].hasOwnProperty("trashOption")) {
            switch (this.app.vault["config"]["trashOption"]) {
              case "system": await this.app.vault.trash(this.app.vault.getAbstractFileByPath(thisRow.data["yamleditFirstFileColumn"]), true); break;
              case "local": await this.app.vault.trash(this.app.vault.getAbstractFileByPath(thisRow.data["yamleditFirstFileColumn"]), false); break;
              default: await this.app.vault.trash(this.app.vault.getAbstractFileByPath(thisRow.data["yamleditFirstFileColumn"]), true); break;
            }
          }
          else {
            await this.app.vault.trash(this.app.vault.getAbstractFileByPath(thisRow.data["yamleditFirstFileColumn"]), true);
          }
          const row = this.codeblock.getRowsFromFiles()
          this.setState({
            rowData: row
          })
          this.api.refreshCells()
        })
    })
    menu.showAtPosition(params.event as Point)
  }

  onCellEditingStopped(event: CellEditingStoppedEvent) {
    if (event.oldValue != event.newValue) {

      const rowIndex = event.rowIndex // 行索引
      const colKey = event.column.getColId()  // 修改的列ID

      // 获取当前选中行的文件路径
      const selectedRowFilePath = this.selectedRows.map((row) => {
        return row["yamleditFirstFileColumn"]
      })

      // 处理新赋值的内容中的换行符
      var newValue = String(event.newValue).replace(/\n/g, '<br/>')
      if (typeof (event.newValue) == "undefined") {
        newValue = String(event.oldValue).replace(/\n/g, '<br/>')
      }

      var newRow = new Array()

      // 处理行数据，对所有选中行进行操作
      oneOperationYamlChangeHistory.length = 0
      this.api.forEachNode((row) => {
        // 文件重命名不支持批量操作
        if (colKey == "yamleditFirstFileColumn") {
          if (row.rowIndex == rowIndex) {
            row.data[colKey] = newValue
          }
        }
        // 属性赋值支持批量操作
        else {
          // 获取文档路径
          const thisRowPath = row.data["yamleditFirstFileColumn"]
          // 对所有选中行进行处理
          if (selectedRowFilePath.indexOf(thisRowPath) != -1) {
            row.data[colKey] = newValue
            // 文档重命名在自定义inLinkCellEditor中进行
            const md = new MDIO(this.app, thisRowPath)
            if (md.hasProperty(colKey)) {
              md.tableUpdateProperty(colKey, row.data[colKey])
            }
            else {
              md.addProperty(colKey, row.data[colKey])
            }
          }
        }

        newRow.push(row.data)
      })
      allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
      // 刷新row
      this.setState({ rowData: newRow })
      this.api.refreshCells({
        columns: [colKey]
      })


      localStorage.setItem('focusedRow', `${colKey},${rowIndex}`)
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
      this.codeblock.saveColDef(event.api)
      this.isColumnDrag = false
    }
  }

  onGridReady(event: GridReadyEvent) {
    // console.log("GridReady");

    const focusedRow = localStorage.getItem('focusedRow')
    if (!focusedRow) {
      return
    }
    const colKey = focusedRow.split(',')[0]
    const rowIndex = parseInt(focusedRow.split(',')[1])
    event.api.setFocusedCell(rowIndex, colKey)
    this.colimnApi = event.columnApi
    this.api = event.api

    // filter初始化
    this.codeblock.loadFliterModal(event.api)

  }

  onSelectionChanged(event: SelectionChangedEvent) {
    this.selectedRows = event.api.getSelectedRows()
  }

  onSortChanged(event: SortChangedEvent) {
    this.codeblock.saveColDef(event.api)
  }

  onFilterChanged(event: FilterChangedEvent) {
    if (!this.isSearching) {
      this.codeblock.saveFliterModal(event.api)
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
          this.codeblock.saveColDef(event.api)
          this.isColumnResize = 0
          clearInterval(isResizing)
        }
      }, 500)
    }
    this.isColumnResize++
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
          onMouseEnter={() => {
            this.setState({ displayOperateButton: true })
          }}
          onMouseLeave={() => {
            this.setState({ displayOperateButton: false })
          }}
          style={{ margin: "10px 0" }}
        >
          <button
            style={{ "backgroundColor": '#0099FF', "color": "white" }}
            onClick={async () => {
              const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.props.tableString)
              var myDate = new Date();
              const tabstractFile = this.app.vault.getAbstractFileByPath(yamlCodeblockJson.templatePath)
              var content = ""
              if (tabstractFile) {
                if (tabstractFile.hasOwnProperty("extension")) {
                  if (tabstractFile["extension"] == "md") {
                    // 直接复制
                    for (var file of this.app.vault.getMarkdownFiles()) {
                      if (file.path == yamlCodeblockJson.templatePath) {
                        content = await this.app.vault.read(file)
                      }
                    }
                  }
                }
              }
              this.app.vault.create(`${yamlCodeblockJson.folder}/${t("untitled")}_${myDate.getFullYear()}-${myDate.getMonth()}-${myDate.getDay()}_${myDate.getHours()}-${myDate.getMinutes()}-${myDate.getSeconds()}.md`, content)
              setTimeout(() => {
                const column = this.codeblock.getColumsFromFiles()
                const row = this.codeblock.getRowsFromFiles()
                this.setState({
                  columnDefs: column,
                  rowData: row
                })
                this.api.refreshCells()
              }, 100);
            }}
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
            onClick={() => {
              var bool = this.state.isEditingHeaders ? false : true
              this.setState({ isEditingHeaders: bool })

              const newColumns = this.api.getColumnDefs().map((col: ColDef) => {
                col.headerComponent = bool ? CustomHeader : ""
                return col
              })
              this.api.setColumnDefs(newColumns)
              if (!bool) {
                this.codeblock.saveColDef(this.api)
              }
            }}
          >
            {this.state.isEditingHeaders ? t("applyTheChanges") : t("editColumns")}
          </button>
          <button
            style={{ "display": this.state.displayOperateButton ? "inline" : "none" }}
            onClick={() => {
              new OperateMolda(this.props.app, this.api, this.props.tableString).open()
            }}
          >
            {t("tableSettings")}
          </button>
          <button
            style={{ "display": this.state.displayOperateButton ? "inline" : "none" }}
            onClick={() => {
              const column = this.codeblock.getColumsFromFiles()
              const row = this.codeblock.getRowsFromFiles()
              this.setState({
                columnDefs: column,
                rowData: row
              })
              this.api.refreshCells()
            }}
          >
            {t("refresh")}
          </button>
        </div>
        <AgGridReact
          defaultColDef={this.defaultColDef}
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
          paginationPageSize={JSON.parse(this.props.tableString).paginationSize}
          rowSelection='multiple' // 多选，但是目前不会用
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
