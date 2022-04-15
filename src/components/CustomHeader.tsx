import React from 'react'
import { ColDef, IHeaderParams } from 'ag-grid-community'
import { apiVersion, App, Menu, Notice, Point } from 'obsidian'
import t from 'i18n'
import { DataJson } from 'yaml/parse'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import { EditPropertyMolda } from './OperateModal'
import DataGrid from './DataGrid'

interface Props extends IHeaderParams {
  grid: DataGrid
}

interface State {
  isRenamingHeaderName: boolean
  isRenamingPropName: boolean
  isSelectingPropName: boolean
  isAddingPropName: boolean
}

interface RowData {
  [key: string]: string
}

export default class CustomHeader extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)

    this.state = {
      isRenamingHeaderName: false,
      isRenamingPropName: false,
      isSelectingPropName: false,
      isAddingPropName: false,
    }


    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.addColumn = this.addColumn.bind(this)    // 添加列
    this.HideColumn = this.HideColumn.bind(this)  // 删除列
  }

  handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {

    event.preventDefault()
    const thisColumn = this.props.column.getColId()
    const menu = new Menu(this.props.grid.app)

    // renameDisplayName
    menu.addItem((item) =>
      item
        .setTitle(t('renameDisplayName'))
        .setIcon('pencil')
        .onClick(() => {
          this.setState({ isRenamingHeaderName: true })
        })
    )
    menu.addSeparator()
    if (thisColumn != "yamleditFirstFileColumn") {
      // 选择yaml属性
      menu.addItem((item) =>
        item
          .setTitle(t('selectYamlProperty'))
          .setIcon('switch')
          .onClick(() => {
            this.setState({ isSelectingPropName: true })
          })
      )
      // editProperty
      menu.addItem((item) =>
        item
          .setTitle(t('editProperty'))
          .setIcon('vertical-three-dots')
          .onClick(() => {
            const thisColumn = this.props.column.getColId()
            new EditPropertyMolda(this.props.grid, thisColumn).open()
          })
      )
      // renamePropName
      menu.addItem((item) =>
        item
          .setTitle(t('renamePropName'))
          .setIcon('pencil')
          .onClick(() => {
            this.setState({ isRenamingPropName: true })
          })
      )
      menu.addSeparator()
      // hideInView
      menu.addItem((item) => {
        item
          .setTitle(t('hideInView'))
          .setIcon('minus-with-circle')
          .onClick(() => {
            this.HideColumn()
          })
      })
    }
    // 右侧添加新列
    menu.addItem((item) =>
      item
        .setTitle(t('addNewColumn'))
        .setIcon('plus-with-circle')
        .onClick(() => {
          this.setState({ isAddingPropName: true })
        })
    )

    const x = event.clientX
    const y = event.clientY
    menu.showAtPosition({ x, y } as Point)
  }


  // 列操作部分
  changeProperty(propName: string) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()

    // 赋值col
    var index1 = 0
    var index2 = 0
    column.map((el: ColDef, index) => {
      if (el.colId == thisColumn) {
        index1 = index
      }
      else if (el.field == propName) {
        index2 = index
      }
    })
    // 交换
    this.props.columnApi.setColumnVisible(propName, true)
    this.props.columnApi.moveColumn(propName, index1)
    this.props.columnApi.setColumnVisible(thisColumn, false)
    this.props.columnApi.moveColumn(thisColumn, index2)
  }

  async addColumn(propName: string) {
    const thisColumn = this.props.column.getColId()
    var column = this.props.api.getColumnDefs()
    var showColumns = new Array()
    var hideColumns = new Array()
    // 获取索引、显示及隐藏的列
    var index1 = 0
    column.map((col: ColDef, index) => {
      if (col.field == thisColumn) {
        index1 = index
      }
      if (col.hide) {
        hideColumns.push(col.colId)
      }
      else {
        showColumns.push(col.colId)
      }
    })
    // 如果添加的不是当前已经显示的列都可以添加
    if (showColumns.indexOf(propName) == -1) {
      // 判断是添加已有的属性还是新的属性
      if (hideColumns.indexOf(propName) == -1) {  // 添加新的属性
        oneOperationYamlChangeHistory.length = 0
        const DBconfig = await this.props.grid.getDBconfig()
        new Search(this.props.grid.app).getTAbstractFilesOfAFolder(DBconfig.folder).map(async (file) => {
          await new MDIO(this.props.grid.app, file.path).addProperty(propName)
        })
        allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))

        var newCols = this.props.api.getColumnDefs()
        newCols.push({
          colId: propName,
          field: propName,
          headerName: propName,
          type: "text",
        })
        this.props.api.setColumnDefs(newCols)
        // this.props.columnApi.addValueColumn(propName)
      }
      else {
        this.props.columnApi.setColumnVisible(propName, true)
      }
      this.props.columnApi.moveColumn(propName, index1 + 1)
    }
  }

  HideColumn() {
    const thisColumn = this.props.column.getColId()
    this.props.columnApi.setColumnVisible(thisColumn, false)
  }

  renameHeaderName(event: React.ChangeEvent<HTMLInputElement>) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()

    // 赋值col
    const newColumns = column.map((el: ColDef, index) => {
      if (el.colId == thisColumn) {
        el.headerName = event.target.value
      }
      return el
    })

    this.props.api.setColumnDefs(newColumns)
    // this.props.api.refreshHeader()
  }

  async renamePropName(event: React.ChangeEvent<HTMLInputElement>) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()
    oneOperationYamlChangeHistory.length = 0
    const DBconfig = await this.props.grid.getDBconfig()
    new Search(this.props.grid.app).getTAbstractFilesOfAFolder(DBconfig.folder).map(async (file) => {
      await new MDIO(this.props.grid.app, file.path).updatePropertyName(thisColumn, event.target.value)
    })
    allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))

    // 赋值col
    const newColumns = column.map((el: ColDef, index) => {
      if (el.colId == thisColumn) {
        el.colId = event.target.value
        el.field = event.target.value
        el.headerName = event.target.value
      }
      return el
    })

    // 处理row
    var newRowData: Array<any> = new Array()
    this.props.api.forEachNode((row) => {
      row.data[event.target.value] = row.data[thisColumn]
      delete row.data[thisColumn]
      newRowData.push(row.data)
    })

    this.props.api.setColumnDefs(newColumns)
    this.props.api.setRowData(newRowData)
    // 由于修改了文档的yaml属性，所以这里会直接保存，会导致表格重新渲染
    setTimeout(() => {
      new DataJson(this.props.grid).saveColDef(this.props.api)
    }, 100)
  }


  render() {
    var label = <>{this.props.displayName}</>

    if (this.state.isRenamingHeaderName) {
      const thisColumn = this.props.column.getColId()
      const column = this.props.api.getColumnDefs()
      var displayName = ""
      column.map((col: ColDef) => {
        if (col.colId == thisColumn) {
          displayName = col.headerName
        }
      })
      label = (
        <input
          autoFocus={true}
          type="text"
          style={{ height: '100%', width: '100%' }}
          defaultValue={displayName}
          placeholder={t("plsInput")}
          onBlur={(event) => {
            this.setState({ isRenamingHeaderName: false })
            if (event.target.value != displayName && event.target.value.trim()) {
              this.renameHeaderName(event)
            }
          }}
          onKeyDown={(event) => {
            if (event.key == "Enter") {
              event.currentTarget.blur()
            }
          }}
          width={200}
        />
      )
    }
    else if (this.state.isRenamingPropName) {
      const thisColumn = this.props.column.getColId()
      const column = this.props.api.getColumnDefs()
      label = (
        <input
          autoFocus={true}
          type="text"
          style={{ height: '100%', width: '100%' }}
          defaultValue={thisColumn}
          placeholder={t("plsInput")}
          onInput={async (event) => {
            if (event.target["value"] != thisColumn) {
              const DBconfig = await this.props.grid.getDBconfig()
              if (new Search(this.props.grid.app).getYamlPropertiesNameOfAFolder(DBconfig.folder).indexOf(event.target["value"]) != -1) {
                new Notice(t("repeatedName"))
              }
            }
          }}
          onBlur={async (event) => {
            this.setState({ isRenamingPropName: false })
            if (event.target.value != thisColumn) {
              const DBconfig = await this.props.grid.getDBconfig()
              const isRepeated = new Search(this.props.grid.app).getYamlPropertiesNameOfAFolder(DBconfig.folder).indexOf(event.target["value"]) == -1 ? false : true
              if (event.target.value != thisColumn && event.target.value.trim() && !isRepeated) {
                this.renamePropName(event)
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key == "Enter") {
              event.currentTarget.blur()
            }
          }}
          width={200}
        />
      )
    }
    else if (this.state.isSelectingPropName) {
      const thisColumn = this.props.column.getColId()
      const columns = this.props.api.getColumnDefs()

      label = (
        <select
          className='dropdown'
          autoFocus={true}
          onBlur={() => {
            this.setState({ isSelectingPropName: false })
          }}
          onChange={(event) => {
            if (event.target.value != thisColumn) {
              this.changeProperty(event.target.value)
              this.setState({ isSelectingPropName: false })
            }
          }}
        >
          {columns.map((col: ColDef) => {
            if (col.hide) {
              return (<option value={col.field} key={col.field}>{col.field}</option>)
            }
            else if (col.colId == thisColumn) {
              return (<option value={col.field} key={col.field} selected={true}>{col.field}</option>)
            }

          })}
        </select>
      )
    }
    else if (this.state.isAddingPropName) {
      const thisColumn = this.props.column.getColId()
      const columns = this.props.api.getColumnDefs()

      // 已经显示的列就不能在添加了
      var showColumns = new Array()
      columns.map((col: ColDef) => {
        if (!col.hide) {
          showColumns.push(col.colId)
        }
      })

      label = (
        <>
          <input
            autoFocus={true}
            type="text"
            list='addYamlProperty'
            style={{ height: '100%', width: '100%' }}
            placeholder={t("plsInput")}
            onBlur={(event) => {
              this.setState({ isAddingPropName: false })
              if (showColumns.indexOf(event.target.value) == -1 && event.target.value.trim()) {
                this.addColumn(event.target.value)
              }
            }}
            onKeyDown={(event) => {
              if (event.key == "Enter") {
                event.currentTarget.blur()
              }
            }}
            width={200}
          />
          <datalist
            id="addYamlProperty"
          >
            {
              columns.map((col: ColDef) => {
                if (col.hide) {
                  return (<option value={col.field} key={col.field}>{col.field}</option>)
                }
              })
            }
          </datalist>
        </>
      )
    }

    return (
      <div
        className="custom-header-label"
        onContextMenu={this.handleContextMenu}
      // onDoubleClick={() => {
      //   this.setState({ isRenamingHeaderName: true })
      // }}
      >
        {label}
      </div>
    )
  }
}
