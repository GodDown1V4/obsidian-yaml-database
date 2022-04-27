import {
  Plugin,
  MarkdownPostProcessorContext,
  PluginSettingTab,
  App,
  Setting,
  Modal,
  ButtonComponent,
  TFile,
  Notice,
  Editor,
} from 'obsidian'
import React from 'react'
import TableView from 'views/TableView'
import t from 'i18n'
import ReactDOM from 'react-dom'
import { dbconfig } from 'yaml/parse'
import { allYamlChangeHistory, Search } from 'yaml/md'


export interface pluginSettings {
  databases: Array<dbconfig>
  DBdataJsonLocation: "pluginFolder" | "vaultFolder"
  DBdataJsonFolderPath: string
}
const DEFAULT_SETTINGS: pluginSettings = {
  databases: [],
  DBdataJsonLocation: "pluginFolder",
  DBdataJsonFolderPath: "/",
}

const DEFAULT_SETTINGS_VAULT: pluginSettings = {
  databases: [],
  DBdataJsonLocation: "vaultFolder",
  DBdataJsonFolderPath: "/",
}


export default class YamlDatabasePlugin extends Plugin {
  settings: pluginSettings

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new SettingTab(this.app, this));

    // 命令：还原上一步操作
    this.addCommand({
      id: 'yaml-bulk-edit-cancel',
      name: t("restore"),
      callback: async () => {
        // console.log(allYamlChangeHistory);

        if (allYamlChangeHistory.length > 0) {
          for (var item of allYamlChangeHistory.pop()) {
            await item.restore()
          }
          // 清理以使其只保持50条操作记录
          while (allYamlChangeHistory.length > 50) {
            allYamlChangeHistory.shift()
          }
        }
      }
    });

    this.addCommand({
      id: 'yaml-bulk-edit-created-table',
      name: t("createTable"),
      editorCallback: async (editor: Editor) => {
        const tableString = `\`\`\`yamledit\n${t("autoCreate")} ${app.workspace.getActiveFile().path} ${new Date().toLocaleString()}\n\`\`\``
        // console.log(tableString)
        editor.replaceRange(tableString, editor.getCursor())
      },
    });

    this.registerMarkdownCodeBlockProcessor(
      'yamledit',
      async (
        source: string,
        el: HTMLElement,
        context: MarkdownPostProcessorContext,
      ) => {
        if (source) {
          // 默认DB设置
          // data.json中没有该DB的话向data.json中添加默认格式的DB
          if (this.settingsHasDB(source) == -1) {
            const yamlCodeblockJson: dbconfig = {
              id: source,
              colDef: [{
                colId: "yamleditFirstFileColumn",
                field: "yamleditFirstFileColumn",
                headerName: t("yamleditFirstFileColumn"),
                type: "inLink",
                width: 200,
                hide: false,
              }],
              folder: "/",
              paginationSize: 50,
              filterModal: {},
              templatePath: ""
            }
            await this.saveDB2Settings(yamlCodeblockJson)
          }
          else {
            const DBconfig = await this.getDBbyID(source)
            const view = React.createElement(TableView, {
              databaseID: source,
              plugin: this,
              paginationSize: DBconfig.paginationSize
            })
            ReactDOM.render(view, el)
          }
        }
        else {
          el.createDiv().innerHTML = '请在代码块中输入一个独一无二的ID值'
        }
      }
    )
  }

  /**
   * 判断当前设置中是否包含该数据库ID
   * @param id 
   * @returns 找到返回索引，未找到返回-1
   */
  settingsHasDB(id: string): number {
    for (var i = 0; i < this.settings.databases.length; i++) {
      if (this.settings.databases[i].id.replace(/\s/g, "") == id.replace(/\s/g, "")) {
        return i
      }
    }
    return -1
  }

  async getDBbyID(id: string) {
    await this.loadSettings()
    return this.settings.databases[this.settingsHasDB(id)]
  }

  async saveDB2Settings(yamlCodeblockJson: dbconfig) {
    if (this.settingsHasDB(yamlCodeblockJson.id) != -1) {
      yamlCodeblockJson.id = yamlCodeblockJson.id.replace(/\s/g, "")
      this.settings.databases[this.settingsHasDB(yamlCodeblockJson.id)] = yamlCodeblockJson
    }
    else if (yamlCodeblockJson.id) {
      this.settings.databases.push(yamlCodeblockJson)
    }
    await this.saveSettings()
  }

  // 异步：加载设置
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const datajsonlocation = this.settings.DBdataJsonLocation
    const datajsonFolderPath = this.settings.DBdataJsonFolderPath
    // 判断datajson的位置
    switch (this.settings.DBdataJsonLocation) {
      case "vaultFolder": {
        const folderPath = this.settings.DBdataJsonFolderPath
        const file = app.vault.getAbstractFileByPath((folderPath.endsWith("/") ? "" : folderPath + "/") + "YAML Database Config.json")
        if (file) {
          // 有的话就读取库中的文件，否则不操作，即读取插件文件夹中的文件
          if (file instanceof TFile) this.settings = Object.assign({}, DEFAULT_SETTINGS_VAULT, JSON.parse(await app.vault.read(file)));
          // databases以外的信息以插件文件夹中的datajson为准
          this.settings.DBdataJsonFolderPath = datajsonlocation
          this.settings.DBdataJsonFolderPath = datajsonFolderPath
        }
        else {

        }
      } break;
      default: break;
    }
  }

  // 异步：保存设置
  async saveSettings() {
    await this.saveData(this.settings);
    // 判断datajson的位置
    switch (this.settings.DBdataJsonLocation) {
      case "vaultFolder": {
        // 存储表格信息到库中的datajson
        const folderPath = this.settings.DBdataJsonFolderPath
        const file = app.vault.getAbstractFileByPath((folderPath.endsWith("/") ? "" : folderPath + "/") + "YAML Database Config.json")
        if (file) {
          if (file instanceof TFile) app.vault.modify(file, JSON.stringify(this.settings))
        }
        else {
          app.vault.create((folderPath.endsWith("/") ? "" : folderPath + "/") + "YAML Database Config.json", JSON.stringify(this.settings))
        }
        // 存储其它设置信息到插件文件夹中的datajson
      } break;
      default: break;
    }

  }

}


// 插件设置页面
class SettingTab extends PluginSettingTab {
  plugin: YamlDatabasePlugin;
  DBinfoDiv: HTMLDivElement

  constructor(app: App, plugin: YamlDatabasePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;

    containerEl.empty();

    // 新建一个h2元素当标题
    containerEl.createEl('h2', { text: 'YAML Database' });
    containerEl.createEl("br")
    containerEl.createEl("a", { text: "Github", attr: { "href": "https://github.com/1657744680/obsidian-yaml-database" } })
    containerEl.createEl("hr")

    const DataJsonSetting = containerEl.createDiv()
    this.dataJsonSetting(DataJsonSetting);
    containerEl.createEl("hr")

    containerEl.createEl('strong', { text: t("settingsIntro") });
    containerEl.createEl("hr")

    this.DBinfoDiv = containerEl.createDiv()
    // 展示所有的Databases
    this.refreshDBinfo()
  }

  async dataJsonSetting(DataJsonSetting: HTMLDivElement) {
    DataJsonSetting.innerHTML = ""
    await this.plugin.loadSettings()

    new Setting(DataJsonSetting)
      .setName(t("DBlocationTitle"))
      .setDesc(t("DBlocationDes"))
      .addDropdown(dropdown => {
        dropdown.addOptions(
          {
            "pluginFolder": t("pluginFolder"),
            "vaultFolder": t("vaultFolder")
          }
        )
        dropdown.setValue(this.plugin.settings.DBdataJsonLocation)
        dropdown.onChange(async (value: "pluginFolder" | "vaultFolder") => {
          if (value != this.plugin.settings.DBdataJsonLocation) {
            this.plugin.settings.DBdataJsonLocation = value;
            await this.plugin.saveSettings()
            this.dataJsonSetting(DataJsonSetting)
          }
        })
      })
    // 搜索项
    switch (this.plugin.settings.DBdataJsonLocation) {
      case 'vaultFolder': {
        const folderInput = DataJsonSetting.createEl("input", {
          attr: {
            type: "text",
            class: 'filterInput',
            placeholder: t("plsSelectAFolder"),
            list: "datajsonfolderSearch",
            "value": this.plugin.settings.DBdataJsonFolderPath
          }
        })
        const folderInputDataList = DataJsonSetting.createEl("datalist", {
          attr: {
            id: "datajsonfolderSearch"
          }
        })
        new Search(this.app).getAllFoldersPath().map((folder) => {
          folderInputDataList.createEl("option", {
            attr: {
              value: folder
            }
          })
        })

        const folderConfirmButton = DataJsonSetting.createEl("button", {
          attr: {
            "style": "background-color: #CC3333;color:white"
          }
        })
        folderConfirmButton.toggleVisibility(false)
        const superThis = this
        folderInput.oninput = function () {
          if (new Search(superThis.app).getAllFoldersPath().indexOf(folderInput.value) != -1 && folderInput.value != superThis.plugin.settings.DBdataJsonFolderPath) {
            folderConfirmButton.toggleVisibility(true)
          }
          else folderConfirmButton.toggleVisibility(false)
        }

        folderConfirmButton.innerHTML = t("applyTheChanges")
        folderConfirmButton.onclick = async function () {
          if (new Search(superThis.app).getAllFoldersPath().indexOf(folderInput.value) != -1) {
            // 若原文件夹下有datajson文件则移动该文件至新文件夹下
            const folderPath = superThis.plugin.settings.DBdataJsonFolderPath
            const file = superThis.app.vault.getAbstractFileByPath((folderPath.endsWith("/") ? "" : folderPath + "/") + "YAML Database Config.json")
            if (file) {
              await superThis.app.fileManager.renameFile(file, (folderInput.value.endsWith("/") ? "" : folderInput.value + "/") + "YAML Database Config.json")
            }
            superThis.plugin.settings.DBdataJsonFolderPath = folderInput.value;
            await superThis.plugin.saveSettings()
            superThis.dataJsonSetting(DataJsonSetting)
          }
          else {
            new Notice(`${t("isAWrongFolderPath")}: ${folderInput.value}`)
          }
        }
      }; break;
      default: break;
    }
  }

  // 刷新并显示所有DB的信息
  async refreshDBinfo() {
    this.DBinfoDiv.innerHTML = ""
    await this.plugin.loadSettings()
    // 遍历设置settings.databases以获取重复的Folder
    var DBFolders = new Array()
    var repeatedDBFolders = new Array()
    this.plugin.settings.databases.map((db) => {
      if (!DBFolders.includes(db.folder)) {
        DBFolders.push(db.folder)
      }
      else {
        repeatedDBFolders.push(db.folder)
      }
    })

    this.plugin.settings.databases.map((db, index) => {
      new Setting(this.DBinfoDiv)
        // 当有多个DB管理相同文档时id前显示重复
        .setName(repeatedDBFolders.includes(db.folder) ? `(${t("DBsUseRepeatedFolders")}) Database id: ${db.id}` : `Database id: ${db.id}`)
        .setDesc(`Folder: ${db.folder}`)
        .addButton(button => {
          button.setIcon("trash")
          button.setTooltip(t("deleteThisDBConfig"))
          button.onClick(() => {
            new deleteDBconfirm(this, index, db.id).open()
          })
        })
    })
  }
}

// 删除确认面板
class deleteDBconfirm extends Modal {
  settingTab: SettingTab
  plugin: YamlDatabasePlugin
  index: number
  id: string

  constructor(settingTab: SettingTab, index: number, id: string) {
    super(settingTab.plugin.app)
    this.settingTab = settingTab
    this.plugin = settingTab.plugin
    this.index = index
    this.id = id
  }

  onOpen(): void {
    const title = this.titleEl
    title.setText(`ID: ${this.id}`)
    const { contentEl } = this;
    contentEl.createSpan().innerHTML = t("deleteDBConfirm")
    contentEl.createEl("hr")

    new ButtonComponent(contentEl)
      .setIcon("checkbox-glyph")
      .onClick(async () => {
        const no = this.plugin.settingsHasDB(this.id)
        if (no == this.index) {
          this.plugin.settings.databases.splice(this.index, 1)
          await this.plugin.saveSettings()
          this.close()
        }
      })
  }

  onClose(): void {
    this.settingTab.refreshDBinfo()
  }
}