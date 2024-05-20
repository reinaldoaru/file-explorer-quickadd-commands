import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface QuickAddCommandSettings {
	id: string,
	name: string,
	display?: string
}
interface FolderSettings {
	path: string,
	commands: QuickAddCommandSettings[]
}

interface FileExplorerQuickAddCommansPluginSettings {
	folders?: FolderSettings[];
}

const DEFAULT_SETTINGS: FileExplorerQuickAddCommansPluginSettings = {
	folders: [
		{
			path: '01-Projects',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					display: 'Crear nuevo projecto...'
				}
			]
		},
		{
			path: '02-Areas',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					display: 'Crear nueva area...'
				}
			]
		},
		{
			path: '03-Resources',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					display: 'Crear nuevo recurso...'
				}
			]
		}
	]
}

export default class FileExplorerQuickAddCommansPlugin extends Plugin {
	settings: FileExplorerQuickAddCommansPluginSettings;
	protected quickAddAPI: any;

	protected quickAdd() {
		if (this.quickAddAPI == null) this.quickAddAPI = this.app.plugins.plugins["quickadd"].api;

		return this.quickAddAPI;
	}

	async onload() {
		this.app.workspace.onLayoutReady( async () => {
				if (this.app.plugins.plugins["quickadd"] == null) {
					new Notice('El plugin Quick Add debe estar instalado y habilitado');
					this.unload();
					return;
				}

				await this.loadSettings();

				this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source) => {
					if (this.settings.folders != null && this.settings.folders.length > 0) {
						if (file instanceof TFolder) { 
							this.settings.folders!.filter((folder: FolderSettings, i: number, array: FolderSettings[]) => {
									let path = folder.path;
									let starCount = 0;
									let folderLevels;
									let fileLevels;

									while (path.endsWith('/*')) {
										starCount++;
										path = path.slice(0, -2);
									}

									folderLevels = path.split('/').length;
									fileLevels = file.path.split('/').length - starCount

									return (file.path.startsWith(path) && fileLevels === folderLevels);
									
								}).forEach((folder: FolderSettings, i: number, array: FolderSettings[]) => {
										folder.commands.forEach((command: QuickAddCommandSettings, i: number, array: QuickAddCommandSettings[]) => {
												menu.addItem((item) => {
													item
														.setTitle(command.display != null ? command.display : command.name)
														//.setIcon("folder-plus")
														.onClick(async () => this.quickAdd().executeChoice(command.name, {path: file.path}));
													});
											})
									})
						} else if (file instanceof TFile) {

						}
					}
				}));
			});
	}

	onunload() {
		console.log('Descargado');
	}

	async loadSettings() {
		let settingsData = JSON.stringify(this.loadData());

		if (settingsData == null || settingsData === '{}') {
			settingsData = JSON.stringify(DEFAULT_SETTINGS);
		}

		this.settings = JSON.parse(settingsData);

		console.log(JSON.stringify(this.settings));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
