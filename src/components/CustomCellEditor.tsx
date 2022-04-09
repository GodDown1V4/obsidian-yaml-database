import React, { createRef } from 'react'
import { ColDef, ICellEditorParams } from 'ag-grid-community'
import { App, Notice } from 'obsidian'
import t from 'i18n'
import { Search } from 'yaml/md'

interface Props extends ICellEditorParams {
    app: App
    columnDefs: ColDef[]
    rowData: Array<{ [key: string]: string }>
}
interface State {
    value: string
}


export class DateEditor extends React.Component<Props, State> {
    inputRef: React.RefObject<HTMLInputElement>

    constructor(props: Props) {
        super(props)
        this.inputRef = createRef();
        this.state = {
            value: props.value
        };
    }
    componentDidMount() {
        this.inputRef.current.focus();
    }

    /* Component Editor Lifecycle methods */
    // the final value to send to the grid, on completion of editing
    getValue() {
        // this simple editor doubles any value entered into the input
        return this.state.value
    }

    // Gets called once before editing starts, to give editor a chance to
    // cancel the editing before it even starts.
    isCancelBeforeStart() {
        return false;
    }

    // Gets called once when editing is finished (eg if Enter is pressed).
    // If you return true, then the result of the edit will be ignored.
    isCancelAfterEnd() {
        // our editor will reject any value greater than 1000
        return !this.state.value;
    }

    render(): React.ReactNode {
        return (
            <div>
                <input
                    ref={this.inputRef}
                    value={this.state.value}
                    type={"date"}
                    onChange={event => this.setState({ value: event.target.value })}
                >
                </input>
            </div>
        )
    }
}

export class TimeEditor extends React.Component<Props, State> {
    inputRef: React.RefObject<HTMLInputElement>

    constructor(props: Props) {
        super(props)
        this.inputRef = createRef();
        this.state = {
            value: props.value
        };
    }
    componentDidMount() {
        this.inputRef.current.focus();
    }

    /* Component Editor Lifecycle methods */
    // the final value to send to the grid, on completion of editing
    getValue() {
        // this simple editor doubles any value entered into the input
        return this.state.value
    }

    // Gets called once before editing starts, to give editor a chance to
    // cancel the editing before it even starts.
    isCancelBeforeStart() {
        return false;
    }

    // Gets called once when editing is finished (eg if Enter is pressed).
    // If you return true, then the result of the edit will be ignored.
    isCancelAfterEnd() {
        // our editor will reject any value greater than 1000
        return !this.state.value;
    }

    render(): React.ReactNode {
        return (
            <div>
                <input
                    ref={this.inputRef}
                    value={this.state.value}
                    type={"time"}
                    onChange={event => this.setState({ value: event.target.value })}
                >
                </input>
            </div>
        )
    }
}

export class NumberEditor extends React.Component<Props, State> {
    inputRef: React.RefObject<HTMLInputElement>

    constructor(props: Props) {
        super(props)
        this.inputRef = createRef();
        this.state = {
            value: props.value
        };
    }
    componentDidMount() {
        this.inputRef.current.focus();
    }

    /* Component Editor Lifecycle methods */
    // the final value to send to the grid, on completion of editing
    getValue() {
        // this simple editor doubles any value entered into the input
        return this.state.value
    }

    // Gets called once before editing starts, to give editor a chance to
    // cancel the editing before it even starts.
    isCancelBeforeStart() {
        return false;
    }

    // Gets called once when editing is finished (eg if Enter is pressed).
    // If you return true, then the result of the edit will be ignored.
    isCancelAfterEnd() {
        // our editor will reject any value greater than 1000
        return !this.state.value;
    }

    render(): React.ReactNode {
        return (
            <div>
                <input
                    ref={this.inputRef}
                    value={this.state.value}
                    type={"number"}
                    onChange={event => this.setState({ value: event.target.value })}
                >
                </input>
            </div>
        )
    }
}

export class InlinkEditor extends React.Component<Props, State> {
    inputRef: React.RefObject<HTMLInputElement>

    constructor(props: Props) {
        super(props)
        this.inputRef = createRef();
        this.state = {
            value: props.value
        };
    }
    componentDidMount() {
        this.inputRef.current.focus();
    }

    /* Component Editor Lifecycle methods */
    // the final value to send to the grid, on completion of editing
    getValue() {
        // this simple editor doubles any value entered into the input
        return this.state.value
    }

    // Gets called once before editing starts, to give editor a chance to
    // cancel the editing before it even starts.
    isCancelBeforeStart() {
        return false;
    }

    // Gets called once when editing is finished (eg if Enter is pressed).
    // If you return true, then the result of the edit will be ignored.
    isCancelAfterEnd() {
        const Name = this.state.value.split("/").pop().replace(".md", "")
        if (this.renameCheck(Name)) {
            var path = this.props.value.split("/")
            path.pop()

            this.props.app.fileManager.renameFile(this.props.app.vault.getAbstractFileByPath(this.props.value), String(`${path.join("/")}/${Name.replace(".md", "")}.md`))
            return false
        }
        else {
            return true
        }
    }

    // 合规则返回true
    renameCheck(Name: string) {
        // 检查文件名称是否合法
        if (!Name.trim()) {
            return false
        }
        // 不能以.开头
        if (Name.startsWith('.')) {
            new Notice(t("fileNameNotStartsWithdot"))
            return false
        }
        // 不能包含*"\/<>:|?
        var unlegalChar = `*"\/<>:|?`
        for (var char of Name) {
            if (unlegalChar.indexOf(char) != -1) {
                new Notice(t("fileNameNotIncludes"))
                return false
            }
        }


        // 检查是否重名
        var path = this.props.value.split("/")
        path.pop()
        const filesName = new Search(this.props.app).getTAbstractFilesOfAFolder(path.join("/")).map((file) => {
            return file.name.replace(".md", "")
        })
        if (filesName.indexOf(Name) != -1 && Name != this.props.value.split("/").pop().replace(".md", "")) {
            new Notice(t("repeatedName"))
            return false
        }

        return true
    }

    render(): React.ReactNode {
        return (
            <div>
                <input
                    ref={this.inputRef}
                    value={this.state.value.split("/").pop().replace(".md", "")}
                    type={"text"}
                    onInput={event => this.renameCheck(event.target["value"].replace(".md", ""))}
                    onChange={event => {
                        var path = this.props.value.split("/")
                        path.pop()
                        this.setState({ value: `${path.join("/")}/${event.target.value.replace(".md", "")}.md` })
                    }}
                >
                </input>
            </div>
        )
    }
}
