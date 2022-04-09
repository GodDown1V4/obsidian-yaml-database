import {
  Plugin,
  MarkdownPostProcessorContext,
} from 'obsidian'
import React from 'react'
import TableView from 'views/TableView'
import t from 'i18n'
import ReactDOM from 'react-dom'
import { yamlCodeblockJson } from 'yaml/parse'
import { allYamlChangeHistory } from 'yaml/md'
export default class AgtablePlugin extends Plugin {
  async onload(): Promise<void> {
    // console.log(`${t('welcome')}`)

    // 命令：撤销
    //  撤销上一步操作
    this.addCommand({
      id: 'yaml-bulk-edit-cancel',
      name: t("restore"),
      callback: () => {
        if (allYamlChangeHistory.length > 0) {
          for (var item of allYamlChangeHistory.pop()) {
            item.restore()
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
      (
        source: string,
        el: HTMLElement,
        context: MarkdownPostProcessorContext
      ) => {
        if (source) {
          const sourceJson: yamlCodeblockJson = JSON.parse(source)
          const tableString = source
          // 有id值才会渲染
          if (sourceJson.id) {
            const tableId = sourceJson.id
            // console.log("开始渲染表格");

            const view = React.createElement(TableView, {
              app: this.app,
              tableId,
              tableString
            })
            ReactDOM.render(view, el)
          }
        }
        else {
          el.createDiv().innerHTML = '请按照下列形式为代码块添加id (一定要使用双引号！！): <br><blockquote>```yamledit<br>{<br>  "id":"在这里填写一个在当前页面所有的yamledit代码块中独一无二id值"<br>}<br>```</blockquote>'
        }
      }
    )
  }


  async onunload(): Promise<void> {
    // document.getElementById('table-menu-container').remove()
  }
}
