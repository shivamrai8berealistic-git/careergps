import { CloudTasksClient } from '@google-cloud/tasks';

const client = new CloudTasksClient();

export async function enqueueTask(
  queueName: string, 
  url: string, 
  payload: any
) {
  // In development, just fire and forget a fetch request to simulate background task
  if (process.env.NODE_ENV === 'development') {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
    
    // Fire and forget
    fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(console.error);
    
    return;
  }

  // In production, use Google Cloud Tasks
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const locationId = process.env.GCLOUD_LOCATION || 'us-central1'; // Or read from env
  const serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL;
  
  if (!projectId) {
    console.error("Missing GOOGLE_CLOUD_PROJECT for Cloud Tasks");
    return;
  }

  const parent = client.queuePath(projectId, locationId, queueName);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${projectId}.web.app`;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      ...(serviceAccountEmail ? {
        oidcToken: {
          serviceAccountEmail,
        }
      } : {})
    },
  };

  try {
    await client.createTask({ parent, task });
  } catch (error) {
    console.error("Error enqueueing task:", error);
    throw error;
  }
}
