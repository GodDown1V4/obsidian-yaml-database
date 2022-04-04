import { Table } from 'src/table';
import { App, MarkdownPostProcessorContext, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MainModal } from "src/modal";
import { allYamlChangeHistory } from 'src/md';

// 定义插件里需要保存、用到的变量
interface MyPluginSettings {
	importantProp: string;
	hiddenPropInTable: string;
	bannedFolder: string;
}

// 定义 DEFAULT_SETTINGS 并使用接口设置（DEFAULT_SETTINGS会在后边的插件主功能中的“loadSettings”（加载设置）中用到）
const DEFAULT_SETTINGS: MyPluginSettings = {
	importantProp: '',
	hiddenPropInTable: '',
	bannedFolder: '',
}


// 插件主功能设置！！
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	// 异步：加载 插件
	async onload() {

		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));
		

		// 命令：打开操作面板
		this.addCommand({
			id: 'yaml-bulk-edit-modal-open',
			name: '打开操作面板',
			callback: () => {
				new MainModal(this.app).open();
			}
		});
		// 命令：撤销
		//  撤销上一步操作
		this.addCommand({
			id: 'yaml-bulk-edit-cancel',
			name: '还原上一步操作',
			callback: () => {
				if (allYamlChangeHistory.length>0){
					for (var item of allYamlChangeHistory.pop()) {
						item.restore()
					}
					// 清理以使其只保持50条操作记录
					while (allYamlChangeHistory.length>50) {
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
				var hasID = false
				for (var line of source.split('\n')) {
					// 有id值才会渲染
					if (line.startsWith("id:") && line.replace("id:", "")) {
						new Table(this.app, source, el, context);
						hasID = true
						break;
					}
				}
				if (!hasID) {
					el.createDiv().innerHTML = "请按照下列形式为代码块添加id: <br><blockquote>```yamledit<br>id:在这里填写一个在当前页面所有的yamledit代码块中独一无二id值<br>```</blockquote>"
				}
			}
		)
	}

	// 卸载插件
	onunload() {

	}
	
	// 异步：加载设置
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		bannedProp = this.settings.importantProp;
		hiddenPropInTable = this.settings.hiddenPropInTable;
		bannedFolder = this.settings.bannedFolder;
	}

	// 异步：保存设置
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// 插件设置页面
class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// 新建一个h2元素当标题
		containerEl.createEl('h2', {text: 'Yaml批量修改'});
		
		containerEl.createEl("a", {text: "帮助文档见Github", attr: {"href": "https://github.com/1657744680/obsidian-yaml-bulk-edit"}})
		containerEl.createEl("div", {text: '由于涉及到对文档进行批量操作，所以请一定做好备份！！使用此插件造成的任何数据损失本人概不负责。'});
		containerEl.createEl("div", {text: '目前仅支持对yaml中单行的属性进行操作。'});

		containerEl.createEl('h3', {text: '批量修改设置'});

		// 新建一个设置选项
		new Setting(containerEl)
			.setName('禁止删除和修改的属性名称')
			.setDesc('一个属性占一行, 添加新的参数就换一行。（注意: 批量编辑中禁止操作的属性若未在表格中被禁止, 则依然可以在表格中进行编辑）（不要写多余的空格）')
			.addTextArea(text => text
				.setPlaceholder('请输入')
				.setValue(this.plugin.settings.importantProp)
				.onChange(async (value) => {
					this.plugin.settings.importantProp = value;
					bannedProp = this.plugin.settings.importantProp
					await this.plugin.saveSettings();
				}));

		
		// 新建一个设置选项
		new Setting(containerEl)
			.setName('忽略的文件或文件夹路径')
			.setDesc('一个路径占一行, 添加新的参数就换一行。（注意: 路径开头不要加`/`。 例如: `资源/电影` 而不是 `/资源/电影`。）（不要写多余的空格）')
			.addTextArea(text => text
				.setPlaceholder('请输入')
				.setValue(this.plugin.settings.bannedFolder)
				.onChange(async (value) => {
					this.plugin.settings.bannedFolder = value;
					bannedFolder = this.plugin.settings.bannedFolder
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', {text: '表格编辑设置'});
		
		new Setting(containerEl)
			.setName('隐藏的属性名称')
			.setDesc('一个属性占一行, 添加新的参数就换一行。（注意: 如果您在yamledit中仍然选择显示某个被隐藏的属性的话, 那么该属性会被显示）（不要写多余的空格）')
			.addTextArea(text => text
				
				.setPlaceholder('请输入')
				.setValue(this.plugin.settings.hiddenPropInTable)
				.onChange(async (value) => {
					this.plugin.settings.hiddenPropInTable = value;
					hiddenPropInTable = this.plugin.settings.hiddenPropInTable
					await this.plugin.saveSettings();
				}));
	}
}


// 暴露
export var bannedProp: string
export var bannedFolder: string
export var hiddenPropInTable: string