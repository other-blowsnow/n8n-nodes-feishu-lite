import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';

const WikiGetSpaceNode: ResourceOperations = {
	name: '获取知识空间节点信息',
	value: 'wiki:getSpaceNode',
	options: [
		{
			displayName: 'token',
			name: 'token',
			type: 'string',
			required: true,
			default: '',
			description: '知识库节点或对应云文档的实际 token。',
		},
		{
			displayName: '文档类型',
			name: 'obj_type',
			type: 'options',
			default: 'wiki',
			options: [
				{
					name: '旧版文档',
					value: 'doc',
				},
				{
					name: '新版文档',
					value: 'docx',
				},
				{
					name: '表格',
					value: 'sheet',
				},
				{
					name: '思维导图',
					value: 'mindnote',
				},
				{
					name: '多维表格',
					value: 'bitable',
				},
				{
					name: '文件',
					value: 'file',
				},
				{
					name: '幻灯片',
					value: 'slides',
				},
				{
					name: '知识库节点',
					value: 'wiki',
				},
			],
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const token = this.getNodeParameter('token', index) as string;
        const obj_type = this.getNodeParameter('obj_type', index, 'wiki') as string;

        const qs = {
			token,
			obj_type,
		};

		return RequestUtils.request.call(this, {
			method: 'GET',
			url: `/open-apis/wiki/v2/spaces/get_node/`,
            qs,
		});
	},
};

export default WikiGetSpaceNode;
