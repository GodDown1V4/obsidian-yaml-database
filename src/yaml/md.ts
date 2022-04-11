import t from "i18n";
import { App, FrontMatterCache, Notice, TAbstractFile, TFile } from "obsidian";
// import { bannedProp, bannedFolder } from "main";

var bannedFolder = ""
var bannedProp = ""

// 历史操作记录，从加载插件开始运行
export class YamlChangeHistory {
    app: App
    info: AfileYamlChangeInfo

    constructor(app: App, info: AfileYamlChangeInfo) {
        this.app = app
        this.info = info
    }

    async restore() {
        var md = new MDIO(this.app, this.info.path)
        switch (this.info.operation) {
            case "add": await md.delProperty(this.info.propertyName); break;
            case "del": await md.addProperty(this.info.propertyName, this.info.otherParam); break;
            case "updateName": await md.updatePropertyName(this.info.propertyName, this.info.otherParam); break;
            case "updateValue": await md.updatePropertyValue(this.info.propertyName, this.info.otherParam); break;
            default: break;
        }
    }
}

export interface AfileYamlChangeInfo {
    path: string
    operation: "add" | "del" | "updateName" | "updateValue"
    propertyName: string    // 现在的property名称
    otherParam?: string
}

// export var yamlChangeHistory = [
//     ["文档路径", "add", "propertyName"],
//     ["文档路径", "del", "propertyName"],
//     ["文档路径", "updateName", "propertyName", "oldName"],
//     ["文档路径", "updateValue", "propertyName", "oldValue"],
// ]
export var allYamlChangeHistory: Array<Array<YamlChangeHistory>> = new Array()
export var oneOperationYamlChangeHistory: Array<YamlChangeHistory> = new Array()


export class MDIO {
    app: App;
    path: string;
    tfile: TFile;

    constructor(app: App, path: string) {
        this.app = app;
        this.path = path;
    }
    // 方便的获取TFlie
    getTFile() {
        for (var file of this.app.vault.getMarkdownFiles()) {
            if (file.path == this.path) {
                return file;
            }
        }
    }
    // 方便的写入
    async write(content: string) {
        await this.app.vault.modify(this.getTFile(), content)
    }

    /**
     * ================================================================
     * yaml属性常用函数
     * ================================================================
     */

    /**
     * 判断当前文档是否含有yaml
     * @returns 
     */
    hasYaml() {
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache) {
            if (cache.hasOwnProperty("sections")) {
                if (cache["sections"][0]["type"] == "yaml") {
                    return true;
                }
            }
        }
        return false
    }

    /**
     * 获取yaml起始行号
     * ！！请在确保有yaml的情况下调用当前函数！！
     * @returns yaml起始行号
     */
    getYamlStartLine() {
        return this.app.metadataCache.getCache(this.path)["sections"][0]["position"]["start"]["line"];
    }

    /**
     * 获取frontmatter
     * ！！请在确保有yaml的情况下调用当前函数！！
     * @returns FrontMatterCache
     */
    getFrontmatter(): FrontMatterCache {
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("frontmatter")) {
            return cache["frontmatter"];
        }
        else {
            return { "position": { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } } }
        }
    }
    /**
     * 获得当前文档的所有属性名称
     * @returns nameList
     */
    getPropertiesName(): Array<string> {
        var nameList: Array<string> = new Array();
        if (this.hasYaml()) {
            for (var property in this.getFrontmatter()) {
                if (property != "position") {
                    nameList.push(property)
                }
            }
        }
        return nameList
    }

    hasProperty(property: string) {
        if (this.getPropertiesName().indexOf(property) != -1) {
            return true
        }
        return false
    }

    getPropertyValue(property: string) {
        var result = ""
        if (this.hasYaml()) {
            if (this.hasProperty(property)) {
                var value = this.getFrontmatter()[property]
                if (value instanceof Array) {
                    result = value.toString()
                }
                else {
                    result = String(value)
                }
            }
        }
        return result
    }

    /**
     * ================================================================
     * 此处是文档的最终操作函数区域
     *  每个函数执行操作前都需要判断当前文档是否有yaml
     *  1、添加属性 -> 无yaml新建/有yaml继续 -> 无属性/有属性判断是否存在该属性，不存在则添加
     *  2、删除属性 -> 无yaml退出/有yaml继续 -> 无属性则退出/有属性判断是否存在该属性且不为重要属性则删除
     *  3、修改属性名 -> 无yaml退出/有yaml继续 -> 无属性则退出/有属性判断是否存在该属性且不为重要属性则修改名称
     *  4、修改属性值 -> 无yaml退出/有yaml继续 -> 无属性则退出/有属性判断是否存在该属性且不为重要属性则修改值
     *  5、删除整个YAML -> 无yaml退出/有yaml继续
     * ================================================================
     */
    /**
     * 为当前文档添加属性
     * @param newProperty 
     * @param value 
     */
    async addProperty(newProperty: string, value = "") {
        if (this.hasYaml()) {
            // 检测当前文档是否不存在该属性，不存在则添加
            if (!this.hasProperty(newProperty)) {
                oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                    path: this.path,
                    operation: "add",
                    propertyName: newProperty
                }))
                var oldContent = await this.app.vault.read(this.getTFile())
                var oldContentList = oldContent.split("\n");

                // 添加新属性
                oldContentList.splice(this.getYamlStartLine() + 1, 0, `${newProperty}: '${value.replace(/'/g, '"')}'`)
                var newContent = "";
                for (var line of oldContentList) {
                    newContent = newContent + line + "\n";
                }

                // 写入
                await this.write(newContent)

            }
        }
        else {
            // 检测当前文档是否不存在该属性，不存在则添加
            oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                path: this.path,
                operation: "add",
                propertyName: newProperty
            }))
            this.app.vault.read(this.getTFile()).then(oldContent => {
                // 添加新属性
                var newContent = `---\n${newProperty}: '${value.replace(/'/g, '"')}'\n---\n` + oldContent;

                // 写入
                this.write(newContent)
            });
        }
    }
    // 为当前文档更新属性名
    async updatePropertyName(oldProperty: string, newProperty: string) {
        if (this.hasYaml()) {
            // 是否存在该属性？且新属性名是否不存在？
            if (this.hasProperty(oldProperty) && !this.hasProperty(newProperty)) {
                // 检测是否为禁止操作项？
                if (bannedProp.split("\n").indexOf(oldProperty) == -1) {   // 不是禁止操作项
                    var oldContent = await this.app.vault.read(this.getTFile())
                    if (oldContent.indexOf(`\n${oldProperty}: `)) {
                        var newContent = oldContent.replace(`\n${oldProperty}:`, `\n${newProperty}:`)
                    }
                    else {
                        var newContent = oldContent.replace(`\n${oldProperty}:`, `\n${newProperty}: `)
                    }

                    // 写入
                    await this.write(newContent)
                    oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                        path: this.path,
                        operation: "updateName",
                        propertyName: newProperty,
                        otherParam: oldProperty
                    }))
                }
            }
        }
    }

    // 表格更改属性值
    tableUpdateProperty(Property: string, newValue: string) {
        if (this.hasYaml()) {
            // 是否存在该属性？
            if (this.hasProperty(Property)) {
                oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                    path: this.path,
                    operation: "updateValue",
                    propertyName: Property,
                    otherParam: this.getPropertyValue(Property)
                }))
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    // 找到Property的行号
                    var oldContentList = oldContent.split("\n");
                    var lineNo = 0;
                    var startLine = 0;
                    var endLine = 0;
                    for (var line of oldContentList) {
                        lineNo = lineNo + 1;	// 起始行行数为1，第二行就是2
                        // 第一次出现Property后开始进行操作，在这一行后面添加新行以输入属性和其值
                        if (line.startsWith(Property + ":") && !startLine) {
                            startLine = lineNo
                        }
                        else if ((line.search(/^.*?:/g) != -1 || line.search('---') != -1) && startLine) {
                            endLine = lineNo
                            break;
                        }
                    }

                    // 修改属性值
                    oldContentList.splice(startLine - 1, endLine - startLine, `${Property}: '${newValue.replace(/'/g, '"')}'`)
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
    // 为当前文档更新属性值
    async updatePropertyValue(Property: string, newValue: string) {
        if (this.hasYaml()) {
            // 是否存在该属性？
            if (this.hasProperty(Property)) {
                // 检测是否为禁止操作项？
                if (bannedProp.split("\n").indexOf(Property) == -1) {   // 不是禁止操作项
                    oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                        path: this.path,
                        operation: "updateValue",
                        propertyName: Property,
                        otherParam: this.getPropertyValue(Property)
                    }))
                    var oldContent = await this.app.vault.read(this.getTFile())
                    // 找到Property的行号
                    var oldContentList = oldContent.split("\n");
                    var lineNo = 0;
                    var startLine = 0;
                    var endLine = 0;
                    for (var line of oldContentList) {
                        lineNo = lineNo + 1;	// 起始行行数为1，第二行就是2
                        // 第一次出现Property后开始进行操作，在这一行后面添加新行以输入属性和其值
                        if (line.startsWith(Property + ":") && !startLine) {
                            startLine = lineNo
                        }
                        else if ((line.search(/^.*?:/g) != -1 || line.search('---') != -1) && startLine) {
                            endLine = lineNo
                            break;
                        }
                    }

                    // 修改属性值
                    oldContentList.splice(startLine - 1, endLine - startLine, `${Property}: '${newValue.replace(/'/g, '"')}'`)
                    var newContent = "";
                    for (var line of oldContentList) {
                        newContent = newContent + line + "\n";
                    }

                    // 写入
                    await this.write(newContent)
                }
            }
        }
    }
    // 删除当前文档中的某个属性
    async delProperty(delProperty: string) {
        if (this.hasYaml()) {
            // 是否存在该属性？
            if (this.hasProperty(delProperty)) {
                // 检测是否为禁止操作项？
                if (bannedProp.split("\n").indexOf(delProperty) == -1) {   // 不是禁止操作项
                    oneOperationYamlChangeHistory.push(new YamlChangeHistory(this.app, {
                        path: this.path,
                        operation: "del",
                        propertyName: delProperty,
                        otherParam: this.getPropertyValue(delProperty)
                    }))
                    var oldContent = await this.app.vault.read(this.getTFile())
                    // 找到delProperty的行号
                    var oldContentList = oldContent.split("\n");
                    var lineNo = 0;
                    var startLine = 0;
                    var endLine = 0;
                    for (var line of oldContentList) {
                        lineNo = lineNo + 1;	// 起始行行数为1，第二行就是2
                        // 第一次出现Property后开始进行操作，在这一行后面添加新行以输入属性和其值
                        if (line.startsWith(delProperty + ":") && !startLine) {
                            startLine = lineNo
                        }
                        else if ((line.search(/^.*?:/g) != -1 || line.search('---') != -1) && startLine) {
                            endLine = lineNo
                            break;
                        }
                    }

                    // 删除该属性
                    oldContentList.splice(startLine - 1, endLine - startLine);
                    var newContent = "";
                    for (var line of oldContentList) {
                        newContent = newContent + line + "\n";
                    }

                    // 写入
                    await this.write(newContent)
                }
            }
        }
    }
    // 危！！删除当前文档的整个yaml
    delTheWholeYaml() {
        if (this.hasYaml()) {
            var canBeDeleted = true
            for (var propertyName of this.getPropertiesName()) {
                if (bannedProp.split("\n").indexOf(propertyName) != -1) {
                    canBeDeleted = false
                    console.log(`${this.path} 中包含禁止删除和修改的属性:${propertyName}, 所以无法对当前文档进行删除整个YAML的操作。`)
                    break;
                }
            }
            // 如果不包含重要属性就可以删除
            if (canBeDeleted) {
                var cache = this.app.metadataCache.getCache(this.path)
                var startLine = cache["sections"][0]["position"]["start"]["line"];
                var endLine = cache["sections"][0]["position"]["end"]["line"];
                this.app.vault.read(this.getTFile()).then(oldContent => {
                    // 找到delProperty的行号
                    var oldContentList = oldContent.split("\n");
                    // 删除该属性
                    oldContentList.splice(startLine, endLine - startLine + 1);
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
    // 清除值为空的属性
    clearEmptyProps() {
        if (this.hasYaml()) {
            for (var propertyName of this.getPropertiesName()) {
                if (!this.getPropertyValue(propertyName)) {
                    // 空值属性
                    this.delProperty(propertyName)  // 删除函数会检测是否为重要属性
                }
            }
            // 清除完空值属性后若当前文档中没有属性，则会删除yaml
            setTimeout(() => {
                if (!this.getPropertiesName().length) {
                    this.delTheWholeYaml()
                }
            }, 100)
        }
    }
    /**
     * ================================================================
     * tag常用函数
     * ================================================================
     */

    /**
     * 当前文档是否含有标签xx
     * @param TagName 前面不要加#号
     * @returns 
     */
    hasTag(TagName: string) {
        if (this.getTagsName().indexOf(TagName) != -1) {
            return true
        }
        return false
    }

    getTagsName(): Array<string> {
        var nameList = new Array();
        var cache = this.app.metadataCache.getCache(this.path);
        if (cache.hasOwnProperty("tags")) {
            for (var item of cache["tags"]) {
                var tag = item.tag.replace("#", "")
                if (nameList.indexOf(tag) == -1) {
                    nameList.push(tag)
                }
            }
        }
        // 获取yaml中的tags、tag
        var tags = ""
        if (this.hasProperty("tags")) {
            tags = this.getPropertyValue("tags").replace(/\s/g, "")
        }
        else if (this.hasProperty("tag")) {
            tags = this.getPropertyValue("tag").replace(/\s/g, "")
        }
        if (tags) {
            for (var tag of tags.split(',')) {
                if (nameList.indexOf(tag) == -1) {
                    nameList.push(tag)
                }
            }
        }
        return nameList
    }

}


export class Search {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    getAllTagsName(): Array<string> {
        var nameList = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            // 如果不是忽略文件夹下的文件就可以继续
            if (!this.isBannedFolder(file.path)) {
                for (var TagName of new MDIO(this.app, file.path).getTagsName()) {
                    if (nameList.indexOf(TagName) == -1) {
                        nameList.push(TagName)
                    }
                }
            }
        }
        return nameList
    }

    getAllYamlPropertiesName(): Array<string> {
        var yamlPropertiesName = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            // 如果不是忽略文件夹下的文件就可以继续
            if (!this.isBannedFolder(file.path)) {
                for (var propertyName of new MDIO(this.app, file.path).getPropertiesName()) {
                    if (yamlPropertiesName.indexOf(propertyName) == -1) {
                        yamlPropertiesName.push(propertyName)
                    }
                }
            }
        }
        return yamlPropertiesName
    }

    getAllFoldersPath(): Array<string> {
        var folders = new Array()
        this.app.vault.getAllLoadedFiles().map((file) => {
            if (file.hasOwnProperty("children")) {
                folders.push(file.path)
            }
        })
        return folders
    }

    /**
     * 指定文件夹下的文档（一级目录）
     * @param conditions 
     * @returns 
     */
    getTAbstractFilesOfAFolder(folderPath: string): Array<TAbstractFile> {
        // 不存在则不返回任何文件并进行提示
        const folder = this.app.vault.getAbstractFileByPath(folderPath)
        if (!folder || !folder.hasOwnProperty("children")) {
            new Notice(`${t("isAWrongFolderPath")}: ${folderPath}`)
            return null
        }
        var childMD = new Array()
        folder["children"].map((child: TAbstractFile) => {
            if (child.hasOwnProperty("extension")) {
                if (child["extension"] == "md") {
                    childMD.push(child)
                }
            }
        })
        return childMD
    }

    getYamlPropertiesNameOfFiles(tflies: Array<TAbstractFile>): Array<string> {
        var yamlPropertiesName = new Array();
        for (var file of tflies) {
            for (var propertyName of new MDIO(this.app, file.path).getPropertiesName()) {
                if (yamlPropertiesName.indexOf(propertyName) == -1) {
                    yamlPropertiesName.push(propertyName)
                }
            }
        }
        return yamlPropertiesName
    }

    getYamlPropertiesNameOfAFolder(folderPath: string): Array<string> {
        return this.getYamlPropertiesNameOfFiles(this.getTAbstractFilesOfAFolder(folderPath))
    }

    getAllValuesOfAProperty(property: string): Array<string> {
        var valuesList = new Array();
        for (var file of this.app.vault.getMarkdownFiles()) {
            // 如果不是忽略文件夹下的文件就可以继续
            if (!this.isBannedFolder(file.path)) {
                var md = new MDIO(this.app, file.path)
                if (valuesList.indexOf(md.getPropertyValue(property)) == -1) {
                    valuesList.push(md.getPropertyValue(property))
                }
            }
        }
        return valuesList
    }

    /**
     * 检测是否为忽略文件夹下的文件
     * @param path 
     * @returns 
     */
    isBannedFolder(path: string) {
        if (bannedFolder) {
            for (var folder of bannedFolder.split('\n')) {
                if (path.startsWith(folder)) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * 获取所有的文件
     */
    getAllFilesPathList(): Array<string> {
        var filesList = new Array()
        for (var file of this.app.vault.getMarkdownFiles()) {
            filesList.push(file.path)
        }
        return filesList
    }
    /**
     * 获取所有的文件夹路径
     */
    getAllFoldersPathList(): Array<string> {
        var foldersList = new Array()
        for (var file of this.app.vault.getAllLoadedFiles()) {
            if (!file.hasOwnProperty("extension")) {
                foldersList.push(file.path)
            }
        }
        return foldersList
    }
}

