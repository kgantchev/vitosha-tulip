// src/data/index.js

export function importAllSnapshots() {
    const context = require.context('./snapshots', false, /\.json$/);
    return context.keys().map((key) => {
        const date = key.replace('./', '').replace('.json', '');
        const data = context(key);
        return { date, data };
    });
}