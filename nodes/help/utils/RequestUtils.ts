import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { IHttpRequestOptions } from 'n8n-workflow/dist/Interfaces';

class RequestUtils {
	static async originRequest(
		this: IExecuteFunctions,
		options: IHttpRequestOptions,
		clearAccessToken = false,
	) {
		const credentials = await this.getCredentials('feishuCredentialsApi');

		options.ignoreHttpStatusErrors = true;

		return this.helpers.httpRequestWithAuthentication.call(this, 'feishuCredentialsApi', options, {
			// @ts-ignore
			credentialsDecrypted: {
				data: {
					...credentials,
					accessToken: clearAccessToken ? '' : credentials.accessToken,
				},
			},
		});
	}

	static async request(this: IExecuteFunctions, options: IHttpRequestOptions) {
		return RequestUtils.originRequest.call(this, options).then((data) => {

			const handleResponse = (data: any) => {
				if (data.code && data.code !== 0) {
					throw new NodeOperationError(this.getNode(), `Request Error: ${data.code}, ${data.msg} \n ` + JSON.stringify(data.error));
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
