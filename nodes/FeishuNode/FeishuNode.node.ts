import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import ResourceFactory from '../help/builder/ResourceFactory';

const resourceBuilder = ResourceFactory.build(__dirname);

export class FeishuNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Feishu Node',
		name: 'feishuNode',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:icon.png',
		group: ['transform'],
		version: 1,
		description: 'Feishu Node',
		defaults: {
			name: 'Feishu Node',
		},
		usableAsTool: true,
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'feishuCredentialsApi',
				displayName: "应用级别凭证",
				required: true,
				displayOptions: {
					show: {
						authentication: ['feishuCredentialsApi'],
					},
				},
			},
			{
				name: 'feishuOauth2Api',
				displayName: "用户级别凭证",
				required: true,
				displayOptions: {
					show: {
						authentication: ['feishuOauth2Api'],
					},
				},
			},
			{
				name: 'feishuBotWebhookApi',
				displayName: '自定义机器人 Webhook 凭证',
				required: true,
				displayOptions: {
					show: {
						authentication: ['feishuBotWebhookApi'],
					},
				},
			},
		],
		properties: [
			{
				displayName: '凭证类型',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: '用户级别凭证',
						value: 'feishuOauth2Api',
					},
					{
						name: '应用级别凭证',
						value: 'feishuCredentialsApi',
					},
					{
						name: '自定义机器人 Webhook 凭证',
						value: 'feishuBotWebhookApi',
					},
				],
				default: 'feishuCredentialsApi',
			},
			...resourceBuilder.build()
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let responseData: IDataObject = {};
		let returnData = [];

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const callFunc = resourceBuilder.getCall(resource, operation);

		if (!callFunc) {
			throw new NodeOperationError(this.getNode(), '未实现方法: ' + resource + '.' + operation);
		}

		// 聚合
		if (operation.includes("aggregate")){
			responseData = await callFunc.call(this, 0);
			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject),
				{ itemData: { item: 0 } },
			);
			returnData.push(...executionData);

			return [returnData];
		}

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				this.logger.debug('call function', {
					resource,
					operation,
					itemIndex,
				});

				responseData = await callFunc.call(this, itemIndex);
			} catch (error) {
				this.logger.error('call function error', {
					resource,
					operation,
					itemIndex,
					errorMessage: error.message,
					stack: error.stack,
				});

				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					let errorJson = {
						error: error.message
					}
					if (error.name === 'NodeApiError'){
						errorJson.error = error?.cause?.error
					}

					returnData.push({
						json: errorJson,
						pairedItem: itemIndex,
					});
					continue;
				}else if (error.name === 'NodeApiError'){
					throw error
				}else {
					throw new NodeOperationError(this.getNode(), error, {
						message: error.message,
						itemIndex,
					});
				}
			}
			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject),
				{ itemData: { item: itemIndex } },
			);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}
