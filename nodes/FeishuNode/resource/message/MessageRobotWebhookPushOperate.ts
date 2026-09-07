import { createHmac } from 'crypto';
import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

function getJsonObjectParameter(
	executeFunctions: IExecuteFunctions,
	propertyName: string,
	index: number,
): IDataObject {
	const value = executeFunctions.getNodeParameter(propertyName, index) as unknown;

	if (typeof value === 'string') {
		const text = value.trim();
		if (!text) {
			return {};
		}

		try {
			const parsed = JSON.parse(text) as unknown;
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
				return parsed as IDataObject;
			}
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`无法解析字段[${propertyName}] JSON 数据: ${error.message}`,
			);
		}
	} else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		return value as IDataObject;
	}

	throw new NodeOperationError(
		executeFunctions.getNode(),
		`字段[${propertyName}] 必须是 JSON 对象`,
	);
}

function createFeishuBotSign(timestamp: string, secret: string): string {
	const stringToSign = `${timestamp}\n${secret}`;
	return createHmac('sha256', stringToSign).update('').digest('base64');
}

function assertRobotCredentialSelected(executeFunctions: IExecuteFunctions) {
	const authentication = executeFunctions.getNodeParameter('authentication', 0) as string;
	if (authentication !== 'feishuBotWebhookApi') {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'请将“凭证类型”切换为“自定义机器人 Webhook 凭证”后再使用机器人推送',
		);
	}
}

const MessageRobotWebhookPushOperate: ResourceOperations = {
	name: '机器人推送',
	value: 'message:robotWebhookPush',
	options: [
		{
			displayName: '请求体模式',
			name: 'bodyMode',
			type: 'options',
			options: [
				{
					name: '按消息类型构建',
					value: 'message',
				},
				{
					name: '原始 JSON',
					value: 'raw',
				},
			],
			default: 'message',
		},
		{
			displayName: '消息类型',
			name: 'msg_type',
			type: 'options',
			// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
			options: [
				{ name: '文本', value: 'text' },
				{ name: '富文本', value: 'post' },
				{ name: '图片', value: 'image' },
				{ name: '群名片', value: 'share_chat' },
				{ name: '卡片', value: 'interactive' },
			],
			required: true,
			default: 'text',
			displayOptions: {
				show: {
					bodyMode: ['message'],
				},
			},
		},
		{
			displayName: '消息内容',
			name: 'content',
			type: 'json',
			default: '{"text":"消息内容"}',
			description: '对应飞书自定义机器人请求体中的 content 字段。',
			required: true,
			displayOptions: {
				show: {
					bodyMode: ['message'],
					msg_type: ['text', 'post', 'image', 'share_chat'],
				},
			},
		},
		{
			displayName: '卡片内容',
			name: 'card',
			type: 'json',
			default:
				'{"elements":[{"tag":"div","text":{"content":"消息内容","tag":"plain_text"}}],"header":{"template":"blue","title":{"content":"标题","tag":"plain_text"}}}',
			description: '对应飞书自定义机器人请求体中的 card 字段。',
			required: true,
			displayOptions: {
				show: {
					bodyMode: ['message'],
					msg_type: ['interactive'],
				},
			},
		},
		{
			displayName: '完整请求体',
			name: 'body',
			type: 'json',
			default: '{"msg_type":"text","content":{"text":"消息内容"}}',
			description: '完整的飞书自定义机器人请求体。启用签名校验时会自动补充 timestamp 和 sign。',
			required: true,
			displayOptions: {
				show: {
					bodyMode: ['raw'],
				},
			},
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		assertRobotCredentialSelected(this);

		const credentials = await this.getCredentials('feishuBotWebhookApi');
		const webhookUrl = (credentials.webhookUrl as string).trim();
		const secret = ((credentials.secret as string | undefined) || '').trim();
		const bodyMode = this.getNodeParameter('bodyMode', index) as string;

		if (!webhookUrl) {
			throw new NodeOperationError(this.getNode(), 'Webhook URL 不能为空');
		}

		let body: IDataObject;
		if (bodyMode === 'raw') {
			body = getJsonObjectParameter(this, 'body', index);
		} else {
			const msgType = this.getNodeParameter('msg_type', index) as string;
			body = {
				msg_type: msgType,
			};

			if (msgType === 'interactive') {
				body.card = getJsonObjectParameter(this, 'card', index);
			} else {
				body.content = getJsonObjectParameter(this, 'content', index);
			}
		}

		if (secret) {
			const timestamp = Math.floor(Date.now() / 1000).toString();
			body.timestamp = timestamp;
			body.sign = createFeishuBotSign(timestamp, secret);
		}

		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: webhookUrl,
			body,
			json: true,
		})) as IDataObject;

		const code = response.code ?? response.StatusCode;
		if (code !== undefined && code !== 0) {
			const message = response.msg ?? response.StatusMessage ?? 'Unknown Error';
			throw new NodeOperationError(this.getNode(), `Request Error: ${code}, ${message}`);
		}

		return response;
	},
};

export default MessageRobotWebhookPushOperate;
