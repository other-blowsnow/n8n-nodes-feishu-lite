import { IExecuteFunctions, IRequestOptions } from 'n8n-workflow';
import {
	IAdditionalCredentialOptions,
	IOAuth2Options,
} from 'n8n-workflow/dist/esm/interfaces';

class RequestUtils {
	static async originRequest(
		this: IExecuteFunctions,
		options: IRequestOptions,
		clearAccessToken = false,
	) {
		let authentication = this.getNodeParameter('authentication', 0) as string;

		let additionalCredentialOptions = {} as IAdditionalCredentialOptions

		if (authentication === 'feishuCredentialsApi') {
			const credentials = await this.getCredentials(authentication);

			options.baseURL = `https://${credentials.baseUrl}`;

			additionalCredentialOptions = {
				// @ts-ignore
				credentialsDecrypted: {
					data: {
						...credentials,
						accessToken: clearAccessToken ? '' : credentials.accessToken,
					},
				},
			};
		}else if (authentication === 'feishuOauth2Api') {

			options.baseURL = `https://open.feishu.cn`;

			let oauth2 = {
				keepBearer: true
			} as IOAuth2Options

			return this.helpers.requestOAuth2
				.call(this, authentication, options, oauth2)
		}else if (authentication === 'feishuBotWebhookApi') {
			throw new Error('自定义机器人 Webhook 凭证仅支持“消息 > 机器人推送”操作');
		}

		return this.helpers.requestWithAuthentication
			.call(this, authentication, options, additionalCredentialOptions)
	}

	static async request(this: IExecuteFunctions, options: IRequestOptions) {
		if (options.json === undefined) options.json = true;

		return RequestUtils.originRequest.call(this, options).then((data) => {
			const handleResponse = (data: any) => {
				if (data.code && data.code !== 0) {
					throw new Error(
						`Request Error: ${data.code}, ${data.msg} \n ` + JSON.stringify(data.error),
					);
				}
				return data;
			};

			// 处理一次accesstoken过期的情况
			if (data.code && data.code === 99991663) {
				return RequestUtils.originRequest.call(this, options, true).then((data) => {
					return handleResponse(data);
				});
			}

			return handleResponse(data);
		});
	}
}

export default RequestUtils;
