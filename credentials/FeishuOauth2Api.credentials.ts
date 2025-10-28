import { ICredentialType, INodeProperties } from 'n8n-workflow';

// eslint-disable-next-line n8n-nodes-base/cred-class-name-missing-oauth2-suffix
export class FeishuOauth2Api implements ICredentialType {
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-name-missing-oauth2
	name = 'feishuOauth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Feishu OAuth2 API';

	// @ts-ignore
	icon = 'file:icon.png';
	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			required: true,
			default: 'https://accounts.feishu.cn/open-apis/authen/v1/authorize',
			type: 'string',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			required: true,
			default: 'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
			type: 'string',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			required: true,
			default: 'bitable:app wiki:wiki offline_access event:ip_list',
			description:
				'参考权限：https://open.feishu.cn/document/server-docs/application-scope/scope-list',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}
