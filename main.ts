import { Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { App } from 'obsidian-typings';

// Remember to rename these classes and interfaces!

enum CaseStatus {
	Lower,
	Sentence,
	Capital,
	Upper,
	Other
}

interface QuickAddCommandSettings {
	id: string,
	name: string,
	icon?: string,
	display?: string
}
interface FolderSettings {
	path: string,
	commands: QuickAddCommandSettings[]
}

interface FileSettings {
	path?: string,
	commands: QuickAddCommandSettings[]
}

interface FileExplorerQuickAddCommansPluginSettings {
	folders?: FolderSettings[],
	files?: FileSettings[]
}

const DEFAULT_SETTINGS: FileExplorerQuickAddCommansPluginSettings = {
	folders: [
		{
			path: '01-Projects',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					icon: 'folder-plus',
					display: 'Nuevo projecto...'
				}
			]
		},
		{
			path: '02-Areas',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					icon: 'folder-plus',
					display: 'Nueva area...'
				}
			]
		},
		{
			path: '03-Resources',
			commands: [
				{
					id: 'quickadd:choice:baf2d79c-ca7e-488f-852c-300935b32565',
					name: 'New PARA',
					icon: 'folder-plus',
					display: 'Nuevo recurso...'
				}
			]
		}
	],
	files: [
		{
			commands: [
				{
					id: '',
					name: 'Rename',
					//icon: 'folder-plus',
					display: 'Renombrar archivo'
				}
			]
		}
	]
}

export default class FileExplorerQuickAddCommansPlugin extends Plugin {
	settings: FileExplorerQuickAddCommansPluginSettings;
	protected quickAddAPI: any;

	protected quickAdd() {
		if (this.quickAddAPI == null) this.quickAddAPI = this.app.plugins.getPlugin('quickadd').api;

		return this.quickAddAPI;
	}

	async onload() {
		this.app.workspace.onLayoutReady( async () => {
				if (this.quickAdd() == null) {
					new Notice('El plugin Quick Add debe estar instalado y habilitado');
					this.unload();
					return;
				}

				await this.loadSettings();

				if (this.settings.folders != null && this.settings.folders.length > 0
					|| this.settings.folders != null && this.settings.folders.length > 0) {

					this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source) => {
						if (file instanceof TFolder && this.settings.folders != null && this.settings.folders.length > 0) { 
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
												menu.addSeparator()
													.addItem((item) => {
													item
														.setTitle(command.display != null ? command.display : command.name)
														.setIcon(command.icon != null ? command.icon : '')
														.onClick(async () => this.executeQuickAddChoice(command, {path: file.path}));
													});
											})
									})
						} else if (file instanceof TFile && this.settings.files != null && this.settings.files.length > 0) {
							this.settings.files!.filter((fileSettings: FileSettings, i: number, array: FileSettings[]) => {
								let path = fileSettings.path;
								let starCount = 0;
								let folderLevels;
								let fileLevels;
								let result = true;
								
								if (path != null) {
									while (path != null && path.endsWith('/*')) {
										starCount++;
										path = path.slice(0, -2);
									}

									folderLevels =  path.split('/').length;
									fileLevels = file.path!.split('/').length - starCount

									result = file.path!.startsWith(path) && fileLevels === folderLevels
								}

								return result;
							}).forEach((fileSettings: FileSettings, i: number, array: FileSettings[]) => {
								fileSettings.commands.forEach((command: QuickAddCommandSettings, i: number, array: QuickAddCommandSettings[]) => {
									menu.addSeparator()
										.addItem((item) => {
											item
												.setTitle(command.display != null ? command.display : command.name)
												.setIcon(command.icon != null ? command.icon : '')
												.onClick(async () => this.executeQuickAddChoice(command, {file: file}));
											});
									})
								})
						}
					}));
				}

				if (this.settings.files != null && this.settings.files.length > 0) {
					this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor, info) => {
						if (this.settings.files != null && this.settings.files.length > 0) {
							this.settings.files!.filter((fileSettings: FileSettings, i: number, array: FileSettings[]) => {
								let path = fileSettings.path;
								let file = info.file;
								let starCount = 0;
								let folderLevels;
								let fileLevels;
								let result = true;
								
								if (path != null && file != null) {
									while (path != null && path.endsWith('/*')) {
										starCount++;
										path = path.slice(0, -2);
									}

									folderLevels =  path.split('/').length;
									fileLevels = file.path!.split('/').length - starCount

									result = file.path!.startsWith(path) && fileLevels === folderLevels
								}

								return (result && file != null);
							}).forEach((fileSettings: FileSettings, i: number, array: FileSettings[]) => {
								fileSettings.commands.forEach((command: QuickAddCommandSettings, i: number, array: QuickAddCommandSettings[]) => {
									menu.addSeparator()
										.addItem((item) => {
											item
												.setTitle(command.display != null ? command.display : command.name)
												.setIcon(command.icon != null ? command.icon : '')
												.onClick(async () => this.executeQuickAddChoice(command, {file: (info.file != null ? info.file : undefined)}));
											});
									})
								})
						}
					}))
				}

				this.addCommand({
					id: 'fe-qa-commands:toggle-case',
					name: 'Toggle Case',
					editorCallback: (editor: Editor, view: MarkdownView) => {
						if (!editor.somethingSelected()) return;
						const start = editor.getCursor('anchor');
						const end = editor.getCursor('head');

						editor.replaceSelection(this.toggleCase(editor.getSelection()));
						editor.setSelection(start, end);
					}
				});
			});
	}

	onunload() {
		console.log('Descargado');
	}

	async executeQuickAddChoice(commandSettings: QuickAddCommandSettings, data: { path?: string, file?: TFile}) {
		this.quickAdd().executeChoice(commandSettings.name, data);
	}

	protected toggleCase(text: string): string {
		return this.toggleCaseByStatus(this.getCaseStatus(text), text);
	}

	protected getCaseStatus(text: string): CaseStatus {
		const regexps = [
			/^(?=[a-záéíóúüñ])[a-záéíóúüñ\s]+$/gm, //lower case
			/^(?=[A-ZÁÉÍÓÚÜÑ])[A-Z]{1}[a-záéíóúüñ\s]+$/gm, //Sentece case
			/^(?=[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])([A-Z]{1}[a-záéíóúüñ\s]{1}[a-záéíóúüñ]*\s*)+$/gm, //Capital Case
			/^(?=[A-ZÁÉÍÓÚÜÑ])[A-ZÁÉÍÓÚÜÑ\s]+$/gm //UPPER CASE
		];
		let status = CaseStatus.Other;

		regexps.some((re, i, arr) => {
			if (re.test(text)) {
				status = i+1;
				return true;
			}

			return false;
		});

		console.log(status);
		return status;
	}

	protected toggleCaseByStatus(status: CaseStatus, text: string) : string {
		const togglers = [
			(text: string) => {
				return text[0].toUpperCase() + text.slice(1).toLowerCase();
			},
			(text: string) => {
				return text.split(/\s/)
					.map((word, i, arr) => {
						return word[0].toUpperCase() + word.slice(1).toLowerCase()
					}).join(' ');
			},
			(text: string) => {
				return text.toUpperCase();
			},
			(text: string) => {
				return text.toLowerCase();
			},
			(text: string) => {
				return text.toLowerCase();
			}
		]

		return togglers[status - 1](text);
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

/*class SampleSettingTab extends PluginSettingTab {
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
}*/
