import { App, FrontMatterCache, TFile } from "obsidian";
import { settingStr } from "main";

export class MDIO{
    app:App;
    path:string;
    tfile: TFile;

    constructor(app: App, path: string) {
        this.app = app;
        this.path = path;
    }

	getTFile(){
		for (var file of this.app.vault.getFiles()) {
			if (file.path == this.path) {
				return file;
			}
		}
	}

    async write(content: string) {
        await this.app.vault.modify(this.getTFile(), content)
    }

    
    /**
     * 获取yaml起始行号
     * 
     * 有就返回yaml起始行号；
     * 没有新建然后返回行号
     * 
     * @returns 行号
     */
    async getYamlStartLine() {
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("sections")) {
            if (cache["sections"][0]["type"] == "yaml") {
                return cache["sections"][0]["position"]["start"]["line"];
            }
        }
        // 没有yaml就添加
        await this.app.vault.read(this.getTFile()).then(content => {
            this.write(`---\n---\n${content}`)
            return 0
        })
    }

    getFrontmatter() :FrontMatterCache{
        // 这里调用一下是为了确保文档有yaml
        // ！！注意：每个md文档调用这个后如果没有yaml也会在开头添加2个---
        this.getYamlStartLine();

        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("frontmatter")) {
            return cache["frontmatter"];
        }
        else {
            return {"position": {start: {line: 0, col: 0, offset: 0}, end: {line: 0, col: 0, offset: 0}}}
        }
    }

	addProperty(newProperty:string, value="") {
        var frontmatter = this.getFrontmatter();

        // 检测是否重复？
        if (frontmatter.hasOwnProperty(newProperty)) {
            return
        }
		else {
            this.getYamlStartLine().then(startLine => {
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    var oldContentList = oldContent.split("\n");
    
                    // 添加新属性
                    oldContentList.splice(startLine+1, 0, `${newProperty}: ${value}`)
                    var newContent = "";
                    for (var line of oldContentList) {
                        newContent = newContent + line + "\n";
                    }
    
                    // 写入
                    this.write(newContent)
                });
            })
		}
	}

	updatePropertyName(oldProperty:string, newProperty:string) {
        // 是否存在该属性？
		if (this.getFrontmatter().hasOwnProperty(oldProperty)) {
            // 检测是否为禁止操作项？
            if (settingStr.split(",").indexOf(oldProperty)==-1) {   // 不是禁止操作项
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    var newContent = oldContent.replace(`\n${oldProperty}:`, `\n${newProperty}:`)
    
                    // 写入
                    this.write(newContent)
                });
            }
		}  
	}
	
	updatePropertyValue(Property:string, newValue:string) {
        // 是否存在该属性？
		if (this.getFrontmatter().hasOwnProperty(Property)) {
            // 检测是否为禁止操作项？
            if (settingStr.split(",").indexOf(Property)==-1) {   // 不是禁止操作项
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    // 找到Property的行号
                    var oldContentList = oldContent.split("\n");
                    var lineNo = 0;
                    for (var line of oldContentList) {
                        lineNo = lineNo + 1;	// 起始行行数为1，第二行就是2
                        // 第一次出现Property后开始进行操作，在这一行后面添加新行以输入属性和其值
                        if (line.startsWith(Property)) {
                            break;
                        }
                    }
    
                    // 修改属性值
                    oldContentList.splice(lineNo-1, 1, `${Property}: ${newValue}`)
                    var newContent = "";
                    for (var line of oldContentList) {
                        newContent = newContent + line + "\n";
                    }
    
                    // 写入
                    this.write(newContent)
                });
            }
		}
	}
	
	delProperty(delProperty:string) {
        // 是否存在该属性？
		if (this.getFrontmatter().hasOwnProperty(delProperty)) {
            // 检测是否为禁止操作项？
            if (settingStr.split(",").indexOf(delProperty)==-1) {   // 不是禁止操作项
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    // 找到delProperty的行号
                    var oldContentList = oldContent.split("\n");
                    var lineNo = 0;
                    for (var line of oldContentList) {
                        lineNo = lineNo + 1;	// 起始行行数为1，第二行就是2
                        // 第一次出现delProperty后开始进行操作，在这一行后面添加新行以输入属性和其值
                        if (line.startsWith(delProperty)) {
                            break;
                        }
                    }
    
                    // 删除该属性
                    oldContentList.splice(lineNo-1, 1);
                    var newContent = "";
                    for (var line of oldContentList) {
                        newContent = newContent + line + "\n";
                    }
    
                    // 写入
                    this.write(newContent)
                });
            }
		}
	}

    hasProperty(property: string, value="") {
        if (this.getFrontmatter().hasOwnProperty(property)) {
            if (value) {
                if (this.getFrontmatter()[property] == value) {
                    return true
                }
                else {
                    return false
                }
            }
            else {
                return true
            }
        }
        return false
    }

    /**
     * 
     * @param TagName 前面不要加#号
     * @returns 
     */
    hasTag(TagName: string) {
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("tags")) {
            for (var item of cache["tags"]) {
                if (item.tag == `#${TagName}`) {
                    return true
                }
            }
        }
        return false
    }

    getPropertiesName():Array<string> {
        var nameList = new Array();
        for (var property in this.getFrontmatter()) {
            if (property != "position") {
                nameList.push(property)
            }
        }
        return nameList
    }

    getTagsName():Array<string> {
        var nameList = new Array();
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("tags")) {
            for (var item of cache["tags"]) {
                var tag = item.tag.replace("#", "")
                if (nameList.indexOf(tag)==-1) {
                    nameList.push(tag)
                }
            }
        }
        return nameList
    }

    getPropertyValue(property: string):string {
        if (this.hasProperty(property)) {
            return this.getFrontmatter()["property"]
        }
    }

}


export class Search{
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    getAllTagsName():Array<string> {
        var nameList = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            for (var TagName of new MDIO(this.app, file.path).getTagsName()) {
                if (nameList.indexOf(TagName) == -1) {
                    nameList.push(TagName)
                }
            }
        }
        return nameList
    }

    getAllYamlPropertiesName():Array<string> {
        var yamlPropertiesName = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            for (var propertyName of new MDIO(this.app, file.path).getPropertiesName()) {
                if (yamlPropertiesName.indexOf(propertyName) == -1) {
                    yamlPropertiesName.push(propertyName)
                }
            }
        }
        return yamlPropertiesName
    }
    
    getSelectedTFiles(conditions: Array<Array<string>>):Array<TFile> {
        var tFiles = new Array()
        for (var file of this.app.vault.getMarkdownFiles()) {
            var md = new MDIO(this.app, file.path)

            var fileSelected = true;

            // 条件判断
            for (var condition of conditions) {
                // 1、yaml
                if (condition[0] == "yaml") {
                    if (condition[1] == "包含") {
                        if (!md.hasProperty(condition[2])) {
                            fileSelected = false
                            break
                        }
                    }
                    else if(condition[1] == "不包含") {
                        if (md.hasProperty(condition[2])) {
                            fileSelected = false
                            break
                        }
                    }
                }
                else if (condition[0] == "yaml属性") {
                    if (!md.hasProperty(condition[1], condition[2])) {
                        fileSelected = false
                        break
                    }
                }
                else if (condition[0] == "标签") {
                    if (condition[1] == "包含") {
                        if (!md.hasTag(condition[2])) {
                            fileSelected = false
                            break
                        }
                    }
                    else if(condition[1] == "不包含") {
                        if (md.hasTag(condition[2])) {
                            fileSelected = false
                            break
                        }
                    }
                }
                else if (condition[0] == "文件名称") {
                    var reg = new RegExp(condition[2]);
                    if (condition[1] == "符合") {
                        if (!file.basename.match(reg)) {
                            fileSelected = false
                            break
                        }
                    }
                    else if(condition[1] == "不符合") {
                        if (file.basename.match(reg)) {
                            fileSelected = false
                            break
                        }
                    }
                }
                else if (condition[0] == "文件路径") {
                    var reg = new RegExp(condition[2]);
                    if (condition[1] == "符合") {
                        if (!file.path.match(reg)) {
                            fileSelected = false
                            break
                        }
                    }
                    else if(condition[1] == "不符合") {
                        if (file.path.match(reg)) {
                            fileSelected = false
                            break
                        }
                    }
                }
            }

            // 最终符合要求的存入数组
            if (fileSelected) {
                tFiles.push(file)
            }
        }
        return tFiles
    }

    getAllValuesOfAProperty(property: string):Array<string> {
        var valuesList = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            var md = new MDIO(this.app, file.path) 
            if (valuesList.indexOf(md.getPropertyValue(property)) == -1) {
                valuesList.push(md.getPropertyValue(property))
            }
        }
        return valuesList
    }
}