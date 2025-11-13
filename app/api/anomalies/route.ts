
import { NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

const es_client = new Client({ node: 'http://localhost:9200' });

export async function GET() {
  try {
    const response = await es_client.search({
      index: 'orbitwatch-metrics',
      body: {
        query: {
          bool: {
            must: [
              { term: { is_anomaly: true } },
              { range: { timestamp: { gte: 'now-1h' } } }
            ]
          }
        },
        size: 1000,
        sort: [{ timestamp: { order: 'desc' } }]
      }
    });

    const anomalies = response.hits.hits.map(hit => hit._source);
    return NextResponse.json(anomalies);
  } catch (error) {
    console.error('Error fetching anomalies from Elasticsearch:', error);
    return NextResponse.json({ error: 'Failed to fetch anomalies' }, { status: 500 });
  }
}
