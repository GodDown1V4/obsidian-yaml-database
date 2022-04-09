import { ICellRendererParams } from 'ag-grid-community'
import React, { Component, createRef } from 'react'
import { App, MarkdownRenderer } from 'obsidian'
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory } from 'yaml/md'

interface Props extends ICellRendererParams {
  app: App
}

export default class CustomCellRenderer extends Component<Props> {
  private cellValue: string
  cellRef: React.RefObject<HTMLSpanElement>
  constructor(props: Props) {
    super(props)
    this.cellRef = createRef()
    this.cellValue = this.props.value.trim()
  }

  async componentDidMount() {
    await MarkdownRenderer.renderMarkdown(
      this.cellValue,
      this.cellRef.current,
      '',
      null
    )
  }

  render() {
    return <span ref={this.cellRef}></span>
  }
}


interface State {
  cellValue: any
}

export class TodoCellRender extends Component<Props, State> {
  private cellValue: string

  constructor(props: Props) {
    super(props)
    this.cellValue = this.props.value.trim()
    this.state = {
      cellValue: this.cellValue == "true" ? true : false,
    }
  }

  render() {

    return (
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
            md.updatePropertyValue(thisColumn, String(!this.state.cellValue))
          }
          // 没有该属性则新建该属性并赋值
          else {
            md.addProperty(thisColumn, String(!this.state.cellValue))
          }
          allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
        }}
      >

      </input>
    )
  }
}

export class ImgCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: ImgCellRender.getValueToDisplay(props.value)
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
      <img
        src={this.state.cellValue}
      >
      </img>
    )
  }
}


export class TagCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: TagCellRender.getValueToDisplay(props.value)
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
    return (
      <>
        {
          this.state.cellValue.split(",").map((tag: string) => {
            if (tag) {
              return (
                <>
                  <a href={"#" + tag} className="tag" target="_blank" rel="noopener">{"#" + tag}</a>{'\u00A0'}
                </>
              )
            }
          })
        }
      </>
    )
  }
}

export class InLinkCellRender extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      cellValue: InLinkCellRender.getValueToDisplay(props.value)
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
    return (
      <a
        className="internal-link"
        data-href={this.state.cellValue}
        href={this.state.cellValue}
        target="_blank"
        rel="noopener"
      >
        {this.state.cellValue.split("/").pop().replace(".md", "")}
      </a>
    )
  }
}