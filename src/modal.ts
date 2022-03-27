import { Modal, App, TFile, Notice } from "obsidian";
import { MDIO, Search } from "src/md";
import { settingStr } from "main";

var conditionNameCount = 0;
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
            inputList.push(conditionArea.addSearchInput(`condition${conditionNameCount}`))
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
        
        var conditionArea = new Condition(this.app, form)
        inputList.push(conditionArea.addSearchInput(`condition${conditionNameCount}`));

        var app = this.app
        
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

        // 展示搜索到的文档
        var search = new Search(this.app);
        var tfiles = search.getSelectedTFiles(this.conditions);
        var mdStr = ""
        for (var tfile of tfiles) {
            mdStr = mdStr + tfile.path + "<br>"
        }
        contentEl.createSpan().innerHTML = mdStr

        var app = this.app
        
        // 按钮按下的操作
        button1.onclick = function() {
            new OperationModal(app, "添加新属性", tfiles).open()
        }
        button2.onclick = function() {
            new OperationModal(app, "修改属性名", tfiles).open()
        }
        button3.onclick = function() {
            new OperationModal(app, "修改属性值", tfiles).open()
        }
        button4.onclick = function() {
            new OperationModal(app, "删除属性", tfiles).open()
        }

    }

    onClose(): void {
        
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
            default: break;
        }
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
        // 更新属性值
        button.onclick = function() {
            property.empty()
            var propertiesList = new Array()
            for (var file of tfiles) {
                for (var name of new MDIO(app, file.path).getPropertiesName()) {
                    if (propertiesList.indexOf(name) == -1) {
                        propertiesList.push(name)
                        var li = document.createElement('li');
                        li.innerHTML = name;
                        property.appendChild(li)
                    }
                }
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
            for (var file of tfiles) {
                var md = new MDIO(app, file.path)
                md.addProperty(input1.value, input2.value);
                setTimeout(() =>{
                    button.click();
                }, 100)
            }
            new Notice(`“${input1.value}”处理完成`)
        }

    }

    delProperty() {
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
            var propertiesList = new Array()
            for (var file of tfiles) {
                for (var name of new MDIO(app, file.path).getPropertiesName()) {
                    if (propertiesList.indexOf(name) == -1) {
                        propertiesList.push(name)
                        var li = document.createElement('li');
                        li.innerHTML = name;
                        property.appendChild(li)
                    }
                }
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
            if (settingStr.split(",").indexOf(input1.value)==-1) {
                for (var file of tfiles) {
                    var md = new MDIO(app, file.path)
                    md.delProperty(input1.value);
                    setTimeout(() =>{
                        button.click();
                    }, 100)
                }
                new Notice(`“${input1.value}”处理完成`)
            }
            else {
                new Notice(`“${input1.value}”为禁止删除和修改的属性, 请在设置面板里删除该项后重试`)
            }
        }

    }

    updatePropertyName() {
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
        // 更新属性值
        button.onclick = function() {
            property.empty()
            var propertiesList = new Array()
            for (var file of tfiles) {
                for (var name of new MDIO(app, file.path).getPropertiesName()) {
                    if (propertiesList.indexOf(name) == -1) {
                        propertiesList.push(name)
                        var li = document.createElement('li');
                        li.innerHTML = name;
                        property.appendChild(li)
                    }
                }
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
		input1.placeholder = "旧属性名";
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

        var app = this.app
        var tfiles = this.tfiles
        // 处理提交
        form.onsubmit = function() {
            if (settingStr.split(",").indexOf(input1.value)==-1) {
                if (input2.value) {
                    for (var file of tfiles) {
                        var md = new MDIO(app, file.path)
                        md.updatePropertyName(input1.value, input2.value);
                        setTimeout(() =>{
                            button.click();
                        }, 100)
                    }
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
        // 更新属性值
        button.onclick = function() {
            property.empty()
            var propertiesList = new Array()
            for (var file of tfiles) {
                for (var name of new MDIO(app, file.path).getPropertiesName()) {
                    if (propertiesList.indexOf(name) == -1) {
                        propertiesList.push(name)
                        var li = document.createElement('li');
                        li.innerHTML = name;
                        property.appendChild(li)
                    }
                }
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
            if (settingStr.split(",").indexOf(input1.value)==-1) {
                for (var file of tfiles) {
                    var md = new MDIO(app, file.path)
                    md.updatePropertyValue(input1.value, input2.value);
                    setTimeout(() =>{
                        button.click();
                    }, 100)
                }
                new Notice(`“${input1.value}”处理完成`)
            }
            else {
                new Notice(`“${input1.value}”为禁止删除和修改的属性, 请在设置面板里删除该项后重试`)
            }
        }

    }

    onClose(): void {
        
    }
}

/**
 * 条件
 */
export class Condition {
    app: App;
    form: HTMLFormElement;

    constructor(app:App, form: HTMLFormElement) {
        this.app = app;
        this.form = form;
    }

    /**创建3个输入搜索框（也可能是2个搜索输入框+1个文字输入框）
     * @param Name 确保该参数为独一无二的，使用form.name1、form.name2、form.name3读取input值
     */
    addSearchInput(Name: string) {
        conditionNameCount = conditionNameCount + 1;

        this.form.createDiv().setText(`条件${conditionNameCount}`)
        /**
         * 搜索输入选框1
         */
		var input1 = this.form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
				"list": Name + "1"
			}
		})
		input1.placeholder = "请选择";

		var searchResult1 = this.form.createEl("datalist", {
			"attr": {
				"id": Name + "1"
			}
		})
        
        var choice1 = ["yaml", "yaml属性", "标签", "文件名称", "文件路径"]
        for(var choice of choice1){
            var item = document.createElement('option');
            item.innerHTML = choice;
            searchResult1.appendChild(item);
        }

        /**
         * 搜索输入选框2
         */
         var input2 = this.form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
				"list": Name + "2"
			}
		})
		input2.placeholder = "请输入";

		var searchResult2 = this.form.createEl("datalist", {
			"attr": {
				"id": Name + "2"
			}
		})

        /**
         * 搜索输入选框3
         */
         var input3 = this.form.createEl("input", {
			'attr': {
				"class": "kanbanMOC",
				'type': 'text',
				"list": Name + "3"
			}
		})
		input3.placeholder = "请输入";

		var searchResult3 = this.form.createEl("datalist", {
			"attr": {
				"id": Name + "3"
			}
		})

        /**
         * input1 oninput
         */
        var app = this.app;
		input1.oninput = function() {
            // 输入选框1改动时其它2个选框清空
            input2.value = "";
			searchResult2.empty();
            input3.value = "";
			searchResult3.empty();

            // 输入1搜索候选项

            // 如果input1值为候选项中的值，则开始处理输入2、3候选项
            if (input1.value == "yaml") {
                // 处理input2
                for(var choice of searchByIndexOf(input2.value, ["包含", "不包含"])){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult2.appendChild(item);
                }
                // 处理input3
                var search = new Search(app);
                for(var choice of searchByIndexOf(input3.value, search.getAllYamlPropertiesName())){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult3.appendChild(item);
                }
            }
            else if (input1.value == "yaml属性") {
                // 处理input2
                var search = new Search(app);
                for(var choice of searchByIndexOf(input2.value, search.getAllYamlPropertiesName())){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult2.appendChild(item);
                }
                // 处理input3
                for(var choice of searchByIndexOf(input3.value, search.getAllValuesOfAProperty(input2.value))){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult3.appendChild(item);
                }
            }
            else if (input1.value == "标签") {
                // 处理input2
                for(var choice of searchByIndexOf(input2.value, ["包含", "不包含"])){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult2.appendChild(item);
                }
                // 处理input3
                var search = new Search(app);
                for(var choice of searchByIndexOf(input3.value, search.getAllTagsName())){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult3.appendChild(item);
                }
            }
            else if (input1.value == "文件名称" || input1.value == "文件路径") {
                // 处理input2
                for(var choice of searchByIndexOf(input2.value, ["符合", "不符合"])){
                    var item = document.createElement('option');
                    item.innerHTML = choice;
                    searchResult2.appendChild(item);
                }
            }
		}
        return [input1, input2, input3]
    }
}


//模糊查询1:利用字符串的indexOf方法
function searchByIndexOf(keyWord:string, list:Array<string>){
	if(!(list instanceof Array)){
		return ;
	}
	var len = list.length;
	var arr = [];
	for(var i=0;i<len;i++){
		//如果字符串中不包含目标字符会返回-1
		if(list[i].indexOf(keyWord)>=0){
			arr.push(list[i]);
		}
	}
	return arr;
}
//正则匹配
function searchByRegExp(keyWord:string, list:Array<string>){
	if(!(list instanceof Array)){
		return ;
	}
	var len = list.length;
	var arr = [];
	var reg = new RegExp(keyWord);
	for(var i=0;i<len;i++){
		//如果字符串中不包含目标字符会返回-1
		if(list[i].match(reg)){
			arr.push(list[i]);
		}
	}
	return arr;
}
function renderFruits(list:Array<string>){
	// 在这里更改你要进行动态生成的datalist的id
	var oList = document.getElementById('databases');
	if(!(list instanceof Array)){
		return ;
	}
	oList.innerHTML = '';
	var len = list.length;
	var item = null;
	for(var i=0;i<len;i++){
		item = document.createElement('li');
		item.innerHTML = list[i];
		oList.appendChild(item);
	}
}