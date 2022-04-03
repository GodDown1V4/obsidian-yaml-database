import { Modal, App, TFile, Notice } from "obsidian";
import { allYamlChangeHistory, MDIO, oneOperationYamlChangeHistory, Search } from "src/md";
import { bannedProp } from "main";
import { admittedType } from "src/table"
 
export var conditionNameCount = 0;
/**
 * 1、主面板
 * 筛选条件
 */
export class MainModal extends Modal{
	constructor(app: App) {
		super(app);
	}

    onOpen(): void {
        conditionNameCount = 0;     // 清零条件名称数
        var inputList = new Array();    // 用来装input以便后边读取数值
        var app = this.app


		const title = this.titleEl
		title.setText("操作面板");

		const {contentEl} = this;

        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("添加新的条件")
        button.onclick = function() {
            var conditionArea = add3SearchInput(app)
            form.appendChild(conditionArea[3])
            inputList.push(conditionArea);
        }

		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe',
				'name': 'id_iframe',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
                'name': 'form1',
				'target': 'id_iframe',
			}
		})

        // 确认框
		form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'target': 'id_iframe',
				'type': 'submit',
				'value': '   确定    ',
			}
		})
        
        var conditionArea = add3SearchInput(this.app)
        form.appendChild(conditionArea[3])
        inputList.push(conditionArea);
        
        form.onsubmit = function(this){
            var conditions = new Array();
            for (var conInput of inputList) {
                conditions.push([conInput[0].value, conInput[1].value, conInput[2].value])
            }
            
            new SelectedFileModal(app, conditions).open();
        }
    }


    onClose(): void {
        
    }
}

/**
 * 2、展示筛选的文档面板
 */
export class SelectedFileModal extends Modal{
    conditions: Array<Array<string>>;

	constructor(app: App, conditions: Array<Array<string>>) {
		super(app);
        this.conditions = conditions;
	}

    onOpen(): void {
		const title = this.titleEl
		title.setText("选中的文档");

		const {contentEl} = this;

        
        var button1 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button1.setText("添加新属性")
        var button2 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button2.setText("修改属性名")
        var button3 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button3.setText("修改属性值")
        var button4 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button4.setText("删除属性")
        var button5 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button5.setText("删除整个YAML(❗危险操作☠️)")
        var button6 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button6.setText("清理空值属性(❗危险操作☠️)")

        // 展示搜索到的文档
        
		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe',
				'name': 'id_iframe',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
				'target': 'id_iframe',
			}
		})

        var search = new Search(this.app);
        var tfiles = search.getSelectedTFiles(this.conditions);

        var checkBoxesList: Array<HTMLInputElement> = new Array();
        for (var tfile of tfiles) {
            var checkBox = document.createElement("input")
            checkBox.setAttrs({
                "type": "checkbox",
                'name': `${tfile.path}`,
                "checked": true
            })
            var text = document.createElement("i")
            text.innerHTML = `${tfile.path}<br>`
            checkBoxesList.push(checkBox) 
            form.appendChild(checkBox)
            form.appendChild(text)
        }

        var app = this.app
        var modal = this

        
        // 按钮按下的操作
        button1.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "添加新属性", finallTfiles).open()
        }
        button2.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "修改属性名", finallTfiles).open()
        }
        button3.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "修改属性值", finallTfiles).open()
        }
        button4.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "删除属性", finallTfiles).open()
        }
        button5.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "删除整个YAML", finallTfiles).open()
        }
        button6.onclick = function() {
            var finallTfiles = modal.getCheckedTfiles(tfiles, checkBoxesList)
            new OperationModal(app, "清理空值属性", finallTfiles).open()
        }

    }

    onClose(): void {
        
    }

    getCheckedTfiles(tfiles: Array<TFile>,checkBoxesList:Array<HTMLInputElement>) {
        var finalTfiles:Array<TFile> = new Array()
        for (var checkBox of checkBoxesList) {
            if (checkBox.checked) {
                for (var file of tfiles) {
                    if (file.path == checkBox.name) {
                        finalTfiles.push(file)
                    }
                }
            }
        }
        return finalTfiles
    }
}


/**
 * 3、操作面板
 */
 export class OperationModal extends Modal{
    operation: string;
    tfiles: Array<TFile>;

	constructor(app: App, operation: string, tfiles: Array<TFile>) {
		super(app);
        this.operation = operation;
        this.tfiles = tfiles;
	}

    onOpen(): void {
        switch(this.operation) {
            case "添加新属性": this.addProperty(); break;
            case "修改属性名": this.updatePropertyName(); break;
            case "修改属性值": this.updatePropertyValue(); break;
            case "删除属性": this.delProperty(); break;
            case "删除整个YAML": this.delYAML(); break;
            case "清理空值属性": this.clearEmptyProps(); break;
            default: break;
        }
    }

    getPropertiesNameOfTflies(tfiles: Array<TFile>) {
        var propertiesList: Array<string> = new Array()
        for (var file of tfiles) {
            for (var name of new MDIO(this.app, file.path).getPropertiesName()) {
                if (propertiesList.indexOf(name) == -1) {
                    propertiesList.push(name)
                    // var li = document.createElement('li');
                    // li.innerHTML = name;
                    // property.appendChild(li)
                }
            }
        }
        return propertiesList
    }

    addProperty() {
		const title = this.titleEl
		title.setText("批量添加属性");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        var modal = this
        // 更新属性值
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)

		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe3',
				'name': 'id_iframe3',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
				'target': 'id_iframe3',
			}
		})

		var input1 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text'
			}
		})
		input1.placeholder = "属性名";
		var input2 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text'
			}
		})
		input2.placeholder = "属性值";

        
        // 确认框
		form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'submit',
				'value': '   确定    ',
			}
		})

        var app = this.app
        var tfiles = this.tfiles
        // 处理提交
        form.onsubmit = function() {
            oneOperationYamlChangeHistory.length = 0
            for (var file of tfiles) {
                var md = new MDIO(app, file.path)
                md.addProperty(input1.value, input2.value);
                setTimeout(() =>{
                    button.click();
                }, 100)
            }
            allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
            new Notice(`“${input1.value}”处理完成`)
        }

    }

    delProperty() {
        var modal = this
        var app = this.app
        var tfiles = this.tfiles

		const title = this.titleEl
		title.setText("批量删除属性");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        // 更新属性值
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)

		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe3',
				'name': 'id_iframe3',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
				'target': 'id_iframe3',
			}
		})

		var input1 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
                'list': 'finally'
			}
		})
		input1.placeholder = "属性名";

		var searchResult1 = form.createEl("datalist", {
			"attr": {
				"id": "finally"
			}
		})
        searchResult1.empty()
        for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
            var item = document.createElement('option');
            item.innerHTML = choice;
            searchResult1.appendChild(item);
        }
        input1.oninput = function() {
            searchResult1.empty()
            for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
                var item = document.createElement('option');
                item.innerHTML = choice;
                searchResult1.appendChild(item);
            }
        }
        
        // 确认框
		form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'submit',
				'value': '   确定    ',
			}
		})
        // 处理提交
        form.onsubmit = function() {
            if (bannedProp.split("\n").indexOf(input1.value)==-1) {
                oneOperationYamlChangeHistory.length = 0
                for (var file of tfiles) {
                    var md = new MDIO(app, file.path)
                    md.delProperty(input1.value);
                    setTimeout(() =>{
                        button.click();
                    }, 100)
                }
                allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                new Notice(`“${input1.value}”处理完成`)
            }
            else {
                new Notice(`“${input1.value}”为禁止删除和修改的属性, 请在设置面板里删除该项后重试`)
            }
        }

    }

    updatePropertyName() {
        var modal = this
        var app = this.app
        var tfiles = this.tfiles

		const title = this.titleEl
		title.setText("批量修改属性名称");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        // 更新属性名
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)

		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe3',
				'name': 'id_iframe3',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
				'target': 'id_iframe3',
			}
		})

		var input1 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
                'list': 'finally'
			}
		})
		input1.placeholder = "旧属性名";

		var searchResult1 = form.createEl("datalist", {
			"attr": {
				"id": "finally"
			}
		})
        searchResult1.empty()
        for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
            var item = document.createElement('option');
            item.innerHTML = choice;
            searchResult1.appendChild(item);
        }
        input1.oninput = function() {
            searchResult1.empty()
            for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
                var item = document.createElement('option');
                item.innerHTML = choice;
                searchResult1.appendChild(item);
            }
        }

		var input2 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text'
			}
		})
		input2.placeholder = "新属性名";

        
        // 确认框
		form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'submit',
				'value': '   确定    ',
			}
		})
        // 处理提交
        form.onsubmit = function() {
            if (bannedProp.split("\n").indexOf(input1.value)==-1) {
                if (input2.value) {
                    oneOperationYamlChangeHistory.length = 0
                    for (var file of tfiles) {
                        var md = new MDIO(app, file.path)
                        md.updatePropertyName(input1.value, input2.value);
                        setTimeout(() =>{
                            button.click();
                        }, 100)
                    }
                    allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                    new Notice(`“${input1.value}”处理完成`)
                }
                else {
                    new Notice(`请输入新的属性名`)
                }
            }
            else {
                new Notice(`“${input1.value}”为禁止删除和修改的属性, 请在设置面板里删除该项后重试`)
            }
        }

    }

    updatePropertyValue() {
        var modal = this
        var app = this.app
        var tfiles = this.tfiles

		const title = this.titleEl
		title.setText("批量修改属性值");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        // 更新属性值
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)

		// 2、无刷新表单
		contentEl.createEl("iframe", {
			'attr': {
				'id': 'id_iframe3',
				'name': 'id_iframe3',
				'style': 'display:none',
			}
		})

		var form = contentEl.createEl("form", {
			'attr': {
				'target': 'id_iframe3',
			}
		})

		var input1 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
				"list": "finally"
			}
		})
		input1.placeholder = "属性名";
		var searchResult1 = form.createEl("datalist", {
			"attr": {
				"id": "finally"
			}
		})
        searchResult1.empty()
        for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
            var item = document.createElement('option');
            item.innerHTML = choice;
            searchResult1.appendChild(item);
        }
        input1.oninput = function() {
            searchResult1.empty()
            for(var choice of modal.getPropertiesNameOfTflies(tfiles)){
                var item = document.createElement('option');
                item.innerHTML = choice;
                searchResult1.appendChild(item);
            }
        }

		var input2 = form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text'
			}
		})
		input2.placeholder = "属性值";

        
        // 确认框
		form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'submit',
				'value': '   确定    ',
			}
		})
        // 处理提交
        form.onsubmit = function() {
            if (bannedProp.split("\n").indexOf(input1.value)==-1) {
                oneOperationYamlChangeHistory.length = 0
                for (var file of tfiles) {
                    var md = new MDIO(app, file.path)
                    md.updatePropertyValue(input1.value, input2.value);
                    setTimeout(() =>{
                        button.click();
                    }, 100)
                }
                allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
                new Notice(`“${input1.value}”处理完成`)
            }
            else {
                new Notice(`“${input1.value}”为禁止删除和修改的属性, 请在设置面板里删除该项后重试`)
            }
        }

    }
    
    delYAML() {
        var modal = this
        var app = this.app
        var tfiles = this.tfiles

		const title = this.titleEl
		title.setText("批量删除整个YAML(❗危险操作☠️)");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        // 更新属性值
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)
        
        // 介绍
		contentEl.createDiv().innerHTML = "此处批量删除文档的整个YAML只会对那些不包含重要属性的文档进行操作,\
        因包含重要属性而无法删除的文档请在控制台(Ctrl+Shift+i)查看"
        
        // 删除确认按钮
        var button2 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button2.setText("确认删除(❗危险操作☠️)")
        // 处理提交
        button2.onclick = function() {
            oneOperationYamlChangeHistory.length = 0
            for (var file of tfiles) {
                var md = new MDIO(app, file.path)
                md.delTheWholeYaml();
                setTimeout(() =>{
                    button.click();
                }, 100)
            }
            allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
        }

    }

    clearEmptyProps() {
        var modal = this
        var app = this.app
        var tfiles = this.tfiles

		const title = this.titleEl
		title.setText("清理空值属性(❗危险操作☠️)");

		const {contentEl} = this;
		
        // 展示属性按钮
        var button = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button.setText("这些文件包含的属性(刷新)")

        // 展示已有属性
		var property = contentEl.createEl("ul")
        // 更新属性值
        button.onclick = function() {
            property.empty()
            for (var name of modal.getPropertiesNameOfTflies(tfiles)) {
                var li = document.createElement('li');
                li.innerHTML = name;
                property.appendChild(li)
            }
        }
        setTimeout(() =>{
            button.click();
        }, 100)
        
        // 介绍
		contentEl.createDiv().innerHTML = "此处清理空值属性只会对选中文档的那些非重要且值为空的属性进行操作, 如果您所选中文档中的的某个非重要属性只有空格, 那么执行此操作也会将其清除"
        
        // 删除确认按钮
        var button2 = contentEl.createEl("button", {
			'attr': {
				"class": "kanbanMOC",
			}
		})
        button2.setText("确认删除(❗危险操作☠️)")
        // 处理提交
        button2.onclick = function() {
            oneOperationYamlChangeHistory.length = 0
            for (var file of tfiles) {
                var md = new MDIO(app, file.path)
                md.clearEmptyProps();
            }
            allYamlChangeHistory.push(oneOperationYamlChangeHistory.slice(0))
            setTimeout(() =>{
                button.click();
            }, 100)
        }

    }

    onClose(): void {
        
    }
}


/**
 * 创建3个输入搜索框（也可能是2个搜索输入框+1个文字输入框）
 */
 export function add3SearchInput(app:App, defaultValue: Array<string> = []) {
    var conDiv = document.createElement("div")
    var deleteButton = conDiv.createEl("button",{
        attr: {
            "data-toggle": "tooltip",
            "title":"删除该筛选条件"
        }
    })
    deleteButton.innerHTML = "➖"
    /**
     * 搜索输入选框
     */
    if (defaultValue.length == 3) {
        var input1 = createSelectWithChoice(defaultValue[0],["yaml", "yaml属性", "标签", "文件名称", "文件路径"])
        var input2 = createSelectWithChoice(defaultValue[1],[])
        var [input3,searchResult3] = createInputWithChoice(conditionNameCount++,defaultValue[2],[])
    }
    else {
        var input1 = createSelectWithChoice("",["yaml", "yaml属性", "标签", "文件名称", "文件路径"])
        var input2 = createSelectWithChoice("",[])
        var [input3,searchResult3] = createInputWithChoice(conditionNameCount++,"",[])
    }
    conDiv.appendChild(input1)
    conDiv.appendChild(input2)
    conDiv.appendChild(input3)
    conDiv.appendChild(searchResult3)

    deleteButton.onclick = function() {
        input1.value = ""
        input2.value = ""
        input3.value = ""
        conDiv.remove()
    }
    function solveOptions() {
        switch(input1.value) {
            case "yaml":{
                // 处理input2
                for(var choice of ["包含", "不包含"]){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    item.setAttr("value", choice)
                    input2.appendChild(item);
                }
                // 处理input3
                var search = new Search(app);
                for(var choice of search.getAllYamlPropertiesName()){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult3.appendChild(item);
                }
            }; break;
            case "yaml属性":{
                // 处理input2
                var search = new Search(app);
                for(var choice of search.getAllYamlPropertiesName()){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    item.setAttr("value", choice)
                    input2.appendChild(item);
                }
                for(var choice of search.getAllValuesOfAProperty(input2.value)){
                    if (choice) {
                        var item = document.createElement('option');
                        item.innerHTML = choice;
                        searchResult3.appendChild(item);
                    }
                }
                // 处理input3
                input2.oninput = function() {
                    for(var choice of search.getAllValuesOfAProperty(input2.value)){
                        if (choice) {
                            var item = document.createElement('option');
                            item.innerHTML = choice;
                            searchResult3.appendChild(item);
                        }
                    }
                }
            }; break;
            case "标签":{
                // 处理input2
                for(var choice of ["包含", "不包含"]){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    item.setAttr("value", choice)
                    input2.appendChild(item);
                }
                // 处理input3
                var search = new Search(app);
                for(var choice of search.getAllTagsName()){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult3.appendChild(item);
                }
            }; break;
            default:{   // 默认为"文件路径"和"文件名称"
                // 处理input2
                for(var choice of ["符合", "不符合"]){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    item.setAttr("value", choice)
                    input2.appendChild(item);
                }
            }; break;
        }
    }

    solveOptions()
    /**
     * input1 oninput
     */
    input1.oninput = function() {
        // 输入选框1改动时其它2个选框清空
        input2.value = "";
        input2.empty();
        input3.value = "";
        searchResult3.empty();

        // 输入1搜索候选项

        // 如果input1值为候选项中的值，则开始处理输入2、3候选项
        solveOptions()
    }
    return [input1, input2, input3, conDiv]
}
/**
 * 创建3个用于属性输入搜索框（也可能是2个搜索输入框+1个文字输入框）
 */
 export function add3SearchPropInput(headslist: Array<string>, defaultValue: Array<string> = []) {
    var conDiv = document.createElement("div")
    var deleteButton = conDiv.createEl("button", {
        attr: {
            "data-toggle": "tooltip",
            "title":"取消对该属性的显示"
        }
    })
    deleteButton.innerHTML = "➖"
    /**
     * 搜索输入选框
     */
    if (defaultValue.length == 3) {
        var input1 = createSelectWithChoice(defaultValue[0],headslist)
        var [input2,searchResult2] = createInputWithChoice(conditionNameCount++,defaultValue[1],[])
        var input3 = createSelectWithChoice(defaultValue[2],admittedType)
    }
    else {
        var input1 = createSelectWithChoice("",headslist)
        var [input2,searchResult2] = createInputWithChoice(conditionNameCount++,"",[])
        var input3 = createSelectWithChoice("text",admittedType)
    }
    conDiv.appendChild(input1)
    conDiv.appendChild(input2)
    conDiv.appendChild(input3)

    deleteButton.onclick = function() {
        input1.value = ""
        input2.value = ""
        input3.value = ""
        conDiv.remove()
    }

    /**
     * input1 oninput
     */
    input2.value = input1.value
    input1.oninput = function() {
        input2.value = input1.value
    }
    return [input1, input2, input3, conDiv]
}
/**
 * 创建2个输入搜索框（也可能是2个搜索输入框+1个文字输入框）
 */
export function add2SortInput(headslist: Array<string>, defaultValue: Array<string> = []) {
    var conDiv = document.createElement("div")
    var deleteButton = conDiv.createEl("button", {
        attr: {
            "data-toggle": "tooltip",
            "title":"删除该排序条件"
        }
    })
    deleteButton.innerHTML = "➖"
    /**
     * 搜索输入选框
     */
    if (defaultValue.length == 2) {
        var input1 = createSelectWithChoice(defaultValue[0],headslist)
        var input2 = createSelectWithChoice(defaultValue[1],["asc","desc"])
    }
    else {
        var input1 = createSelectWithChoice("",headslist)
        var input2 = createSelectWithChoice("",["asc","desc"])
    }
    conDiv.appendChild(input1)
    conDiv.appendChild(input2)

    deleteButton.onclick = function() {
        input1.value = ""
        input2.value = ""
        conDiv.remove()
    }
    return [input1, input2, conDiv]
}

export function createSelectWithChoice(defaultValue:string, datalist: Array<string>) {
    var select = document.createElement("select")
    select.setAttrs({
        "class": "kanbanMOC",
        // 'type': 'text',
        // "list": String(uniqueId) + "condition-yaml"
    })

    for(var choice of datalist){
        var item = document.createElement('option');
        if (choice == defaultValue) {
            item.selected = true
        }
        item.setAttr("value", choice)
        item.innerHTML = choice;
        select.appendChild(item);
    }

    return select
}

export function createInputWithChoice(uniqueId:number, defaultValue:string, datalist: Array<string>) {
    var input = document.createElement("input")
    input.setAttrs({
        'type': 'text',
        "list": String(uniqueId) + "condition-yaml"
    })
    input.value = defaultValue

    var searchResult = document.createElement("datalist")
    searchResult.setAttr("id", String(uniqueId) + "condition-yaml")

    for(var choice of datalist){
        var item = document.createElement('option');
        item.innerHTML = choice;
        searchResult.appendChild(item);
    }

    return [input, searchResult]
}