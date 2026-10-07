/**
 * Converts array of objects into CSV format string.
 */
function convertToCSV(dataArray, columns) {
    if (!dataArray || dataArray.length === 0) {
        return columns.join(',') + '\n';
    }

    const headerRow = columns.join(',');
    const bodyRows = dataArray.map(row => {
        return columns.map(col => {
            let val = row[col];
            if (val === null || val === undefined) val = '';
            if (typeof val === 'object') val = JSON.stringify(val);
            // Escape double quotes
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        }).join(',');
    });

    return [headerRow, ...bodyRows].join('\n');
}

module.exports = {
    convertToCSV
};
