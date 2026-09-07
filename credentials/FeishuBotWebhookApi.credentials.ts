import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class FeishuBotWebhookApi implements ICredentialType {
	name = 'feishuBotWebhookApi';
	displayName = 'Feishu Bot Webhook API';
	// @ts-ignore
	icon = 'file:icon.png';
	properties: INodeProperties[] = [
		{
			displayName: 'Webhook URL',
			name: 'webhookUrl',
			type: 'string',
			default: '',
			required: true,
			description: '飞书群自定义机器人的 Webhook 地址。',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: '启用签名校验时填写；未启用签名校验可留空。',
		},
	];
}
