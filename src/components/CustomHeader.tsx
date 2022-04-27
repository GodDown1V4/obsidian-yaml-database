import React from 'react'
import { ColDef, IHeaderParams } from 'ag-grid-community'
import { Menu, Notice, Point } from 'obsidian'
import t from 'i18n'
import { DataJson } from 'yaml/parse'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import { EditPropertyMoldal, PropControlModal } from './OperateModal'
import DataGrid from './DataGrid'

interface Props extends IHeaderParams {
  grid: DataGrid
}

interface State {
  isRenamingHeaderName: boolean
  isRenamingPropName: boolean
  isSelectingPropName: boolean
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
    }

    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.addColumn = this.addColumn.bind(this)    // 添加列
    this.HideColumn = this.HideColumn.bind(this)  // 删除列
  }

  handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {

    event.preventDefault()
    const thisColumn = this.props.column.getColId()
    const menu = new Menu(this.props.grid.app)
    if (thisColumn == "yamleditLastAddColumn" || thisColumn == "yamleditPropControlColumn") return;
    // renameDisplayName
    menu.addItem((item) =>
      item
        .setTitle(t('renameDisplayName'))
        .setIcon('pencil')
        .onClick(() => {
          this.setState({ isRenamingHeaderName: true })
        })
    )
    if (thisColumn != "yamleditFirstFileColumn") {
      menu.addSeparator()
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
            new EditPropertyMoldal(this.props.grid, thisColumn).open()
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

  addColumn() {
    const newCols = this.props.api.getColumnDefs()
    newCols.push({
      field: "Property",
      headerComponent: CustomHeader,
      type: "text",
    })
    this.props.api.setColumnDefs(newCols)
    // this.props.api.getColumnDefs().map((col: ColDef, index: number) => {
    //   if (index == newCols.length - 1) this.props.columnApi.moveColumn(col.colId, newCols.length - 2)
    // })
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
    new Search(this.props.grid.app).getTFilesOfAFolder(DBconfig.folder).map(async (file) => {
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
    return (
      <div
        className="custom-header-label"
        onContextMenu={this.handleContextMenu}
        onClick={() => {
          // 判断是否点击了添加列
          if (this.props.column.getColId() == "yamleditLastAddColumn") {
            this.addColumn()
          }
          else if (this.props.column.getColId() == "yamleditPropControlColumn") {
            new PropControlModal(this.props.grid).open()
          }
        }}
      // onDoubleClick={() => {
      //   this.setState({ isRenamingHeaderName: true })
      // }}
      >
        {label}
      </div>
    )
  }
}
