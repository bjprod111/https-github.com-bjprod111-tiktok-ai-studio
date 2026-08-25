import { ingestEnabledSources } from './pipeline.js';

const results = await ingestEnabledSources();
console.log(JSON.stringify({ service: 'new-age-news', results }, null, 2));
