import React, { createRef } from 'react'
import { ColDef, ICellEditorParams } from 'ag-grid-community'
import { App, Notice } from 'obsidian'
import t from 'i18n'
import { Search } from 'yaml/md'
// react-select
import CreatableSelect from 'react-select/creatable';
import { ActionMeta, OnChangeValue } from 'react-select';

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
        if (this.props.colDef.colId == "yamleditFirstFileColumn") {
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
        else {
            return false
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
        var label =
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
        if (this.props.colDef.colId != "yamleditFirstFileColumn") {
            label =
                <input
                    ref={this.inputRef}
                    value={this.state.value}
                    type={"text"}
                    onChange={event => this.setState({ value: event.target.value })}
                >
                </input>
        }
        return (
            <div>
                {label}
            </div>
        )
    }
}

// 选择编辑器
export interface myOption {
    readonly value: string;
    readonly label: string;
    readonly color?: string;
    readonly isFixed?: boolean;
    readonly isDisabled?: boolean;
}
// 单选
export class SelectEditor extends React.Component<Props, State> {
    // inputRef: React.RefObject<CreatableSelect>
    optionsList: Array<myOption>


    constructor(props: Props) {
        super(props)
        // this.inputRef = createRef();
        this.state = {
            value: props.value
        };
        this.optionsList = new Array()
        var oldValues = this.props.colDef.cellEditorParams.values
        for (var item of oldValues) {
            if (item) {
                this.optionsList.push({
                    value: item,
                    label: item,
                })
            }
        }
    }
    componentDidMount() {
        // this.inputRef.current.focus();
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
        return false;
    }

    // 处理变化
    handleChange = (
        newValue: OnChangeValue<myOption, false>,
    ) => {

        const oldoptionsList = this.optionsList.map((option) => {
            return option["value"]
        })

        // 处理获得的值，将新建的值变更到表格列中，再在DataGrid中的onCellEdited什么的存储至data.json中
        if (newValue.hasOwnProperty("__isNew__") && oldoptionsList.indexOf(newValue.value) == -1 && newValue.value) {
            // 将改值加入列定义中
            this.optionsList.push({
                value: newValue.value,
                label: newValue.value,
            })
            const newOptionsList = this.optionsList.map((option) => {
                return option["value"]
            })
            var columns = this.props.api.getColumnDefs()
            const newColums = columns.map((col: ColDef) => {
                if (col.colId == this.props.colDef.colId) {
                    col.cellEditorParams = {
                        "values": newOptionsList
                    }
                }
                return col
            })
            // 变更到列
            this.props.api.setColumnDefs(newColums)
        }

        this.setState({ value: newValue.value })
    };

    private isDarkMode(): boolean {
        return Array.from(document.body.classList).includes('theme-dark')
    }

    render(): React.ReactNode {
        var oldValuesOptions = {}
        if (this.state.value) {
            const oldValues = this.state.value.split(",")
            for (var item of oldValues) {
                oldValuesOptions = {
                    value: item,
                    label: item
                }
                break
            }
        }
        return (
            <div>
                <CreatableSelect
                    // isMulti={true}
                    className={
                        this.isDarkMode() ? 'mySelect-dark' : 'mySelect'
                    }
                    defaultValue={oldValuesOptions}
                    // ref={this.inputRef}
                    onChange={this.handleChange}
                    // defaultValue={this.state.value}
                    options={this.optionsList}
                />
            </div>
        )
    }
}
// 多选
export class MultiSelectEditor extends React.Component<Props, State> {
    // inputRef: React.RefObject<CreatableSelect>
    optionsList: Array<myOption>


    constructor(props: Props) {
        super(props)
        // this.inputRef = createRef();
        this.state = {
            value: props.value
        };
        this.optionsList = new Array()
        var oldValues = this.props.colDef.cellEditorParams.values
        for (var item of oldValues) {
            if (item) {
                this.optionsList.push({
                    value: item,
                    label: item,
                })
            }
        }
    }
    componentDidMount() {
        // this.inputRef.current.focus();
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
        return false;
    }

    // 处理变化
    handleChange = (
        newValue: OnChangeValue<myOption, true>,
        actionMeta: ActionMeta<myOption>
    ) => {

        const oldoptionsList = this.optionsList.map((option) => {
            return option["value"]
        })

        // 处理获得的值，将新建的值变更到表格列中，再在DataGrid中的onCellEdited什么的存储至data.json中
        for (var item of newValue) {
            if (item.hasOwnProperty("__isNew__") && oldoptionsList.indexOf(item.value) == -1 && item.value) {
                // 将改值加入列定义中
                this.optionsList.push({
                    value: item.value,
                    label: item.value,
                })
                const newOptionsList = this.optionsList.map((option) => {
                    return option["value"]
                })
                var columns = this.props.api.getColumnDefs()
                const newColums = columns.map((col: ColDef) => {
                    if (col.colId == this.props.colDef.colId) {
                        col.cellEditorParams = {
                            "values": newOptionsList
                        }
                    }
                    return col
                })
                // 变更到列
                this.props.api.setColumnDefs(newColums)
            }
        }
        const newValues = newValue.map((option) => {
            return option.value
        })
        this.setState({ value: newValues.join(',') })
    };

    private isDarkMode(): boolean {
        return Array.from(document.body.classList).includes('theme-dark')
    }

    render(): React.ReactNode {
        var oldValuesOptions = new Array()
        if (this.state.value) {
            const oldValues = this.state.value.split(",")
            for (var item of oldValues) {
                oldValuesOptions.push({
                    value: item,
                    label: item
                })
            }
        }
        return (
            <div>
                <CreatableSelect
                    isMulti={true}
                    className={
                        this.isDarkMode() ? 'mySelect-dark' : 'mySelect'
                    }
                    defaultValue={oldValuesOptions}
                    // ref={this.inputRef}
                    onChange={this.handleChange}
                    // defaultValue={this.state.value}
                    options={this.optionsList}
                />
            </div>
        )
    }
}