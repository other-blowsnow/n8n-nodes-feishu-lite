import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';
import RequestUtils from '../../../help/utils/RequestUtils';

// @ts-ignore
const ExportDataTableToBitableOperate: ResourceOperations = {
	name: '导出多维表格',
	description: '导出数据到飞书多维表格',
	value: 'bitable:aggregate:copyDataTableToBitable',
	options: [
		{
			displayName: '多维表格 Token',
			name: 'app_toke',
			type: 'string',
			required: true,
			default: '',
			description: '多维表格 App 的唯一标识。',
		},
		{
			displayName: '多维表格 ID',
			name: 'table_id',
			type: 'string',
			required: true,
			default: '',
			description: '多维表格数据表的唯一标识。',
		},

		// 是否自动映射
		{
			displayName: '是否自动映射字段',
			name: 'autoMapping',
			type: 'boolean',
			default: true,
		},
		{
			// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
			displayName: '导出的字段',
			name: 'fields',
			type: 'fixedCollection',
			default: [],
			typeOptions: {
				multipleValues: true,
			},
			options: [
				{
					name: 'values',
					displayName: '字段映射',
					values: [
						{
							displayName: 'dataTable字段名称',
							name: 'field',
							type: 'string',
							default: '',
							requiresDataPath: 'single'
						},
						{
							displayName: '飞书字段名称',
							name: 'feishuField',
							type: 'string',
							default: '',
						},
					],
				},
			],
			displayOptions: {
				show: {
					autoMapping: [false],
				}
			}
		},


	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const items = this.getInputData()
		const rows = items.map((item) => item.json);
		const app_token = this.getNodeParameter('app_toke', index) as string;
		const table_id = this.getNodeParameter('table_id', index) as string;

		// 如果没有数据，则返回空
		if (rows.length === 0) return {};

		let autoMapping = this.getNodeParameter('autoMapping', index) as boolean;
		let fieldMapping = {}
		if (!autoMapping){
			let fieldOptions = this.getNodeParameter('fields', index) as IDataObject;
			let fieldMappingList = fieldOptions.values as IDataObject[];
			for (let fieldMappingItem of fieldMappingList) {
				// @ts-ignore
				fieldMapping[fieldMappingItem.field] = fieldMappingItem.feishuField;
			}
		}else{
			Object.keys(rows[0]).forEach((key) => {
				// @ts-ignore
				fieldMapping[key] = key;
			})
		}


		let records = []
		for (const row of rows) {
			let fields = {}
			for (const field of Object.keys(fieldMapping)) {
				// @ts-ignore
				fields[fieldMapping[field]] = row[field]
			}
			records.push({
				fields: fields
			})
		}

		const qs : any = {}
		const body = {
			"records": records
		}

		return RequestUtils.request.call(this, {
			method: 'POST',
			url: `/open-apis/bitable/v1/apps/${app_token}/tables/${table_id}/records/batch_create`,
			qs,
			body: body
		});
	},
};

export default ExportDataTableToBitableOperate;
