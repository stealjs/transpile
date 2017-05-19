/**
 * Creates a graph of supported format transforms
 *
 * @param {Array<string>} transforms An array of supported transformations
 *                        with the shape `formatA_formatB`; where formatA is
 *                        the source format and formatB the destination format
 * @return {Object} A graph of supported transformations, e.g:
 *
 * ```
 * {
 *   amd: { cjs: {} },
 *   cjs: { steal: {} },
 *   steal: {}
 * }
 * ```
 *
 * The graph above indicates that's possible to transform from `amd` to `cjs`,
 * and from `cjs` to the `steal` format.
 */
module.exports = function(transforms) {
	var graph = makeEmptyGraph();

	transforms.forEach(function(transform) {
		var parts = transform.split("_");

		var source = parts[0];
		var dest = parts[1];

		graph[source] = graph[source] || makeEmptyGraph();
		graph[dest] = graph[dest] || makeEmptyGraph();

		if (source === dest) {
			// Prevent duplicating `graph[source]` in `graph[source][dest]`
			graph[source][dest] = makeEmptyGraph();
		}
		else {
			// use a shallow clone of `graph[dest]` to avoid a recursive graph
			graph[source][dest] = Object.assign({}, graph[dest]);
		}
	});

	return graph;
};

function makeEmptyGraph() {
	return Object.create(null);
}
