import { ICellRendererParams } from 'ag-grid-community'
import React, { Component, createRef } from 'react'
import { App, MarkdownRenderer, TFile } from 'obsidian'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory } from 'yaml/md'
import { linkSync } from 'fs'
import t from 'i18n'
import { unescape } from 'querystring'

interface Props extends ICellRendererParams {
  app: App
}

// export class textCellRenderer extends Component<Props> {
//   private cellValue: string
//   cellRef: React.RefObject<HTMLSpanElement>
//   constructor(props: Props) {
//     super(props)
//     this.cellRef = createRef()
//     this.cellValue = this.props.value.trim()
//   }

//   async componentDidMount() {
//     await MarkdownRenderer.renderMarkdown(
//       this.cellValue,
//       this.cellRef.current,
//       '',
//       null
//     )
//   }

//   render() {
//     return <span ref={this.cellRef}></span>
//   }
// }
export class TextCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: TextCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: TextCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    var cellValue = this.state.cellValue
    if (typeof (cellValue) == "undefined") {
      cellValue = ""
    }
    return (
      <>
        {cellValue.split("\n").map((line: string) => {
          return <p>{line}</p>
        })}
      </>
    )
  }
}

interface State {
  cellValue: any
}

export class TodoCellRender extends Component<Props, State> {
  private cellValue: string

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: this.props.value == "true" ? true : false,
    }
  }

  render() {

    return (
      <p>
        <input
          type="checkbox"
          checked={this.state.cellValue}
          onChange={() => {
            const thisColumn = this.props.column.getColId()
            const data = this.props.data
            this.setState({ cellValue: (this.state.cellValue ? false : true) })
            var md = new MDIO(this.props.app, data["yamleditFirstFileColumn"])

            oneOperationYamlChangeHistory.length = 0
            // 有该属性则修改值
            if (md.hasProperty(thisColumn)) {
              md.updateProperty(thisColumn, String(!this.state.cellValue))
            }
            // 没有该属性则新建该属性并赋值
            else {
              md.addProperty(thisColumn, String(!this.state.cellValue))
            }
            allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
          }}
        >

        </input>
      </p>
    )
  }
}

export class ImgCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: ImgCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: ImgCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    var value: string = decodeURI(this.state.cellValue)
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      // 说明是本地图片
      // 获取当前库在设备中的路径
      const basePath = 'app://local/' + app.vault.adapter["basePath"].replace("\\", "/")
      // 遍历库寻找该文件
      var fileVaultPath = ""
      for (const file of app.vault.getAllLoadedFiles()) {
        if (file.path.endsWith(value)) {
          fileVaultPath = file.path
        }
      }
      if (!fileVaultPath) {
        value = ""
      }
      else {
        value = basePath + "/" + fileVaultPath
      }
    }
    return (
      <img
        src={value}
      >
      </img>
    )
  }
}

export class UrlCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: ImgCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: ImgCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {

    return (
      <p>
        <a
          className='myUrl'
          href={this.state.cellValue}
        >
          {this.state.cellValue}
        </a>
      </p>
    )
  }
}

export class TagCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: TagCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: TagCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    var cellValue = this.state.cellValue
    if (typeof (cellValue) == "undefined") {
      cellValue = ""
    }
    return (
      <p>
        {
          cellValue.split(",").map((tag: string) => {
            if (tag) {
              return (
                <>
                  <a href={"#" + tag} className="tag" target="_blank" rel="noopener">{"#" + tag}</a>{'\u00A0'}
                </>
              )
            }
          })
        }
      </p>
    )
  }
}

export class InLinkCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: InLinkCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: InLinkCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    var cellValue = this.state.cellValue
    if (typeof (cellValue) == "undefined") {
      cellValue = ""
    }
    return (
      <p>
        <a
          className="internal-link"
          data-href={this.state.cellValue}
          href={this.state.cellValue}
          target="_blank"
          rel="noopener"
        >
          {cellValue.split("/").pop().replace(".md", "")}
        </a>
      </p>
    )
  }
}

export class CtimeCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: CtimeCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: CtimeCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    const filePath = this.props.data["yamleditFirstFileColumn"]
    const tabFile = this.props.app.vault.getAbstractFileByPath(filePath)
    var ctime = ""
    if (tabFile instanceof TFile) {
      const time = new Date(tabFile.stat.ctime)
      ctime = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`
    }
    return (
      <p>
        {ctime}
      </p>
    )
  }
}
export class MtimeCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: CtimeCellRender.getValueToDisplay(props)
    }
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: CtimeCellRender.getValueToDisplay(nextProps)
    };
  }

  static getValueToDisplay(params: any) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  render() {
    const filePath = this.props.data["yamleditFirstFileColumn"]
    const tabFile = this.props.app.vault.getAbstractFileByPath(filePath)
    var mtime = ""
    if (tabFile instanceof TFile) {
      const time = new Date(tabFile.stat.mtime)
      mtime = `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`
    }
    return (
      <p>
        {mtime}
      </p>
    )
  }
}