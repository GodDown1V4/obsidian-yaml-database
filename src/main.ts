import {
  Plugin,
  MarkdownPostProcessorContext,
  PluginSettingTab,
  App,
  Setting,
  Modal,
  ButtonComponent,
} from 'obsidian'
import React from 'react'
import TableView from 'views/TableView'
import t from 'i18n'
import ReactDOM from 'react-dom'
import { dbconfig } from 'yaml/parse'
import { allYamlChangeHistory } from 'yaml/md'


export interface pluginSettings {
  databases: Array<dbconfig>
}
const DEFAULT_SETTINGS: pluginSettings = {
  databases: []
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
  }

  // 异步：保存设置
  async saveSettings() {
    await this.saveData(this.settings);
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


    containerEl.createEl('strong', { text: t("settingsIntro") });

    this.DBinfoDiv = containerEl.createDiv()
    // 展示所有的Databases
    this.refreshDBinfo()
  }

  async refreshDBinfo() {
    this.DBinfoDiv.innerHTML = ""
    await this.plugin.loadSettings()
    this.plugin.settings.databases.map((db, index) => {
      new Setting(this.DBinfoDiv)
        .setName(`Database id: ${db.id}`)
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