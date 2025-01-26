/**
 * AWS Lambda handler exposing Milenage as a REST API.
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generate3GAuthVector, AuthVector } from './lib/milenage';

export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        // event.body may contain or NOT the JSON input
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Request body is empty.'
                }),
            };
        }

        const body = JSON.parse(event.body);
        const { op, key } = body;

        if (!op || !key) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Missing "op" or "key" in request body.'
                }),
            };
        }

        // Generate the 3G authentication vector
        const authVector: AuthVector = generate3GAuthVector(key, op);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authVector),
        };
    } catch (err) {
        console.error('Error generating 3G Auth Vector:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}