import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MainModal } from "src/modal";

// 定义插件里需要保存、用到的变量
interface MyPluginSettings {
	importantProp: string;
}

// 定义 DEFAULT_SETTINGS 并使用接口设置（DEFAULT_SETTINGS会在后边的插件主功能中的“loadSettings”（加载设置）中用到）
const DEFAULT_SETTINGS: MyPluginSettings = {
	importantProp: ''
}


// 插件主功能设置！！
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	// 异步：加载插件
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
	}

	// 卸载插件
	onunload() {

	}
	
	// 异步：加载设置
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		settingStr = this.settings.importantProp;
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

		
		containerEl.createEl("div", {text: '请做好备份！！使用此插件造成的任何数据损失本人概不负责。'});

		// 新建一个设置选项
		new Setting(containerEl)
			.setName('禁止删除和修改的属性名称')
			.setDesc('多个属性之间请以英文半角逗号`,`分隔')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.importantProp)
				.onChange(async (value) => {
					this.plugin.settings.importantProp = value;
					settingStr = this.plugin.settings.importantProp
					await this.plugin.saveSettings();
				}));
	}
}

// 暴露
export var settingStr: string