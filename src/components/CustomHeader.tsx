import React from 'react'
import { ColDef, IHeaderParams } from 'ag-grid-community'
import { App, Menu, Notice, Point } from 'obsidian'
import t from 'i18n'
import { yamlCodeblockJson, admittedTypeCellEditor, admittedTypeCellRender, Codeblock } from 'yaml/parse'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from 'yaml/md'
import { EditPropertyMolda } from './OperateModal'


// 允许的属性类型，若不满足则设为默认类型text
export const admittedType = [
  "text",
  "number",
  "date",
  "time",
  "checkbox",
  "img",
  "tags",
  "textarea",
  "inLink",
  "select",
]

const admittedTypeFilter = {
  "text": "",
  "number": "agNumberColumnFilter",
  "date": "agDateColumnFilter",
  "time": "",
  "checkbox": "",
  "img": "",
  "tags": "",
  "textarea": "",
  "inLink": "",
  "select": "",
}

interface Props extends IHeaderParams {
  app: App
  tableId: string
  tableString: string
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
    const menu = new Menu(this.props.app)

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
            new EditPropertyMolda(this.props.app, this.props.api, this.props.tableString, thisColumn).open()
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
    const newColumns = column.map((el: ColDef, index) => {
      if (el.colId == thisColumn) {
        el.hide = true
        index1 = index
        return el
      }
      else if (el.field == propName) {
        el.hide = false
        index2 = index
        return el
      }
      else {
        return el
      }
    })
    // 交换
    newColumns.splice(index2, 1, ...newColumns.splice(index1, 1, newColumns[index2]))
    this.props.api.setColumnDefs(newColumns)
  }

  addColumn(propName: string) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()
    var hideColumns = new Array()
    column.map((col: ColDef) => {
      if (col.hide) {
        hideColumns.push(col.colId)
      }
    })

    // 判断是添加已有的属性还是新的属性
    if (hideColumns.indexOf(propName) == -1) {  // 添加新的属性
      const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.props.tableString)

      oneOperationYamlChangeHistory.length = 0
      new Search(this.props.app).getTAbstractFilesOfAFolder(yamlCodeblockJson.folder).map((file) => {
        new MDIO(this.props.app, file.path).addProperty(propName)
      })
      allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
      // 由于修改了文档的yaml属性，所以这里会直接保存，会导致表格重新渲染
      setTimeout(() => {
        new Codeblock(this.props.app, this.props.tableString).saveColDef(this.props.api)
      }, 100)
    }
    else {  // 切换隐藏的属性为显示
      column.sort((a: ColDef, b: ColDef) => Number(a.hide) - Number(b.hide))  // 排序，hide从false到true
      // 赋值col
      var index1 = 0
      var index2 = 0
      const newColumns = column.map((el: ColDef, index) => {
        if (el.field == thisColumn) {
          index1 = index
          return el
        }
        else if (el.field == propName) {
          el.hide = false
          index2 = index
          return el
        }
        else {
          return el
        }
      })

      newColumns.splice(index1 + 1, 1, ...newColumns.splice(index2, 1, newColumns[index1 + 1]))
      this.props.api.setColumnDefs(newColumns)
    }
  }

  HideColumn() {
    const thisColumn = this.props.column.getColId()
    const columns = this.props.api.getColumnDefs()

    const newColums = columns.map((col: ColDef) => {
      if (col.colId == thisColumn) {
        col.hide = true
      }
      return col
    })
    this.props.api.setColumnDefs(newColums)
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
  }

  renamePropName(event: React.ChangeEvent<HTMLInputElement>) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()

    const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.props.tableString)
    oneOperationYamlChangeHistory.length = 0
    new Search(this.props.app).getTAbstractFilesOfAFolder(yamlCodeblockJson.folder).map((file) => {
      new MDIO(this.props.app, file.path).updatePropertyName(thisColumn, event.target.value)
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
      new Codeblock(this.props.app, this.props.tableString).saveColDef(this.props.api)
    }, 100)
  }

  changePropType(event: React.ChangeEvent<HTMLSelectElement>) {
    const thisColumn = this.props.column.getColId()
    const column = this.props.api.getColumnDefs()

    // 赋值col
    const newColumns = column.map((el: ColDef, index) => {
      if (el.colId == thisColumn) {
        el.type = event.target.value
        el.cellEditor = admittedTypeCellEditor[String(el.type)]
        el.cellRenderer = admittedTypeCellRender[String(el.type)]
        el.editable = (el.type == "checkbox") ? false : true
      }
      return el
    })
    this.props.api.setColumnDefs(newColumns)
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
          onInput={(event) => {
            if (event.target["value"] != thisColumn) {
              const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.props.tableString)
              if (new Search(this.props.app).getYamlPropertiesNameOfAFolder(yamlCodeblockJson.folder).indexOf(event.target["value"]) != -1) {
                new Notice(t("repeatedName"))
              }
            }
          }}
          onBlur={(event) => {
            this.setState({ isRenamingPropName: false })
            if (event.target.value != thisColumn) {
              const yamlCodeblockJson: yamlCodeblockJson = JSON.parse(this.props.tableString)
              const isRepeated = new Search(this.props.app).getYamlPropertiesNameOfAFolder(yamlCodeblockJson.folder).indexOf(event.target["value"]) == -1 ? false : true
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
